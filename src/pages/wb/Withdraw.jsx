import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatNaira, fetchSettings } from "@/lib/wb";
import EmptyState from "@/components/wb/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Loader2, ArrowDownToLine } from "lucide-react";

export default function Withdraw() {
  const [investments, setInvestments] = useState([]);
  const [fee, setFee] = useState(50);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [inv, s] = await Promise.all([
          base44.entities.Investment.filter({}),
          fetchSettings(),
        ]);
        setInvestments(inv.filter((i) => i.status === "active" || i.status === "matured"));
        setFee(s.withdrawal_fee || 50);
      } catch (e) {} finally { setFetching(false); }
    })();
  }, []);

  const eligible = investments;
  const amt = Number(amount) || 0;
  const net = Math.max(0, amt - fee);
  const inv = eligible.find((i) => i.id === selected);

  const submit = async () => {
    if (!inv) { toast({ title: "Select an investment", variant: "destructive" }); return; }
    if (amt <= 0 || amt > inv.current_balance) { toast({ title: "Invalid amount", variant: "destructive" }); return; }
    setLoading(true);
    try {
      await base44.functions.invoke("createWithdrawalRequest", { investment_id: inv.id, amount: amt });
      toast({ title: "Withdrawal submitted", description: "Your request is pending review. You'll be notified once processed." });
      setAmount(""); setSelected(null);
    } catch (e) {
      toast({ title: "Could not submit", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  if (!fetching && eligible.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200">
        <EmptyState title="No withdrawals yet." message="You don't have any investments eligible for withdrawal right now." />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">Withdraw</h1>
      <p className="text-sm text-slate-500">A ₦{fee} service fee applies to every withdrawal. No early-withdrawal penalty.</p>

      <Card>
        <CardHeader><CardTitle className="text-base">Select an investment</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {eligible.map((i) => (
            <button
              key={i.id}
              onClick={() => { setSelected(i.id); setAmount(String(i.current_balance)); }}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${
                selected === i.id ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-300"
              }`}
            >
              <div className="flex justify-between">
                <span className="font-medium text-slate-800">{formatNaira(i.principal)} • {i.status}</span>
                <span className="text-sm text-slate-500">Balance {formatNaira(i.current_balance)}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">{i.status === "matured" ? "Matured withdrawal" : "Early withdrawal"}</div>
            </button>
          ))}
        </CardContent>
      </Card>

      {inv && (
        <Card>
          <CardHeader><CardTitle className="text-base">Withdrawal details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wamt">Withdrawal amount (₦)</Label>
              <Input id="wamt" type="number" max={inv.current_balance} value={amount} onChange={(e) => setAmount(e.target.value)} />
              <p className="text-xs text-slate-400">Available: {formatNaira(inv.current_balance)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Withdrawal amount</span><span className="font-medium">{formatNaira(amt)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Service fee</span><span className="font-medium text-amber-600">{formatNaira(fee)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2"><span className="font-medium text-slate-700">You will receive</span><span className="font-bold text-emerald-700">{formatNaira(net)}</span></div>
            </div>
            <Button onClick={submit} disabled={loading || amt <= 0} className="w-full bg-emerald-600 hover:bg-emerald-700 h-12">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowDownToLine className="w-4 h-4 mr-2" />}
              {loading ? "Submitting…" : "Confirm withdrawal"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}