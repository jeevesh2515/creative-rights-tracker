import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { requireAuth } from '@/lib/apiSecurity';
import { reconcileBalance, formatBalance } from '@/lib/balanceReconciliation';

export async function GET(request: NextRequest) {
  try {
    requireAuth();

    // Verify admin access
    const session = require('@/lib/auth').getSession?.();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Run reconciliation
    const result = await reconcileBalance();

    // Log to activity table
    await supabaseAdmin.from('activity').insert([
      {
        user_id: userId,
        action: 'manual_reconciliation',
        details: {
          contract_balance: formatBalance(result.contractBalance),
          db_balance: formatBalance(result.dbBalance),
          is_reconciled: result.isReconciled,
          discrepancy: formatBalance(result.discrepancy),
        },
        created_at: new Date().toISOString(),
      },
    ]);

    return NextResponse.json(
      {
        contractBalance: formatBalance(result.contractBalance),
        dbBalance: formatBalance(result.dbBalance),
        discrepancy: formatBalance(result.discrepancy),
        isReconciled: result.isReconciled,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reconciliation endpoint error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
