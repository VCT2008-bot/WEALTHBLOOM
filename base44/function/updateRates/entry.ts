import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { deriveRates } from '../../shared/finance.ts';

// Admin updates the investment rate. Previous rate is preserved as historical; change is audit-logged.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();
    if (!admin || admin.role !== 'super_admin') return Response.json({ error: 'Forbidden — Super Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const annual = Number(body.annual_rate);
    const source = body.source || 'Administrator-configured rate';
    const note = body.note || '';
    if (isNaN(annual) || annual < 0) return Response.json({ error: 'Invalid rate' }, { status: 400 });

    const { monthly, daily } = deriveRates(annual);

    // Mark existing current rate as historical (preserve it).
    const current = await base44.asServiceRole.entities.InvestmentRate.filter({ status: 'current' });
    let previous = 0;
    if (current.length) {
      previous = current[0].annual_rate;
      await base44.asServiceRole.entities.InvestmentRate.update(current[0].id, { status: 'historical' });
    }

    await base44.asServiceRole.entities.InvestmentRate.create({
      annual_rate: annual, monthly_rate: monthly, daily_rate: daily,
      source, effective_date: new Date().toISOString(), status: 'current',
      created_by: admin.full_name, note, previous_rate: previous
    });

    await base44.asServiceRole.entities.AuditLog.create({
      admin_id: admin.id, admin_name: admin.full_name, action: 'rate_change',
      affected_user: '-', affected_transaction: '-',
      description: `Investment rate changed from ${previous}% to ${annual}% (annual). Source: ${source}. ${note}`
    });

    return Response.json({ ok: true, annual, monthly, daily });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}