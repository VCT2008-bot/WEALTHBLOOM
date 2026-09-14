import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatDateTime } from "@/lib/wb";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollText, ShieldCheck } from "lucide-react";

export default function AdminAuditLogs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setItems(await base44.entities.AuditLog.filter({}, "-created_date", 200)); }
      catch (e) {} finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
      <Card>
        <CardContent className="p-0 divide-y divide-slate-100">
          {items.map((l) => {
            const isRoleChange = l.action === "role_change";
            const roleLabel = (r) => r === "admin" ? "Admin" : r === "super_admin" ? "Super Admin" : "Member";
            return (
              <div key={l.id} className="p-4 flex gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isRoleChange ? "bg-emerald-100" : "bg-slate-100"}`}>
                  {isRoleChange ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <ScrollText className="w-4 h-4 text-slate-500" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-800">{l.action?.replace(/_/g, " ")}</div>
                  {isRoleChange ? (
                    <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                      <div><span className="text-slate-400">Member:</span> {l.target_name || "—"}</div>
                      <div><span className="text-slate-400">Previous role:</span> {roleLabel(l.previous_role) || "—"} → <span className="text-slate-400">New role:</span> {roleLabel(l.new_role) || "—"}</div>
                      <div><span className="text-slate-400">Changed by:</span> {l.admin_name || "—"}</div>
                      {l.reason && <div><span className="text-slate-400">Reason:</span> {l.reason}</div>}
                      <div className="text-slate-400">{formatDateTime(l.created_date)}</div>
                    </div>
                  ) : (
                    <>
                      <div className="text-xs text-slate-500">{l.description || "—"}</div>
                      <div className="text-xs text-slate-400">{l.admin_name || "—"} • {formatDateTime(l.created_date)}</div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {items.length === 0 && <p className="text-sm text-slate-400 p-6 text-center">No audit entries yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}