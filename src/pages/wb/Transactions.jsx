import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatNaira, formatDateTime } from "@/lib/wb";
import EmptyState from "@/components/wb/EmptyState";
import { Card, CardContent } from "@/components/ui/card";

const typeColor = {
  deposit: "bg-blue-50 text-blue-700",
  investment: "bg-emerald-50 text-emerald-700",
  deposit_service_fee: "bg-amber-50 text-amber-700",
  investment_earnings: "bg-emerald-50 text-emerald-700",
  withdrawal: "bg-slate-100 text-slate-700",
  withdrawal_service_fee: "bg-amber-50 text-amber-700",
  refund: "bg-purple-50 text-purple-700",
  authorized_adjustment: "bg-rose-50 text-rose-700",
};

const typeLabel = {
  deposit: "Deposit", investment: "Investment", deposit_service_fee: "Deposit Fee",
  investment_earnings: "Earnings", withdrawal: "Withdrawal", withdrawal_service_fee: "Withdrawal Fee",
  refund: "Refund", authorized_adjustment: "Adjustment",
};

export default function Transactions() {
  const [tx, setTx] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setTx(await base44.entities.Transaction.filter({}, "-created_date")); }
      catch (e) {} finally { setLoading(false); }
    })();
  }, []);

  if (!loading && tx.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200">
        <EmptyState title="No transactions yet." message="Your transaction history will appear here once you make an investment or withdrawal." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
      <Card>
        <CardContent className="p-0 divide-y divide-slate-100">
          {tx.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeColor[t.type] || "bg-slate-100 text-slate-600"}`}>
                  {typeLabel[t.type] || t.type}
                </span>
                <div>
                  <div className="text-sm font-medium text-slate-800">{t.description || "—"}</div>
                  <div className="text-xs text-slate-400">{formatDateTime(t.created_date)} • {t.reference || "—"}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-slate-900">{formatNaira(t.net_amount)}</div>
                {t.fee > 0 && <div className="text-xs text-amber-600">fee {formatNaira(t.fee)}</div>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}