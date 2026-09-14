import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatDateTime } from "@/lib/wb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Send } from "lucide-react";

export default function AdminNotifications() {
  const [users, setUsers] = useState([]);
  const [sent, setSent] = useState([]);
  const [target, setTarget] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      setUsers(await base44.entities.User.list());
      setSent(await base44.entities.Notification.filter({}, "-created_date", 50));
    })();
  }, []);

  const send = async () => {
    if (!target || !title || !message) { toast({ title: "Fill all fields", variant: "destructive" }); return; }
    try {
      await base44.entities.Notification.create({ user_id: target, title, message, type: "system", read: false });
      toast({ title: "Notification sent" });
      setTitle(""); setMessage("");
      setSent(await base44.entities.Notification.filter({}, "-created_date", 50));
    } catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
      <div className="grid md:grid-cols-2 gap-5">
        <Card>
          <CardContent className="space-y-3 p-5">
            <div><Label>Send to member</Label>
              <select className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm" value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="">Select member…</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.full_name} — {u.email}</option>)}
              </select>
            </div>
            <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label>Message</Label><Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} /></div>
            <Button onClick={send} className="bg-slate-900 hover:bg-slate-800"><Send className="w-4 h-4 mr-2" /> Send notification</Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0 divide-y divide-slate-100">
            {sent.map((n) => (
              <div key={n.id} className="p-3">
                <div className="text-sm font-medium text-slate-800">{n.title}</div>
                <div className="text-xs text-slate-500">{n.message}</div>
                <div className="text-xs text-slate-400">{formatDateTime(n.created_date)} • {n.read ? "read" : "unread"}</div>
              </div>
            ))}
            {sent.length === 0 && <p className="text-sm text-slate-400 p-6 text-center">No notifications sent yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}