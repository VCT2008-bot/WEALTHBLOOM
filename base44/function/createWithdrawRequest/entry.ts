import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DEFAULT_WITHDRAWAL_FEE } from '../../shared/finance.ts';

// User creates a pending withdrawal request. Validates amount against investment balance.
// No early-withdrawal penalty — only the fixed ₦50 withdrawal service fee.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const investmentId = body.investment_id;
    const amount = Number(body.amount);
    if (!investmentId) return Response.json({ error: 'investment_id required' }, { status: 400 });
    if (!amount || amount <= 0) return Response.json({ error: 'Invalid amount' }, { status: 400 });

    const investments = await base44.entities.Investment.filter({ id: investmentId });
    if (!investments.length) return Response.json({ error: 'Investment not found' }, { status: 404 });
    const inv = investments[0];
    if (inv.user_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (inv.status !== 'active' && inv.status !== 'matured') {
      return Response.json({ error: 'Investment is not withdrawable' }, { status: 400 });
    }
    if (amount > inv.current_balance) {
      return Response.json({ error: 'Amount exceeds current balance' }, { status: 400 });
    }

    let fee = DEFAULT_WITHDRAWAL_FEE;
    try {
      const settings = await base44.asServiceRole.entities.PlatformSetting.list();
      if (settings.length && typeof settings[0].withdrawal_fee === 'number') fee = settings[0].withdrawal_fee;
    } catch (e) {}

    const net = Math.round((amount - fee) * 100) / 100;
    const withdrawalType = inv.status === 'matured' ? 'matured' : 'early';

    const withdrawal = await base44.entities.Withdrawal.create({
      user_id: user.id, user_name: user.full_name, user_email: user.email,
      investment_id: investmentId, amount, service_fee: fee, net_payout: net,
      withdrawal_type: withdrawalType, status: 'pending'
    });

    await base44.asServiceRole.entities.Notification.create({
      user_id: user.id, title: 'Withdrawal Submitted',
      message: `Your ${withdrawalType} withdrawal request of ₦${amount.toLocaleString()} is pending review. Service fee ₦${fee}. Net payout ₦${net.toLocaleString()}.`,
      type: 'withdrawal', read: false, related_id: withdrawal.id
    });

    return Response.json({ ok: true, withdrawal });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}