import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Admin updates platform fees. Previous fee is preserved in the audit log; historical transactions are untouched.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();
    if (!admin || admin.role !== 'super_admin') return Response.json({ error: 'Forbidden — Super Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const depositFee = body.deposit_fee !== undefined ? Number(body.deposit_fee) : null;
    const withdrawalFee = body.withdrawal_fee !== undefined ? Number(body.withdrawal_fee) : null;
    const reason = body.reason || '';

    const settings = await base44.asServiceRole.entities.PlatformSetting.list();
    let setting = settings[0];
    if (!setting) {
      setting = await base44.asServiceRole.entities.PlatformSetting.create({
        deposit_fee: depositFee ?? 50, withdrawal_fee: withdrawalFee ?? 50
      });
    } else {
      const prevDeposit = setting.deposit_fee;
      const prevWithdrawal = setting.withdrawal_fee;
      await base44.asServiceRole.entities.PlatformSetting.update(setting.id, {
        deposit_fee: depositFee ?? setting.deposit_fee,
        withdrawal_fee: withdrawalFee ?? setting.withdrawal_fee
      });
      await base44.asServiceRole.entities.AuditLog.create({
        admin_id: admin.id, admin_name: admin.full_name, action: 'fee_change',
        affected_user: '-', affected_transaction: '-',
        description: `Fees changed — deposit: ${prevDeposit}→${depositFee ?? prevDeposit}; withdrawal: ${prevWithdrawal}→${withdrawalFee ?? prevWithdrawal}. ${reason}`
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}