import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatNaira } from "@/lib/wb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export default function AdminFees() {
  const [settings, setSettings] = useState(null);
  const [depositFee, setDepositFee] = useState("50");
  const [withdrawalFee, setWithdrawalFee] = useState("50");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await base44.entities.PlatformSetting.list();
      setSettings(s[0] || null);
      if (s[0]) { setDepositFee(String(s[0].deposit_fee)); setWithdrawalFee(String(s[0].withdrawal_fee)); }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke("updateFees", {
        deposit_fee: Number(depositFee), withdrawal_fee: Number(withdrawalFee), reason
      });
      toast({ title: "Fees updated", description: "Audit log created. Historical transactions are unchanged." });
      setReason("");
    } catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Fees</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Platform service fees</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-amber-50 p-4"><div className="text-xs text-slate-500">Deposit fee (current)</div><div className="text-xl font-bold text-amber-700">{formatNaira(settings?.deposit_fee ?? 50)}</div></div>
            <div className="rounded-xl bg-amber-50 p-4"><div className="text-xs text-slate-500">Withdrawal fee (current)</div><div className="text-xl font-bold text-amber-700">{formatNaira(settings?.withdrawal_fee ?? 50)}</div></div>
          </div>
          <div><Label>New deposit fee (₦)</Label><Input type="number" value={depositFee} onChange={(e) => setDepositFee(e.target.value)} /></div>
          <div><Label>New withdrawal fee (₦)</Label><Input type="number" value={withdrawalFee} onChange={(e) => setWithdrawalFee(e.target.value)} /></div>
          <div><Label>Reason for change</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Required for audit log" /></div>
          <Button onClick={save} disabled={saving} className="bg-slate-900 hover:bg-slate-800">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Update fees
          </Button>
          <p className="text-xs text-slate-400">Changing fees does not alter historical transaction fees already recorded.</p>
        </CardContent>
      </Card>
    </div>
  );
}