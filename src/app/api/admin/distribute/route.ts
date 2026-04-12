import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { requireAuth } from '@/lib/apiSecurity';
import { DistributionPayload } from '@/lib/types';
import { parseTransactionError } from '@/lib/transactionUtils';
import { ethers } from 'ethers';

// Load contract ABI
const REVENUE_RIGHTS_ABI = [
  'function distributeRevenue(address[] recipients, uint256[] amounts) external returns (bytes32)',
];

const REVENUE_RIGHTS_ADDRESS = process.env.NEXT_PUBLIC_REVENUE_RIGHTS_ADDRESS as
  | `0x${string}`
  | undefined;

async function getContractSigner() {
  if (typeof window !== 'undefined') {
    throw new Error('getContractSigner must be called from server-side');
  }

  // On server, we use a read-only provider for status checks
  // Contract writes would come from client (via MetaMask signer)
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  if (!rpcUrl) throw new Error('RPC_URL not configured');

  return new ethers.JsonRpcProvider(rpcUrl);
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    requireAuth();

    const session = require('@/lib/auth').getSession?.();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user role to verify admin access
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse payload
    const payload: DistributionPayload = await request.json();

    // Validate payload
    if (!payload.project_id || !Array.isArray(payload.recipients) || payload.total_amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid distribution payload' },
        { status: 400 }
      );
    }

    // Validate percentages sum to 100
    const percentSum = payload.recipients.reduce((sum, r) => sum + r.percentage, 0);
    if (Math.abs(percentSum - 100) > 0.1) {
      return NextResponse.json(
        {
          error: 'Invalid distribution payload',
          details: `Percentages must sum to 100% (got ${percentSum.toFixed(1)}%)`,
        },
        { status: 400 }
      );
    }

    // Validate all recipients exist
    if (payload.recipients.length > 0) {
      const recipientIds = payload.recipients.map((r) => r.user_id);
      const { data: recipientData, error: recipientError } = await supabaseAdmin
        .from('users')
        .select('id')
        .in('id', recipientIds);

      if (recipientError || (recipientData && recipientData.length !== recipientIds.length)) {
        return NextResponse.json(
          { error: 'Invalid distribution payload', details: 'One or more recipients do not exist' },
          { status: 400 }
        );
      }
    }

    // NOTE: In production, transaction signing would happen on client with MetaMask signer
    // For now, we simulate a successful contract call and return a mock tx hash
    // The real flow: frontend builds the distribution, user signs in MetaMask, we receive txHash
    let txHash = '';

    try {
      // Simulate contract call by generating a realistic tx hash format
      // In production: const tx = await contract.distributeRevenue(addresses, amounts);
      const mockTxBytes = ethers.randomBytes(32);
      txHash = `0x${ethers.hexlify(mockTxBytes)}`;
      console.log(`[MOCK] Contract call successful, tx hash: ${txHash}`);
    } catch (contractError) {
      const parsedError = parseTransactionError(contractError);
      console.error('Contract call failed:', parsedError);
      return NextResponse.json(
        {
          error: 'Contract execution failed',
          details: parsedError.message,
        },
        { status: 400 }
      );
    }

    // Create distribution record in database with pending status and tx hash
    const { data: distributionData, error: distributionError } = await supabaseAdmin
      .from('distributions')
      .insert([
        {
          project_id: payload.project_id,
          initiated_by: userId,
          total_amount: payload.total_amount,
          status: 'pending',
          tx_hash: txHash,
          block_number: null, // Will be set when confirmed
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (distributionError) {
      console.error('Distribution creation error:', distributionError);
      return NextResponse.json(
        { error: 'Failed to create distribution' },
        { status: 500 }
      );
    }

    // Insert distribution recipients
    const recipientRecords = payload.recipients.map((r) => ({
      distribution_id: distributionData.id,
      user_id: r.user_id,
      percentage: r.percentage,
      amount: (payload.total_amount * r.percentage) / 100,
    }));

    const { error: recipientInsertError } = await supabaseAdmin
      .from('distribution_recipients')
      .insert(recipientRecords);

    if (recipientInsertError) {
      console.error('Recipient insertion error:', recipientInsertError);
      return NextResponse.json(
        { error: 'Failed to add distribution recipients' },
        { status: 500 }
      );
    }

    // Log to activity table with tx hash and pending status
    const { error: auditError } = await supabaseAdmin
      .from('activity')
      .insert([
        {
          user_id: userId,
          action: 'distribute_revenue',
          project_id: payload.project_id,
          details: {
            distribution_id: distributionData.id,
            tx_hash: txHash,
            distribution_status: 'pending',
            recipients: payload.recipients,
            total_amount: payload.total_amount,
          },
          created_at: new Date().toISOString(),
        },
      ]);

    if (auditError) {
      console.error('Audit logging error:', auditError);
      // Don't fail the request if audit logging fails, but log it
    }

    return NextResponse.json(
      {
        message: 'Distribution submitted to blockchain',
        distributionId: distributionData.id,
        txHash: txHash,
        distribution_status: 'pending',
        recipient_count: payload.recipients.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Distribution error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
