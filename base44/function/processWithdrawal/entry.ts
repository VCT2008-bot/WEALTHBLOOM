import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { formatNaira } from '../../shared/finance.ts';
import { isAdminLike } from '../../shared/auth.ts';

// Admin completes a withdrawal: updates investment balance, records fee + withdrawal transactions, notifies user.
// On completion, a withdrawal confirmation receipt email is sent to the member.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();
    if (!admin || !isAdminLike(admin.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const withdrawalId = body.withdrawal_id;
    const action = body.action || 'complete'; // complete | reject
    const note = body.note || '';
    if (!withdrawalId) return Response.json({ error: 'withdrawal_id required' }, { status: 400 });

    const withdrawals = await base44.asServiceRole.entities.Withdrawal.filter({ id: withdrawalId });
    if (!withdrawals.length) return Response.json({ error: 'Withdrawal not found' }, { status: 404 });
    const w = withdrawals[0];
    if (w.status === 'completed' || w.status === 'rejected') {
      return Response.json({ error: 'Withdrawal already processed' }, { status: 400 });
    }

    const investments = await base44.asServiceRole.entities.Investment.filter({ id: w.investment_id });
    const inv = investments[0];

    if (action === 'reject') {
      await base44.asServiceRole.entities.Withdrawal.update(withdrawalId, {
        status: 'rejected', admin_note: note, processed_date: new Date().toISOString()
      });
      await base44.asServiceRole.entities.Notification.create({
        user_id: w.user_id, title: 'Withdrawal Rejected',
        message: `Your withdrawal request was rejected. ${note || 'Please contact support.'}`,
        type: 'withdrawal', read: false, related_id: withdrawalId
      });
      await base44.asServiceRole.entities.AuditLog.create({
        admin_id: admin.id, admin_name: admin.full_name, action: 'withdrawal_rejection',
        affected_user: w.user_id, affected_transaction: withdrawalId,
        description: `Rejected withdrawal for ${w.user_email}`
      });
      return Response.json({ ok: true });
    }

    // Complete the withdrawal
    const newBalance = Math.round((inv.current_balance - w.amount) * 100) / 100;
    const newStatus = newBalance <= 0 ? 'withdrawn' : inv.status;
    await base44.asServiceRole.entities.Investment.update(inv.id, {
      current_balance: newBalance, status: newStatus,
      withdrawable: newBalance > 0 && inv.status === 'matured'
    });

    await base44.asServiceRole.entities.Withdrawal.update(withdrawalId, {
      status: 'completed', admin_note: note, processed_date: new Date().toISOString()
    });

    const ref = 'WB-WD-' + Date.now();
    await base44.asServiceRole.entities.Transaction.bulkCreate([
      { user_id: w.user_id, user_name: w.user_name, user_email: w.user_email,
        type: 'withdrawal', amount: w.amount, fee: w.service_fee, net_amount: w.net_payout,
        reference: ref, status: 'completed', description: `${w.withdrawal_type === 'matured' ? 'Matured' : 'Early'} withdrawal`,
        investment_id: inv.id, related_id: withdrawalId },
      { user_id: w.user_id, user_name: w.user_name, user_email: w.user_email,
        type: 'withdrawal_service_fee', amount: w.service_fee, fee: w.service_fee, net_amount: w.service_fee,
        reference: ref, status: 'completed', description: 'Withdrawal service fee',
        investment_id: inv.id, related_id: withdrawalId }
    ]);

    await base44.asServiceRole.entities.Notification.create({
      user_id: w.user_id, title: 'Withdrawal Completed',
      message: `Your withdrawal of ${formatNaira(w.amount)} was completed. Net payout ${formatNaira(w.net_payout)} (after ${formatNaira(w.service_fee)} fee).`,
      type: 'withdrawal', read: false, link: '/transactions', related_id: withdrawalId
    });

    // Withdrawal confirmation receipt email (only on completed status)
    const now = new Date();
    const wTypeLabel = w.withdrawal_type === 'matured' ? 'Matured Withdrawal' : 'Early Withdrawal';
    const receiptBody =
`WEALTHBLOOM — WITHDRAWAL CONFIRMATION RECEIPT
DEMO / SIMULATION — NO REAL MONEY TRANSACTION

Member: ${w.user_name || '—'}
Withdrawal ID / Reference: ${ref}
Investment ID: ${inv.id}
Withdrawal Amount: ${formatNaira(w.amount)}
Withdrawal Service Fee: ${formatNaira(w.service_fee)}
Net Amount: ${formatNaira(w.net_payout)}
Withdrawal Type: ${wTypeLabel}
Withdrawal Status: Completed
Date / Time: ${now.toLocaleString()}

Note: There is no additional early-withdrawal penalty. The only withdrawal fee is the flat ${formatNaira(w.service_fee)} service fee.

— The WEALTHBLOOM Team`;
    const receiptSubject = 'WEALTHBLOOM Withdrawal Confirmation Receipt';
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: w.user_email, from_name: 'WEALTHBLOOM', subject: receiptSubject, body: receiptBody
      });
      await base44.asServiceRole.entities.EmailLog.create({
        user_id: w.user_id, user_name: w.user_name, email: w.user_email,
        email_type: 'withdrawal_receipt', status: 'sent', subject: receiptSubject, body: receiptBody
      });
    } catch (e) {
      await base44.asServiceRole.entities.EmailLog.create({
        user_id: w.user_id, user_name: w.user_name, email: w.user_email,
        email_type: 'withdrawal_receipt', status: 'failed', subject: receiptSubject, error: e.message, body: receiptBody
      });
    }

    await base44.asServiceRole.entities.AuditLog.create({
      admin_id: admin.id, admin_name: admin.full_name, action: 'withdrawal_approval',
      affected_user: w.user_id, affected_transaction: withdrawalId,
      description: `Completed withdrawal of ${formatNaira(w.amount)} for ${w.user_email}`
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}