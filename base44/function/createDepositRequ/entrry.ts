import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DEFAULT_DEPOSIT_FEE, PERIOD_DAYS } from '../../shared/finance.ts';

// User creates a pending deposit request. Does NOT create an investment or change balances.
// The ₦50 fee is ADDED to the intended investment amount.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.data?.account_status && user.data.account_status !== 'active') {
      return Response.json({ error: 'Account is not active' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const investmentAmount = Number(body.investment_amount);
    const period = body.investment_period;
    const reference = body.payment_reference || ('WB-DEP-' + Date.now());

    if (!investmentAmount || investmentAmount < 1000) {
      return Response.json({ error: 'Minimum investment amount is ₦1,000' }, { status: 400 });
    }
    if (!PERIOD_DAYS[period]) {
      return Response.json({ error: 'Invalid investment period' }, { status: 400 });
    }

    // Pull platform fee from settings (fallback to default ₦50).
    let fee = DEFAULT_DEPOSIT_FEE;
    try {
      const settings = await base44.asServiceRole.entities.PlatformSetting.list();
      if (settings.length && typeof settings[0].deposit_fee === 'number') fee = settings[0].deposit_fee;
    } catch (e) {}

    const total = Math.round((investmentAmount + fee) * 100) / 100;

    const deposit = await base44.entities.Deposit.create({
      user_id: user.id,
      user_name: user.full_name,
      user_email: user.email,
      investment_amount: investmentAmount,
      service_fee: fee,
      total_payment: total,
      payment_reference: reference,
      investment_period: period,
      status: 'pending'
    });

    await base44.asServiceRole.entities.Notification.create({
      user_id: user.id, title: 'Investment Submitted',
      message: `Your investment of ₦${investmentAmount.toLocaleString()} (${period}) was submitted and is awaiting payment verification.`,
      type: 'deposit', read: false, related_id: deposit.id
    });

    return Response.json({ ok: true, deposit });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}