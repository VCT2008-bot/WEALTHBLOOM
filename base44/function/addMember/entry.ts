import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isAdminLike } from '../../shared/auth.ts';

// Admin manually adds a new member. Financial values start at ₦0 — no investment/transaction created.
// Optionally sends the welcome email.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();
    if (!admin || !isAdminLike(admin.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { full_name, email, phone, account_status, send_welcome } = body;
    if (!full_name || !email) return Response.json({ error: 'full_name and email required' }, { status: 400 });

    let createdUser;
    try {
      createdUser = await base44.asServiceRole.users.inviteUser(email, 'user');
    } catch (e) {
      return Response.json({ error: 'Could not invite user: ' + e.message }, { status: 400 });
    }

    // Persist profile extras
    if (phone || account_status) {
      try {
        await base44.asServiceRole.entities.User.update(createdUser.id, {
          phone: phone || '',
          account_status: account_status || 'active'
        });
      } catch (e) {}
    }

    await base44.asServiceRole.entities.AuditLog.create({
      admin_id: admin.id, admin_name: admin.full_name, action: 'member_creation',
      affected_user: createdUser.id, affected_transaction: '-',
      description: `Created member ${email}`
    });

    if (send_welcome) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email, from_name: 'WEALTHBLOOM',
          subject: 'Welcome to WEALTHBLOOM — Grow Your Wealth. Watch It Bloom.',
          body: `Hi ${full_name.split(' ')[0]},\n\nWelcome to WEALTHBLOOM! Your account has been created by an administrator.\n\nWEALTHBLOOM is an investment-management platform. Investment returns are variable and may change based on prevailing market conditions. Your starting balance is ₦0.00.\n\n— The WEALTHBLOOM Team`
        });
        await base44.asServiceRole.entities.EmailLog.create({
          user_id: createdUser.id, user_name: full_name, email,
          email_type: 'welcome', status: 'sent', subject: 'Welcome to WEALTHBLOOM'
        });
      } catch (e) {
        await base44.asServiceRole.entities.EmailLog.create({
          user_id: createdUser.id, user_name: full_name, email,
          email_type: 'welcome', status: 'failed', error: e.message
        });
      }
    }

    return Response.json({ ok: true, user_id: createdUser.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}