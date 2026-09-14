import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatNaira, formatDateTime } from "@/lib/wb";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const typeLabel = {
  deposit: "Deposit", investment: "Investment", deposit_service_fee: "Deposit Fee",
  investment_earnings: "Earnings", withdrawal: "Withdrawal", withdrawal_service_fee: "Withdrawal Fee",
  refund: "Refund", authorized_adjustment: "Adjustment",
};

export default function AdminTransactions() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setItems(await base44.entities.Transaction.filter({}, "-created_date", 200)); }
      catch (e) {} finally { setLoading(false); }
    })();
  }, []);

  const filtered = items.filter((t) =>
    (t.user_email || "").toLowerCase().includes(query.toLowerCase()) ||
    (t.type || "").toLowerCase().includes(query.toLowerCase())
  );

  const totalFees = filtered.filter((t) => t.type === "deposit_service_fee" || t.type === "withdrawal_service_fee").reduce((a, t) => a + (t.amount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
        <div className="text-sm text-slate-500">Fees collected: <span className="font-semibold text-slate-900">{formatNaira(totalFees)}</span></div>
      </div>
      <Input className="max-w-sm" placeholder="Filter by user or type" value={query} onChange={(e) => setQuery(e.target.value)} />
      <Card>
        <CardContent className="p-0 divide-y divide-slate-100">
          {filtered.map((t) => (
            <div key={t.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-800">{typeLabel[t.type] || t.type} • {t.user_email}</div>
                <div className="text-xs text-slate-400">{t.description || "—"} • {formatDateTime(t.created_date)}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-slate-900">{formatNaira(t.net_amount)}</div>
                {t.fee > 0 && <div className="text-xs text-amber-600">fee {formatNaira(t.fee)}</div>}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-slate-400 p-6 text-center">No transactions yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}