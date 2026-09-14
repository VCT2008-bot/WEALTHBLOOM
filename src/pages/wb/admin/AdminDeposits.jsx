import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatNaira, formatDateTime, PERIOD_LABELS } from "@/lib/wb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Check, X, Loader2 } from "lucide-react";

const statusColor = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  successful: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  rejected: "bg-slate-100 text-slate-500",
  refunded: "bg-purple-100 text-purple-700",
};

export default function AdminDeposits() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null); // {deposit, type}
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { setDeposits(await base44.entities.Deposit.filter({}, "-created_date")); }
    catch (e) {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const run = async () => {
    setBusy(true);
    try {
      if (action.type === "approve") await base44.functions.invoke("approveDeposit", { deposit_id: action.deposit.id, note });
      else await base44.functions.invoke("rejectDeposit", { deposit_id: action.deposit.id, note });
      toast({ title: action.type === "approve" ? "Deposit approved — investment activated" : "Deposit rejected" });
      setAction(null); setNote("");
      load();
    } catch (e) { toast({ title: "Failed", description: e.response?.data?.error || e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Deposits</h1>
      <Card>
        <CardContent className="p-0 divide-y divide-slate-100">
          {deposits.map((d) => (
            <div key={d.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-medium text-slate-900">{d.user_email}</div>
                <div className="text-xs text-slate-500">Ref: {d.payment_reference} • {PERIOD_LABELS[d.investment_period]}</div>
                <div className="text-xs text-slate-400">{formatDateTime(d.created_date)}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right text-sm">
                  <div className="font-semibold">{formatNaira(d.total_payment)}</div>
                  <div className="text-xs text-slate-400">inv {formatNaira(d.investment_amount)} + fee {formatNaira(d.service_fee)}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColor[d.status] || "bg-slate-100"}`}>{d.status}</span>
                {d.status === "pending" && (
                  <div className="flex gap-1">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setAction({ deposit: d, type: "approve" })}><Check className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => setAction({ deposit: d, type: "reject" })}><X className="w-4 h-4" /></Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {deposits.length === 0 && <p className="text-sm text-slate-400 p-6 text-center">No deposits yet.</p>}
        </CardContent>
      </Card>

      <Dialog open={!!action} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{action?.type === "approve" ? "Approve deposit" : "Reject deposit"}</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">{action?.deposit?.user_email} — {formatNaira(action?.deposit?.total_payment)}</p>
          <Textarea placeholder="Administrative note (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
            <Button onClick={run} disabled={busy} className={action?.type === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}>
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {action?.type === "approve" ? "Confirm approval" : "Confirm rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}