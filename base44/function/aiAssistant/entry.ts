import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// AI assistant. Explains platform concepts using REAL current rate/settings fetched server-side.
// Never fabricates rates/balances, never mutates financial data.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const question = String(body.question || '').slice(0, 1000);

    // Fetch real platform context
    const rates = await base44.asServiceRole.entities.InvestmentRate.filter({ status: 'current' });
    const rate = rates[0] || { annual_rate: 0, monthly_rate: 0, daily_rate: 0, source: 'Administrator-configured rate' };
    const settings = await base44.asServiceRole.entities.PlatformSetting.list();
    const s = settings[0] || { deposit_fee: 50, withdrawal_fee: 50 };

    const context = `WEALTHBLOOM platform facts (use ONLY these real values, never invent numbers):
- Current annual rate: ${rate.annual_rate}% (monthly ${rate.monthly_rate}%, daily ${rate.daily_rate}%)
- Rate source: ${rate.source || 'Administrator-configured rate'}
- Deposit service fee: ₦${s.deposit_fee} (added to investment amount)
- Withdrawal service fee: ₦${s.withdrawal_fee} (no early-withdrawal penalty)
- Investment periods: 30 days, 90 days, 6 months, 1 year
- Returns are variable and may change based on prevailing market conditions. Past performance does not guarantee future results.
- The AI must NEVER invent rates, balances, or profits, and NEVER guarantee returns.

Answer the user's question clearly and concisely using only these facts. If asked for a personal balance or to perform an action (approve, withdraw, change balance), explain that the AI cannot perform actions or access their balance and they should use the dashboard.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${context}\n\nUser question: ${question}`,
      model: 'gemini_3_flash'
    });

    const answer = typeof res === 'string' ? res : (res?.response || res?.text || JSON.stringify(res));
    return Response.json({ ok: true, answer, rate: { annual: rate.annual_rate, monthly: rate.monthly_rate, daily: rate.daily_rate, source: rate.source } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}