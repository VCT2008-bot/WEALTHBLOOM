import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DEFAULT_DEPOSIT_FEE, DEFAULT_WITHDRAWAL_FEE, PERIOD_DAYS, PERIOD_LABELS, deriveRates, maturityDate, projectedEarnings } from '../../shared/finance.ts';

// Sends the WEALTHBLOOM welcome email to a newly registered user and logs it.
// Triggered by the actual registration event (called from the Register page after verifyOtp).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const firstName = (user.full_name || 'there').split(' ')[0];
    const subject = 'Welcome to WEALTHBLOOM — Grow Your Wealth. Watch It Bloom.';
    const body = `Hi ${firstName},

Welcome to WEALTHBLOOM! Your account has been successfully created.

WEALTHBLOOM is an investment-management platform that lets you invest your money over fixed periods (30 days, 90 days, 6 months, or 1 year) and watch it grow. Investment returns are variable and may change based on prevailing market conditions — past performance does not guarantee future results.

You currently have no investment. Your starting balance is ₦0.00. When you're ready, log in to your dashboard and start your first investment.

Log in to your dashboard to view the current investment rate and begin: https://wealthbloom.app

— The WEALTHBLOOM Team`;

    // Log the email attempt first (pending), then send.
    const log = await base44.asServiceRole.entities.EmailLog.create({
      user_id: user.id,
      user_name: user.full_name,
      email: user.email,
      email_type: 'welcome',
      status: 'pending',
      subject
    });

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject,
        body,
        from_name: 'WEALTHBLOOM'
      });
      await base44.asServiceRole.entities.EmailLog.update(log.id, { status: 'sent' });
      await base44.asServiceRole.entities.Notification.create({
        user_id: user.id, title: 'Welcome to WEALTHBLOOM',
        message: 'Your account was created successfully. Start your first investment when you\'re ready.',
        type: 'account', read: false
      });
      return Response.json({ ok: true, status: 'sent' });
    } catch (sendErr) {
      await base44.asServiceRole.entities.EmailLog.update(log.id, { status: 'failed', error: sendErr.message || String(sendErr) });
      return Response.json({ ok: false, status: 'failed', error: sendErr.message }, { status: 200 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}