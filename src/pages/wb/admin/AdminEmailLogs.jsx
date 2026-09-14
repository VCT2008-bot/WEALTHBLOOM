import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatDateTime } from "@/lib/wb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Send, RefreshCw } from "lucide-react";

const statusColor = {
  pending: "bg-amber-100 text-amber-700", sent: "bg-blue-100 text-blue-700",
  delivered: "bg-emerald-100 text-emerald-700", failed: "bg-rose-100 text-rose-700",
};
const typeLabel = {
  welcome: "Welcome", payment_receipt: "Payment Receipt", investment_active: "Investment Active",
  maturity: "Maturity", withdrawal_submitted: "Withdrawal Submitted", withdrawal_receipt: "Withdrawal Receipt",
  withdrawal_completed: "Withdrawal Completed", withdrawal_rejected: "Withdrawal Rejected",
  renewal: "Renewal", role_change: "Role Change", custom: "Custom",
};

export default function AdminEmailLogs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { setItems(await base44.entities.EmailLog.filter({}, "-created_date")); }
    catch (e) {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const resend = async (log) => {
    try {
      await base44.functions.invoke("resendEmail", { log_id: log.id });
      toast({ title: "Email resent" });
      load();
    } catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Email Logs</h1>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button>
      </div>
      <Card>
        <CardContent className="p-0 divide-y divide-slate-100">
          {items.map((l) => (
            <div key={l.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-medium text-slate-900">{l.email}</div>
                <div className="text-xs text-slate-500">{typeLabel[l.email_type] || l.email_type} • {l.subject || "—"}</div>
                <div className="text-xs text-slate-400">{formatDateTime(l.created_date)}</div>
                {l.error && <div className="text-xs text-rose-500 mt-1">Error: {l.error}</div>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full ${statusColor[l.status] || "bg-slate-100"}`}>{l.status}</span>
                {l.status === "failed" && <Button size="sm" variant="outline" onClick={() => resend(l)}><Send className="w-4 h-4 mr-1" /> Resend</Button>}
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-slate-400 p-6 text-center">No emails logged yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}