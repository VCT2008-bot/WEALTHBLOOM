import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatDateTime } from "@/lib/wb";
import EmptyState from "@/components/wb/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { setItems(await base44.entities.Notification.filter({}, "-created_date")); }
    catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try { await base44.entities.Notification.update(id, { read: true }); load(); } catch (e) {}
  };

  if (!loading && items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200">
        <EmptyState title="No notifications" message="You'll be notified here about your investments, deposits, withdrawals, and maturities." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
      <Card>
        <CardContent className="p-0 divide-y divide-slate-100">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.read && markRead(n.id)}
              className={`w-full text-left flex gap-3 p-4 ${n.read ? "" : "bg-emerald-50/40"}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${n.read ? "bg-slate-100" : "bg-emerald-100"}`}>
                <Bell className={`w-4 h-4 ${n.read ? "text-slate-400" : "text-emerald-600"}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 text-sm">{n.title}</span>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                <span className="text-xs text-slate-400">{formatDateTime(n.created_date)}</span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}