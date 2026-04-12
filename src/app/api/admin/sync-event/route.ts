import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

interface SyncEventPayload {
  eventName: string;
  sender: string;
  totalAmount: string;
  timestamp: number;
  transactionHash?: string;
  blockNumber?: number;
}

export async function POST(request: NextRequest) {
  try {
    const payload: SyncEventPayload = await request.json();

    // Validate payload
    if (payload.eventName !== 'RevenueDistributed' || !payload.sender || !payload.totalAmount) {
      return NextResponse.json(
        { error: 'Invalid event payload' },
        { status: 400 }
      );
    }

    // Insert event into activity table
    const { data: activityRecord, error: insertError } = await supabaseAdmin
      .from('activity')
      .insert([
        {
          user_id: payload.sender, // or extract from address mapping
          action: 'event_revenue_distributed',
          details: {
            event_name: payload.eventName,
            amount: payload.totalAmount,
            contract_timestamp: payload.timestamp,
            tx_hash: payload.transactionHash,
            block_number: payload.blockNumber,
          },
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Event sync error:', insertError);
      return NextResponse.json(
        { error: 'Failed to sync event' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        id: activityRecord.id,
        action: activityRecord.action,
        created_at: activityRecord.created_at,
        details: activityRecord.details,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Sync event error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
