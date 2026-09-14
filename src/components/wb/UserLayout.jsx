import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard, TrendingUp, Wallet, ArrowDownToLine, Bell, User, HelpCircle,
  LogOut, Menu, Sparkles, ListChecks
} from "lucide-react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/invest", label: "Invest", icon: TrendingUp },
  { to: "/my-investments", label: "My Investments", icon: ListChecks },
  { to: "/transactions", label: "Transactions", icon: Wallet },
  { to: "/withdraw", label: "Withdraw", icon: ArrowDownToLine },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/help", label: "Help", icon: HelpCircle },
];

function NavLinks({ onNavigate }) {
  const location = useLocation();
  return (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              active ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
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

export default function UserLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout(false);
    navigate("/login");
  };

  const firstName = (user?.full_name || "there").split(" ")[0];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 sticky top-0 h-screen">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-900 leading-tight">WEALTHBLOOM</div>
            <div className="text-[10px] text-emerald-600 font-medium tracking-wide">GROW YOUR WEALTH</div>
          </div>
        </Link>
        <NavLinks />
        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="px-3 mb-3">
            <div className="text-sm font-medium text-slate-900 truncate">{firstName}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-slate-600" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 h-16 border-b border-slate-200 bg-white sticky top-0 z-30">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="w-5 h-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 px-2 mb-8">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="font-bold text-slate-900">WEALTHBLOOM</div>
              </Link>
              <NavLinks onNavigate={() => setOpen(false)} />
              <Button variant="ghost" className="w-full justify-start mt-4" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">WEALTHBLOOM</span>
          </div>
          <Bell className="w-5 h-5 text-slate-500" />
        </header>
        <main className="flex-1 p-4 lg:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}