import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isAdminLike } from '../../shared/auth.ts';

// Aggregated admin dashboard statistics computed server-side from real records.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();
    if (!admin || !isAdminLike(admin.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const [users, investments, deposits, withdrawals, transactions] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Investment.list(),
      base44.asServiceRole.entities.Deposit.list(),
      base44.asServiceRole.entities.Withdrawal.list(),
      base44.asServiceRole.entities.Transaction.list()
    ]);

    const sum = (arr, f) => arr.reduce((a, r) => a + (Number(r[f]) || 0), 0);
    const totalInvested = sum(investments, 'principal');
    const portfolioValue = sum(investments, 'current_balance');
    const totalEarnings = sum(investments, 'earnings');
    const depositFees = sum(transactions.filter(t => t.type === 'deposit_service_fee'), 'amount');
    const withdrawalFees = sum(transactions.filter(t => t.type === 'withdrawal_service_fee'), 'amount');
    const totalFees = depositFees + withdrawalFees;
    const activeInvestments = investments.filter(i => i.status === 'active').length;
    const maturedInvestments = investments.filter(i => i.status === 'matured').length;
    const pendingDeposits = deposits.filter(d => d.status === 'pending').length;
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;

    return Response.json({
      ok: true,
      stats: {
        totalMembers: users.length,
        totalInvested, portfolioValue, totalEarnings,
        depositFees, withdrawalFees, totalFees,
        activeInvestments, maturedInvestments,
        pendingDeposits, pendingWithdrawals
      },
      recentDeposits: deposits.slice(-5).reverse(),
      recentWithdrawals: withdrawals.slice(-5).reverse()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}