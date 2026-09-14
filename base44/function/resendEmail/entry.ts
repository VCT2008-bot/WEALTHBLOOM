import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isAdminLike } from '../../shared/auth.ts';

// Admin resends a failed email (welcome or any receipt) by its EmailLog id, or direct send by email.
// Receipt emails store their full body on the log, so the resend re-sends the exact receipt.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();
    if (!admin || !isAdminLike(admin.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const logId = body.log_id;

    let log;
    if (logId) {
      const logs = await base44.asServiceRole.entities.EmailLog.filter({ id: logId });
      if (!logs.length) return Response.json({ error: 'Log not found' }, { status: 404 });
      log = logs[0];
      await base44.asServiceRole.entities.EmailLog.update(logId, { status: 'pending', error: '' });
    } else {
      // Direct send (e.g. admin resending welcome to a member without an existing log)
      const email = body.email;
      const userName = body.user_name || 'there';
      if (!email) return Response.json({ error: 'email required' }, { status: 400 });
      log = await base44.asServiceRole.entities.EmailLog.create({
        user_id: body.user_id || null, user_name: userName, email,
        email_type: 'welcome', status: 'pending', subject: 'Welcome to WEALTHBLOOM'
      });
    }

    const subject = log.subject || 'Welcome to WEALTHBLOOM';
    const firstName = (log.user_name || 'there').split(' ')[0];
    const fallback = log.email_type === 'welcome'
      ? `Hi ${firstName},\n\nWelcome to WEALTHBLOOM! Your account has been successfully created.\n\nWEALTHBLOOM is an investment-management platform. Investment returns are variable and may change based on prevailing market conditions. Your starting balance is ₦0.00.\n\n— The WEALTHBLOOM Team`
      : `Hi ${firstName},\n\nThis is a message from WEALTHBLOOM.\n\n— The WEALTHBLOOM Team`;
    const bodyText = log.body || fallback;

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: log.email, from_name: 'WEALTHBLOOM', subject, body: bodyText
      });
      await base44.asServiceRole.entities.EmailLog.update(log.id, { status: 'sent' });
      return Response.json({ ok: true, status: 'sent' });
    } catch (e) {
      await base44.asServiceRole.entities.EmailLog.update(log.id, { status: 'failed', error: e.message });
      return Response.json({ ok: false, status: 'failed', error: e.message });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}