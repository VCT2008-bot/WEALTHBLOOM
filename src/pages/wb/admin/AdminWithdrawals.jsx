import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatNaira, formatDateTime } from "@/lib/wb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Check, X, Loader2 } from "lucide-react";

const statusColor = {
  pending: "bg-amber-100 text-amber-700", approved: "bg-blue-100 text-blue-700",
  processing: "bg-blue-100 text-blue-700", completed: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

export default function AdminWithdrawals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { setItems(await base44.entities.Withdrawal.filter({}, "-created_date")); }
    catch (e) {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const run = async (act) => {
    setBusy(true);
    try {
      await base44.functions.invoke("processWithdrawal", { withdrawal_id: action.id, action: act, note });
      toast({ title: act === "complete" ? "Withdrawal completed" : "Withdrawal rejected" });
      setAction(null); setNote("");
      load();
    } catch (e) { toast({ title: "Failed", description: e.response?.data?.error || e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Withdrawals</h1>
      <Card>
        <CardContent className="p-0 divide-y divide-slate-100">
          {items.map((w) => (
            <div key={w.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-medium text-slate-900">{w.user_email}</div>
                <div className="text-xs text-slate-500 capitalize">{w.withdrawal_type} withdrawal • {formatDateTime(w.created_date)}</div>
                {w.admin_note && <div className="text-xs text-slate-400">Note: {w.admin_note}</div>}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right text-sm">
                  <div className="font-semibold">{formatNaira(w.amount)}</div>
                  <div className="text-xs text-slate-400">net {formatNaira(w.net_payout)} (fee {formatNaira(w.service_fee)})</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColor[w.status] || "bg-slate-100"}`}>{w.status}</span>
                {w.status === "pending" && (
                  <div className="flex gap-1">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setAction({ ...w, act: "complete" })}><Check className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => setAction({ ...w, act: "reject" })}><X className="w-4 h-4" /></Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-slate-400 p-6 text-center">No withdrawals yet.</p>}
        </CardContent>
      </Card>

      <Dialog open={!!action} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{action?.act === "complete" ? "Complete withdrawal" : "Reject withdrawal"}</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">{action?.user_email} — {formatNaira(action?.amount)} → net {formatNaira(action?.net_payout)}</p>
          <Textarea placeholder="Administrative note (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
            <Button onClick={() => run(action.act)} disabled={busy} className={action?.act === "complete" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}>
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {action?.act === "complete" ? "Confirm completion" : "Confirm rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}