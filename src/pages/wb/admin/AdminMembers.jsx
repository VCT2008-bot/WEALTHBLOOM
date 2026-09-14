import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { formatNaira, formatDate } from "@/lib/wb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { UserPlus, Search, Loader2, Trash2, Power, Mail, ShieldCheck, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

const roleBadge = {
  super_admin: "bg-emerald-100 text-emerald-700",
  admin: "bg-sky-100 text-sky-700",
  user: "bg-slate-100 text-slate-600",
};
const roleLabel = { super_admin: "Super Admin", admin: "Admin", user: "Member" };

export default function AdminMembers() {
  const { user: me } = useAuth();
  const myRole = me?.role || me?.data?.role || "user";
  const isSuperAdmin = myRole === "super_admin";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newMember, setNewMember] = useState({ full_name: "", email: "", phone: "", account_status: "active", send_welcome: true });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [roleTarget, setRoleTarget] = useState(null); // { user, newRole }
  const [roleReason, setRoleReason] = useState("");
  const [roleSaving, setRoleSaving] = useState(false);

  const load = async () => {
    try { setUsers(await base44.entities.User.list()); }
    catch (e) {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) =>
    (u.full_name || "").toLowerCase().includes(query.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(query.toLowerCase())
  );

  const addMember = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke("addMember", newMember);
      toast({ title: "Member added" });
      setAddOpen(false);
      setNewMember({ full_name: "", email: "", phone: "", account_status: "active", send_welcome: true });
      load();
    } catch (e) {
      toast({ title: "Could not add member", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const toggleStatus = async (u) => {
    const next = u.data?.account_status === "active" ? "inactive" : "active";
    try {
      await base44.entities.User.update(u.id, { account_status: next });
      toast({ title: `Member ${next === "active" ? "activated" : "deactivated"}` });
      load();
    } catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  };

  const resendWelcome = async (u) => {
    try {
      await base44.functions.invoke("resendEmail", { log_id: null, email: u.email, user_name: u.full_name });
      toast({ title: "Welcome email queued" });
    } catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  };

  const deleteMember = async () => {
    if (!deleteTarget) return;
    try {
      await base44.entities.User.delete(deleteTarget.id);
      toast({ title: "Member deleted" });
      setDeleteTarget(null);
      load();
    } catch (e) { toast({ title: "Could not delete (member may have financial history)", description: e.message, variant: "destructive" }); }
  };

  const confirmRoleChange = async () => {
    if (!roleTarget) return;
    setRoleSaving(true);
    try {
      await base44.functions.invoke("changeRole", {
        user_id: roleTarget.user.id, new_role: roleTarget.newRole, reason: roleReason
      });
      toast({ title: `Role changed to ${roleLabel[roleTarget.newRole]}`, description: "Audit log recorded. Financial records unchanged." });
      setRoleTarget(null);
      setRoleReason("");
      load();
    } catch (e) {
      toast({ title: "Could not change role", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally { setRoleSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Members</h1>
          {isSuperAdmin && <p className="text-xs text-slate-500 mt-1">As Super Admin you can promote members to Admin and demote admins back to Member.</p>}
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800 gap-2"><UserPlus className="w-4 h-4" /> Add New Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add new member</DialogTitle></DialogHeader>
            <p className="text-xs text-slate-500 -mt-2">New members start at ₦0. No investment or transaction is created.</p>
            <div className="space-y-3">
              <div><Label>Full name</Label><Input value={newMember.full_name} onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={newMember.send_welcome} onChange={(e) => setNewMember({ ...newMember, send_welcome: e.target.checked })} /> Send welcome email</label>
            </div>
            <DialogFooter>
              <Button onClick={addMember} disabled={saving} className="bg-slate-900 hover:bg-slate-800">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Create member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input className="pl-9" placeholder="Search by name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-slate-100">
          {filtered.map((u) => {
            const uRole = u.role || u.data?.role || "user";
            const isSelf = u.id === me?.id;
            const canManageRole = isSuperAdmin && !isSelf && uRole !== "super_admin";
            return (
              <div key={u.id} className="flex items-center justify-between p-4 gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 truncate">{u.full_name}{isSelf && <span className="text-xs text-slate-400 font-normal"> (you)</span>}</div>
                  <div className="text-xs text-slate-500 truncate">{u.email} • {u.data?.phone || "no phone"}</div>
                  <div className="text-xs text-slate-400">Joined {formatDate(u.created_date)}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full ${roleBadge[uRole]}`}>{roleLabel[uRole]}</span>
                  <span className={`hidden sm:inline text-xs px-2 py-1 rounded-full ${u.data?.account_status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {u.data?.account_status || "active"}
                  </span>
                  {canManageRole && uRole === "user" && (
  <Button
    variant="outline"
    size="sm"
    className="gap-1"
    title="Promote to Admin"
    onClick={() => setRoleTarget({ user: u, newRole: "admin" })}
  >
    <ArrowUpCircle className="w-4 h-4" /> Promote
  </Button>
)}

{canManageRole && uRole === "admin" && (
  <>
    <Button
      variant="outline"
      size="sm"
      className="gap-1"
      title="Promote to Super Admin"
      onClick={() => setRoleTarget({ user: u, newRole: "super_admin" })}
    >
      <ShieldCheck className="w-4 h-4" /> Super Admin
    </Button>

    <Button
      variant="outline"
      size="sm"
      className="gap-1"
      title="Demote to Member"
      onClick={() => setRoleTarget({ user: u, newRole: "user" })}
    >
      <ArrowDownCircle className="w-4 h-4" /> Demote
    </Button>
  </>
)}
                  <Button variant="ghost" size="icon" title="Resend welcome" onClick={() => resendWelcome(u)}><Mail className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" title="Activate/Deactivate" onClick={() => toggleStatus(u)}><Power className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" title="Delete" onClick={() => setDeleteTarget(u)}><Trash2 className="w-4 h-4 text-rose-500" /></Button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-sm text-slate-400 p-6 text-center">No members found.</p>}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete member?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">Are you sure you want to delete {deleteTarget?.full_name}? Members with financial history should be deactivated instead to preserve audit records.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteMember}>Delete permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role change confirmation */}
      <Dialog open={!!roleTarget} onOpenChange={(o) => !o && (setRoleTarget(null), setRoleReason(""))}>
        <DialogContent>
          <DialogHeader>
  <DialogTitle className="flex items-center gap-2">
    <ShieldCheck className="w-5 h-5 text-emerald-600" />
    {roleTarget?.newRole === "super_admin"
      ? "Promote to Super Admin"
      : roleTarget?.newRole === "admin"
        ? "Promote to Admin"
        : "Demote to Member"}
  </DialogTitle>
</DialogHeader>

<p className="text-sm text-slate-600">
  {roleTarget?.newRole === "super_admin"
    ? `Are you sure you want to promote ${roleTarget?.user.full_name} to Super Admin? This will give the account full administrative and role-management access.`
    : roleTarget?.newRole === "admin"
      ? `Are you sure you want to promote ${roleTarget?.user.full_name} to Admin? This will give the account administrative access.`
      : `Are you sure you want to demote ${roleTarget?.user.full_name} back to Member? They will lose administrative access.`}
</p>
          <p className="text-xs text-slate-400">This changes permissions only. Investments, balances, earnings, deposits, withdrawals, transactions and fees are NOT affected.</p>
          <div><Label>Reason / note (optional)</Label><Input value={roleReason} onChange={(e) => setRoleReason(e.target.value)} placeholder="Reason for change (recorded in audit log)" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRoleTarget(null); setRoleReason(""); }}>Cancel</Button>
            <Button onClick={confirmRoleChange} disabled={roleSaving} className="bg-slate-900 hover:bg-slate-800">
              {roleSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Confirm role change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}