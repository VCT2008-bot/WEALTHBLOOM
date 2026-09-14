import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatNaira, formatDate, PERIOD_LABELS, PERIOD_DAYS, fetchCurrentRate, fetchSettings } from "@/lib/wb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { TrendingUp, Loader2, Info } from "lucide-react";

const periods = [
  { key: "30_days", label: "30 Days" },
  { key: "90_days", label: "90 Days" },
  { key: "6_months", label: "6 Months" },
  { key: "1_year", label: "1 Year" },
];

export default function Invest() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("30_days");
  const [rate, setRate] = useState(null);
  const [fee, setFee] = useState(50);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const [r, s] = await Promise.all([fetchCurrentRate(), fetchSettings()]);
      setRate(r);
      setFee(s.deposit_fee || 50);
    })();
  }, []);

  const amt = Number(amount) || 0;
  const total = amt + fee;
  const maturity = amt > 0 ? new Date(Date.now() + PERIOD_DAYS[period] * 86400000) : null;

  const handleSubmit = async () => {
    if (amt < 1000) { toast({ title: "Minimum investment is ₦1,000", variant: "destructive" }); return; }
    setLoading(true);
    try {
      await base44.functions.invoke("createDepositRequest", {
        investment_amount: amt, investment_period: period
      });
      toast({ title: "Investment submitted", description: "Your deposit is pending verification. An admin will confirm payment shortly." });
      navigate("/my-investments");
    } catch (e) {
      toast({ title: "Could not submit", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Invest</h1>
        <p className="text-sm text-slate-500">Start a new investment. A ₦{fee} service fee is added to your investment amount.</p>
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex gap-2 text-xs text-amber-800">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Investment returns are variable and may change based on prevailing market conditions. Past performance does not guarantee future results.</span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Investment details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Investment amount (₦)</Label>
              <Input id="amount" type="number" min="1000" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000" />
              <p className="text-xs text-slate-400">Minimum ₦1,000</p>
            </div>
            <div className="space-y-2">
              <Label>Investment period</Label>
              <div className="grid grid-cols-2 gap-2">
                {periods.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      period === p.key ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <div className="flex justify-between"><span>Current annual rate</span><span className="font-semibold">{rate?.annual_rate ?? 0}%</span></div>
              <div className="flex justify-between"><span>Rate source</span><span>{rate?.source || "Administrator-configured rate"}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Payment summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Row label="Investment amount" value={formatNaira(amt)} />
            <Row label="Service fee" value={formatNaira(fee)} />
            <div className="border-t border-slate-100 pt-3">
              <Row label="Total to pay" value={formatNaira(total)} bold />
            </div>
            <div className="border-t border-slate-100 pt-3 space-y-1.5 text-sm">
              <Row label="Duration" value={PERIOD_LABELS[period]} />
              <Row label="Start date" value={formatDate(new Date())} />
              <Row label="Maturity date" value={formatDate(maturity)} />
            </div>
            <p className="text-xs text-slate-400 pt-1">The full ₦{amt.toLocaleString()} is invested. The ₦{fee} fee is added on top.</p>
            <Button onClick={handleSubmit} disabled={loading || amt < 1000} className="w-full bg-emerald-600 hover:bg-emerald-700 h-12">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
              {loading ? "Submitting…" : `Submit investment (₦${total.toLocaleString()})`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={bold ? "font-bold text-slate-900 text-lg" : "font-medium text-slate-700"}>{value}</span>
    </div>
  );
}