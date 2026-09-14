// Shared financial logic for WEALTHBLOOM — used by backend functions only.
// Never expose fee/balance mutation to the frontend; all financial math runs server-side.

export const PERIOD_DAYS = {
  "30_days": 30,
  "90_days": 90,
  "6_months": 182,
  "1_year": 365,
};

export const PERIOD_LABELS = {
  "30_days": "30 Days",
  "90_days": "90 Days",
  "6_months": "6 Months",
  "1_year": "1 Year",
};

export const DEFAULT_DEPOSIT_FEE = 50;
export const DEFAULT_WITHDRAWAL_FEE = 50;

// Derive monthly/daily rates from an annual rate (compound-consistent).
export function deriveRates(annualRate) {
  const annual = Number(annualRate) || 0;
  // monthly = (1+annual)^(1/12) - 1 ; daily = (1+annual)^(1/365) - 1
  const monthly = Math.round((Math.pow(1 + annual / 100, 1 / 12) - 1) * 10000) / 100;
  const daily = Math.round((Math.pow(1 + annual / 100, 1 / 365) - 1) * 10000) / 100;
  return { annual, monthly, daily };
}

// Projected earnings at maturity for an investment (variable — not guaranteed).
export function projectedEarnings(principal, annualRate, periodDays) {
  const annual = Number(annualRate) || 0;
  const dailyRate = Math.pow(1 + annual / 100, 1 / 365) - 1;
  const growth = Math.pow(1 + dailyRate, periodDays) - 1;
  return Math.round(Number(principal) * growth * 100) / 100;
}

export function maturityDate(startDate, periodDays) {
  const d = new Date(startDate);
  d.setDate(d.getDate() + periodDays);
  return d.toISOString();
}

export function formatNaira(n) {
  const num = Number(n) || 0;
  return "₦" + num.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}