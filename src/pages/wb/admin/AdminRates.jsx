import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatNaira, formatDate, formatDateTime } from "@/lib/wb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Percent, History } from "lucide-react";

export default function AdminRates() {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [annual, setAnnual] = useState("");
  const [source, setSource] = useState("Administrator-configured rate");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const all = await base44.entities.InvestmentRate.list("-created_date");
      setCurrent(all.find((r) => r.status === "current") || all[0] || null);
      setHistory(all);
      if (all.find((r) => r.status === "current")) setAnnual(String(all.find((r) => r.status === "current").annual_rate));
    } catch (e) {}
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke("updateRate", { annual_rate: Number(annual), source, note });
      toast({ title: "Rate updated", description: "Previous rate preserved in history. Audit log created." });
      setNote("");
      load();
    } catch (e) { toast({ title: "Failed", description: e.response?.data?.error || e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Investment Rates</h1>
      <div className="grid md:grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Percent className="w-4 h-4" /> Current rate</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-emerald-50 p-3"><div className="text-xs text-slate-500">Annual</div><div className="text-xl font-bold text-emerald-700">{current?.annual_rate ?? 0}%</div></div>
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Monthly</div><div className="text-xl font-bold text-slate-800">{current?.monthly_rate ?? 0}%</div></div>
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Daily</div><div className="text-xl font-bold text-slate-800">{current?.daily_rate ?? 0}%</div></div>
            </div>
            <div className="text-xs text-slate-500">Source: {current?.source || "Administrator-configured rate"} • Effective {formatDate(current?.effective_date)}</div>
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <div><Label>Annual rate (%)</Label><Input type="number" step="0.01" value={annual} onChange={(e) => setAnnual(e.target.value)} /></div>
              <div><Label>Source</Label><Input value={source} onChange={(e) => setSource(e.target.value)} /></div>
              <div><Label>Note / reason</Label><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for change" /></div>
              <Button onClick={save} disabled={saving} className="w-full bg-slate-900 hover:bg-slate-800">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Update rate
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="w-4 h-4" /> Rate history</CardTitle></CardHeader>
          <CardContent className="divide-y divide-slate-100">
            {history.map((r) => (
              <div key={r.id} className="py-3">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-800">{r.annual_rate}% annual</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "current" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{r.status}</span>
                </div>
                <div className="text-xs text-slate-400">{formatDateTime(r.created_date)} • by {r.created_by || "—"}</div>
                {r.previous_rate !== undefined && r.previous_rate !== 0 && <div className="text-xs text-slate-400">Previous: {r.previous_rate}%</div>}
                {r.note && <div className="text-xs text-slate-500 mt-1">{r.note}</div>}
              </div>
            ))}
            {history.length === 0 && <p className="text-sm text-slate-400 py-4">No rate history yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}