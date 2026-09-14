import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard, Users, ArrowDownToLine, TrendingUp, ArrowUpFromLine, Wallet,
  Percent, BadgeDollarSign, Bell, Mail, ScrollText, Settings, LogOut, Menu, Sparkles
} from "lucide-react";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/members", label: "Members", icon: Users },
  { to: "/admin/deposits", label: "Deposits", icon: ArrowDownToLine },
  { to: "/admin/investments", label: "Investments", icon: TrendingUp },
  { to: "/admin/withdrawals", label: "Withdrawals", icon: ArrowUpFromLine },
  { to: "/admin/transactions", label: "Transactions", icon: Wallet },
  { to: "/admin/rates", label: "Investment Rates", icon: Percent, superAdminOnly: true },
  { to: "/admin/fees", label: "Fees", icon: BadgeDollarSign, superAdminOnly: true },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/email-logs", label: "Email Logs", icon: Mail },
  { to: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { to: "/admin/settings", label: "Settings", icon: Settings, superAdminOnly: true },
];

const roleBadge = {
  super_admin: "bg-emerald-100 text-emerald-700",
  admin: "bg-sky-100 text-sky-700",
  user: "bg-slate-100 text-slate-600",
};
const roleLabel = { super_admin: "Super Admin", admin: "Admin", user: "Member" };

function NavLinks({ onNavigate }) {
  const location = useLocation();
  const { user } = useAuth();
  const role = user?.role || user?.data?.role || "user";
  const items = nav.filter((item) => !item.superAdminOnly || role === "super_admin");
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 sticky top-0 h-screen">
        <Link to="/admin" className="flex items-center gap-2 px-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="font-bold text-slate-900 leading-tight">WEALTHBLOOM</div>
            <div className="text-[10px] text-slate-500 font-medium tracking-wide">ADMIN CONSOLE</div>
          </div>
        </Link>
        <NavLinks />
        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="px-3 mb-3">
            <div className="text-sm font-medium text-slate-900 truncate">{user?.full_name}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
            <span className={`mt-1 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadge[user?.role || user?.data?.role || "user"]}`}>{roleLabel[user?.role || user?.data?.role || "user"]}</span>
          </div>
          <Button variant="ghost" className="w-full justify-start text-slate-600" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 h-16 border-b border-slate-200 bg-white sticky top-0 z-30">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="w-5 h-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 px-2 mb-8">
                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="font-bold text-slate-900">WEALTHBLOOM</div>
              </Link>
              <NavLinks onNavigate={() => setOpen(false)} />
              <Button variant="ghost" className="w-full justify-start mt-4" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </SheetContent>
          </Sheet>
          <span className="font-bold text-slate-900">Admin Console</span>
          <div className="w-9" />
        </header>
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}