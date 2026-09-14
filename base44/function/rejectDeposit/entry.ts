import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isAdminLike } from '../../shared/auth.ts';

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
    if (deposit.status === 'successful') return Response.json({ error: 'Cannot reject a successful deposit' }, { status: 400 });

    await base44.asServiceRole.entities.Deposit.update(depositId, {
      status: 'rejected', admin_note: note, processed_date: new Date().toISOString()
    });

    await base44.asServiceRole.entities.Notification.create({
      user_id: deposit.user_id, title: 'Deposit Rejected',
      message: `Your deposit ${deposit.payment_reference} was rejected. ${note || 'Please contact support.'}`,
      type: 'deposit', read: false, related_id: depositId
    });

    await base44.asServiceRole.entities.AuditLog.create({
      admin_id: admin.id, admin_name: admin.full_name, action: 'deposit_rejection',
      affected_user: deposit.user_id, affected_transaction: depositId,
      description: `Rejected deposit ${deposit.payment_reference} for ${deposit.user_email}`
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}