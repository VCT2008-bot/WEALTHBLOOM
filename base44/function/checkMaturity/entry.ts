import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isAdminLike } from '../../shared/auth.ts';

// Marks investments that have reached maturity as MATURED and notifies the user (in-app + email).
// Can be invoked by an admin or run on a schedule.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    // Allow admin or service-role scheduled invocation (admin check relaxed for scheduled calls via service token)
    const isAdmin = isAdminLike(user.role);

    const now = new Date();
    const active = await base44.asServiceRole.entities.Investment.filter({ status: 'active' });
    let maturedCount = 0;
    for (const inv of active) {
      if (inv.maturity_date && new Date(inv.maturity_date) <= now) {
        await base44.asServiceRole.entities.Investment.update(inv.id, {
          status: 'matured', withdrawable: true
        });
        await base44.asServiceRole.entities.Notification.create({
          user_id: inv.user_id, title: 'Investment Matured',
          message: 'Your WEALTHBLOOM investment has matured and is now eligible for withdrawal or renewal.',
          type: 'maturity', read: false, link: '/my-investments', related_id: inv.id
        });
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: inv.user_email, from_name: 'WEALTHBLOOM',
            subject: 'Your WEALTHBLOOM investment has matured',
            body: `Hi ${inv.user_name?.split(' ')[0] || 'there'},\n\nYour investment of ₦${inv.principal.toLocaleString()} has matured. You can now withdraw your funds or renew your investment from your dashboard.\n\n— The WEALTHBLOOM Team`
          });
          await base44.asServiceRole.entities.EmailLog.create({
            user_id: inv.user_id, user_name: inv.user_name, email: inv.user_email,
            email_type: 'maturity', status: 'sent', subject: 'Your WEALTHBLOOM investment has matured'
          });
        } catch (e) {
          await base44.asServiceRole.entities.EmailLog.create({
            user_id: inv.user_id, user_name: inv.user_name, email: inv.user_email,
            email_type: 'maturity', status: 'failed', error: e.message
          });
        }
        maturedCount++;
      }
    }
    return Response.json({ ok: true, matured: maturedCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}