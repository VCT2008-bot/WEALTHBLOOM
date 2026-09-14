import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatNaira, formatDate, daysRemaining, PERIOD_LABELS } from "@/lib/wb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { RefreshCw } from "lucide-react";

const statusColor = {
  active: "bg-emerald-100 text-emerald-700", matured: "bg-amber-100 text-amber-700",
  pending: "bg-slate-100 text-slate-600", withdrawn: "bg-slate-100 text-slate-500",
};

export default function AdminInvestments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { setItems(await base44.entities.Investment.filter({}, "-created_date")); }
    catch (e) {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const checkMaturity = async () => {
    try {
      await base44.functions.invoke("checkMaturity", {});
      toast({ title: "Maturity check complete" });
      load();
    } catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Investments</h1>
        <Button variant="outline" size="sm" onClick={checkMaturity}><RefreshCw className="w-4 h-4 mr-2" /> Run maturity check</Button>
      </div>
      <Card>
        <CardContent className="p-0 divide-y divide-slate-100">
          {items.map((i) => (
            <div key={i.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-medium text-slate-900">{i.user_email}</div>
                <div className="text-xs text-slate-500">{formatNaira(i.principal)} • {PERIOD_LABELS[i.investment_period]} • {i.rate_annual}% annual</div>
                <div className="text-xs text-slate-400">Start {formatDate(i.start_date)} • Maturity {formatDate(i.maturity_date)} • {i.status === "matured" ? "Matured" : `${daysRemaining(i.maturity_date)} days left`}</div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right"><div className="font-semibold">{formatNaira(i.current_balance)}</div><div className="text-xs text-slate-400">earnings {formatNaira(i.earnings)}</div></div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColor[i.status] || "bg-slate-100"}`}>{i.status}</span>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-slate-400 p-6 text-center">No investments yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}