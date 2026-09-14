import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeDollarSign, Shield, Bell } from "lucide-react";

export default function AdminSettings() {
  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><BadgeDollarSign className="w-4 h-4" /> Fees</CardTitle></CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-1">
          <p>Deposit and withdrawal fees are managed in the <b>Fees</b> section. Default: ₦50 each.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" /> Security</CardTitle></CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-1">
          <p>• Role-based access — admin routes are protected server-side.</p>
          <p>• Financial values can only be changed through approved backend functions (deposit approval, withdrawal processing).</p>
          <p>• Users cannot modify balances, earnings, fees, or statuses from the frontend.</p>
          <p>• All admin actions are recorded in the audit log.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" /> Notifications</CardTitle></CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-1">
          <p>Automatic notifications fire on registration, investment activation, maturity, and withdrawal events.</p>
          <p>Run a maturity check from the Investments page to mark matured investments and notify users.</p>
        </CardContent>
      </Card>
    </div>
  );
}