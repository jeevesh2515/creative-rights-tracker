import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { requireAuth } from '@/lib/apiSecurity';
import { DistributionPayload } from '@/lib/types';

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

    // Create distribution record in database
    const { data: distributionData, error: distributionError } = await supabaseAdmin
      .from('distributions')
      .insert([
        {
          project_id: payload.project_id,
          initiated_by: userId,
          total_amount: payload.total_amount,
          status: 'pending',
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

    // Log to activity table
    const { error: auditError } = await supabaseAdmin
      .from('activity')
      .insert([
        {
          user_id: userId,
          action: 'distribute_revenue',
          project_id: payload.project_id,
          details: {
            distribution_id: distributionData.id,
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
        status: 'success',
        message: 'Distribution created successfully',
        distributionId: distributionData.id,
        txHash: `0x${Math.random().toString(16).slice(2)}`, // Placeholder for real tx hash
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
