import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatNaira, formatDate, daysRemaining, timeElapsed, PERIOD_LABELS } from "@/lib/wb";
import EmptyState from "@/components/wb/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, ArrowDownToLine } from "lucide-react";

const statusColor = {
  active: "bg-emerald-100 text-emerald-700",
  matured: "bg-amber-100 text-amber-700",
  pending: "bg-slate-100 text-slate-600",
  withdrawn: "bg-slate-100 text-slate-500",
  renewed: "bg-blue-100 text-blue-700",
  closed: "bg-slate-100 text-slate-500",
};

export default function MyInvestments() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setInvestments(await base44.entities.Investment.filter({}, "-created_date")); }
      catch (e) {} finally { setLoading(false); }
    })();
  }, []);

  if (!loading && investments.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200">
        <EmptyState
          title="No investments yet."
          message="You haven't made any investments. Start your first one when you're ready."
          action={<Button asChild className="bg-emerald-600 hover:bg-emerald-700"><Link to="/invest">Start Investing</Link></Button>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My Investments</h1>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700"><Link to="/invest">New Investment</Link></Button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {investments.map((i) => {
          const remaining = daysRemaining(i.maturity_date);
          return (
            <Card key={i.id}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-emerald-600" /></div>
                    <div>
                      <div className="font-semibold text-slate-900">{formatNaira(i.principal)}</div>
                      <div className="text-xs text-slate-500">{PERIOD_LABELS[i.investment_period]}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[i.status] || statusColor.pending}`}>{i.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Principal" value={formatNaira(i.principal)} />
                  <Field label="Current balance" value={formatNaira(i.current_balance)} />
                  <Field label="Earnings" value={formatNaira(i.earnings)} />
                  <Field label="Annual rate" value={`${i.rate_annual ?? 0}%`} />
                  <Field label="Start" value={formatDate(i.start_date)} />
                  <Field label="Maturity" value={formatDate(i.maturity_date)} />
                  <Field label="Time elapsed" value={timeElapsed(i.start_date)} />
                  <Field label="Remaining" value={i.status === "matured" ? "Matured" : `${remaining} days`} />
                </div>
                {(i.status === "active" || i.status === "matured") && (
                  <Button asChild variant="outline" className="w-full"><Link to="/withdraw"><ArrowDownToLine className="w-4 h-4 mr-2" /> Withdraw</Link></Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="font-medium text-slate-700">{value}</div>
    </div>
  );
}