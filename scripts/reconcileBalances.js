#!/usr/bin/env node

/**
 * Balance Reconciliation Job
 * Runs periodically to verify contract balance matches database
 * Usage: node scripts/reconcileBalances.js
 */

require('dotenv').config({ path: '.env.local' });

const { reconcileBalance, formatBalance } = require('../src/app/lib/balanceReconciliation');

(async () => {
  try {
    console.log('[reconcileBalances] Starting balance reconciliation...');
    
    const result = await reconcileBalance();
    
    console.log('[reconcileBalances] Reconciliation result:', {
      contractBalance: formatBalance(result.contractBalance),
      dbBalance: formatBalance(result.dbBalance),
      discrepancy: formatBalance(result.discrepancy),
      isReconciled: result.isReconciled,
    });

    if (!result.isReconciled) {
      console.warn('[reconcileBalances] ⚠️  DISCREPANCY DETECTED:', {
        contract: formatBalance(result.contractBalance),
        database: formatBalance(result.dbBalance),
        difference: formatBalance(result.discrepancy),
      });
      // In production, send alert/email here
      process.exit(0); // Still exit 0; discrepancy logged but not critical
    } else {
      console.log('[reconcileBalances] ✓ Balances reconciled successfully');
      process.exit(0);
    }
  } catch (error) {
    console.error('[reconcileBalances] Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
})();
