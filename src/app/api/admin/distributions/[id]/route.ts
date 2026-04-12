import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { requireAuth } from '@/lib/apiSecurity';
import { ethers } from 'ethers';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    requireAuth();

    const { id } = params;

    // Fetch distribution record
    const { data: distribution, error: fetchError } = await supabaseAdmin
      .from('distributions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !distribution) {
      return NextResponse.json({ error: 'Distribution not found' }, { status: 404 });
    }

    // If we have a tx hash, try to get receipt from blockchain
    let confirmations = 0;
    let blockConfirmed = false;

    if (distribution.tx_hash) {
      try {
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
        if (rpcUrl) {
          const provider = new ethers.JsonRpcProvider(rpcUrl);
          const receipt = await provider.getTransactionReceipt(distribution.tx_hash);

          if (receipt) {
            const currentBlockNumber = await provider.getBlockNumber();
            confirmations = currentBlockNumber - receipt.blockNumber;
            blockConfirmed = confirmations >= 5;

            // Update distribution record if not already updated
            if (!distribution.block_number && receipt.blockNumber) {
              await supabaseAdmin
                .from('distributions')
                .update({
                  block_number: receipt.blockNumber,
                  status: blockConfirmed ? 'confirmed' : 'confirming',
                })
                .eq('id', id);
            }
          }
        }
      } catch (rpcError) {
        console.error('RPC error fetching receipt:', rpcError);
        // Continue without RPC data
      }
    }

    return NextResponse.json(
      {
        id: distribution.id,
        project_id: distribution.project_id,
        status: distribution.status,
        tx_hash: distribution.tx_hash,
        block_number: distribution.block_number,
        confirmations,
        created_at: distribution.created_at,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Distribution status error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
