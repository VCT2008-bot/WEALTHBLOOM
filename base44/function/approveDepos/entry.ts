import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { PERIOD_DAYS, PERIOD_LABELS, maturityDate, projectedEarnings, formatNaira } from '../../shared/finance.ts';
import { isAdminLike } from '../../shared/auth.ts';

// Admin approves a pending deposit. This is the ONLY path that creates an investment and
// records fees/transactions — financial values are never set from the frontend.
// On success, a payment confirmation receipt email is sent to the member.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();
    if (!admin || !isAdminLike(admin.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const depositId = body.deposit_id;
    const note = body.note || '';
    if (!depositId) return Response.json({ error: 'deposit_id required' }, { status: 400 });

    const deposits = await base44.asServiceRole.entities.Deposit.filter({ id: depositId });
    if (!deposits.length) return Response.json({ error: 'Deposit not found' }, { status: 404 });
    const deposit = deposits[0];
    if (deposit.status !== 'pending' && deposit.status !== 'processing') {
      return Response.json({ error: 'Deposit already processed' }, { status: 400 });
    }

    const rates = await base44.asServiceRole.entities.InvestmentRate.filter({ status: 'current' });
    const rate = rates.length ? rates[0] : { annual_rate: 0, source: 'Administrator-configured rate' };
    const periodDays = PERIOD_DAYS[deposit.investment_period];
    const startDate = new Date().toISOString();
    const matDate = maturityDate(startDate, periodDays);
    const earnings = projectedEarnings(deposit.investment_amount, rate.annual_rate, periodDays);
    const currentBalance = Math.round((deposit.investment_amount + earnings) * 100) / 100;

    // 1. Mark deposit successful
    await base44.asServiceRole.entities.Deposit.update(depositId, {
      status: 'successful', admin_note: note, processed_date: new Date().toISOString()
    });

    // 2. Create the investment
    const investment = await base44.asServiceRole.entities.Investment.create({
      user_id: deposit.user_id, user_name: deposit.user_name, user_email: deposit.user_email,
      principal: deposit.investment_amount, deposit_fee: deposit.service_fee,
      total_paid: deposit.total_payment, current_balance: currentBalance, earnings,
      rate_annual: rate.annual_rate, investment_period: deposit.investment_period,
      period_days: periodDays, start_date: startDate, maturity_date: matDate,
      status: 'active', withdrawable: false, deposit_id: depositId
    });

    await base44.asServiceRole.entities.Deposit.update(depositId, { investment_id: investment.id });

    // 3. Record transactions (deposit, investment, deposit service fee)
    const ref = deposit.payment_reference;
    await base44.asServiceRole.entities.Transaction.bulkCreate([
      { user_id: deposit.user_id, user_name: deposit.user_name, user_email: deposit.user_email,
        type: 'deposit', amount: deposit.total_payment, fee: deposit.service_fee,
        net_amount: deposit.investment_amount, reference: ref, status: 'completed',
        description: `Deposit for ${PERIOD_LABELS[deposit.investment_period]} investment`, investment_id: investment.id, related_id: depositId },
      { user_id: deposit.user_id, user_name: deposit.user_name, user_email: deposit.user_email,
        type: 'investment', amount: deposit.investment_amount, fee: 0,
        net_amount: deposit.investment_amount, reference: ref, status: 'completed',
        description: `Investment activated (${PERIOD_LABELS[deposit.investment_period]})`, investment_id: investment.id, related_id: depositId },
      { user_id: deposit.user_id, user_name: deposit.user_name, user_email: deposit.user_email,
        type: 'deposit_service_fee', amount: deposit.service_fee, fee: deposit.service_fee,
        net_amount: deposit.service_fee, reference: ref, status: 'completed',
        description: 'Deposit service fee', investment_id: investment.id, related_id: depositId }
    ]);

    // 4. In-app notification
    await base44.asServiceRole.entities.Notification.create({
      user_id: deposit.user_id, title: 'Investment Active',
      message: `Your investment of ${formatNaira(deposit.investment_amount)} is now active and earning variable returns. Matures on ${new Date(matDate).toLocaleDateString()}.`,
      type: 'investment', read: false, link: '/my-investments', related_id: investment.id
    });

    // 5. Payment confirmation receipt email (only on successful/confirmed payment)
    const now = new Date();
    const receiptBody =
`WEALTHBLOOM — PAYMENT CONFIRMATION RECEIPT
DEMO / SIMULATION — NO REAL MONEY TRANSACTION

Member: ${deposit.user_name || '—'}
Transaction ID / Reference: ${ref || '—'}
Investment Amount: ${formatNaira(deposit.investment_amount)}
Deposit Service Fee: ${formatNaira(deposit.service_fee)}
Total Amount Paid: ${formatNaira(deposit.total_payment)}
Investment Period: ${PERIOD_LABELS[deposit.investment_period] || deposit.investment_period}
Investment Start Date: ${new Date(startDate).toLocaleString()}
Investment Maturity Date: ${new Date(matDate).toLocaleString()}
Applicable Investment Rate: ${rate.annual_rate}% annual (variable — may change based on prevailing market conditions)
Payment Status: Successful
Date / Time: ${now.toLocaleString()}

Investment returns are variable and may change based on prevailing market conditions. Past performance does not guarantee future results.

— The WEALTHBLOOM Team`;
    const receiptSubject = 'WEALTHBLOOM Payment Confirmation Receipt';
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: deposit.user_email, from_name: 'WEALTHBLOOM', subject: receiptSubject, body: receiptBody
      });
      await base44.asServiceRole.entities.EmailLog.create({
        user_id: deposit.user_id, user_name: deposit.user_name, email: deposit.user_email,
        email_type: 'payment_receipt', status: 'sent', subject: receiptSubject, body: receiptBody
      });
    } catch (e) {
      await base44.asServiceRole.entities.EmailLog.create({
        user_id: deposit.user_id, user_name: deposit.user_name, email: deposit.user_email,
        email_type: 'payment_receipt', status: 'failed', subject: receiptSubject, error: e.message, body: receiptBody
      });
    }

    // 6. Audit log
    await base44.asServiceRole.entities.AuditLog.create({
      admin_id: admin.id, admin_name: admin.full_name, action: 'deposit_approval',
      affected_user: deposit.user_id, affected_transaction: depositId,
      description: `Approved deposit ${ref} (${formatNaira(deposit.investment_amount)}) for ${deposit.user_email}`
    });

    return Response.json({ ok: true, investment_id: investment.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}