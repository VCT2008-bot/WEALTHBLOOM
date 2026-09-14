import { base44 } from "@/api/base44Client";

export const PERIOD_LABELS = {
  "30_days": "30 Days",
  "90_days": "90 Days",
  "6_months": "6 Months",
  "1_year": "1 Year",
};

export const PERIOD_DAYS = { "30_days": 30, "90_days": 90, "6_months": 182, "1_year": 365 };

export function formatNaira(n) {
  const num = Number(n) || 0;
  return "₦" + num.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-NG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function daysRemaining(maturityDate) {
  if (!maturityDate) return 0;
  const diff = new Date(maturityDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function timeElapsed(startDate) {
  if (!startDate) return "0 days";
  const diff = new Date() - new Date(startDate);
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  return `${days} day${days === 1 ? "" : "s"}`;
}

// Fetch the current investment rate (server-side, admin-configured).
export async function fetchCurrentRate() {
  const rates = await base44.entities.InvestmentRate.filter({ status: "current" });
  return rates[0] || { annual_rate: 0, monthly_rate: 0, daily_rate: 0, source: "Administrator-configured rate", effective_date: null };
}

export async function fetchSettings() {
  const settings = await base44.entities.PlatformSetting.list();
  return settings[0] || { deposit_fee: 50, withdrawal_fee: 50, manual_approval: true };
}