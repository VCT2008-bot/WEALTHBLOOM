import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { formatNaira, fetchCurrentRate, formatDate } from "@/lib/wb";
import StatCard from "@/components/wb/StatCard";
import EmptyState from "@/components/wb/EmptyState";
import AIAssistant from "@/components/wb/AIAssistant";
import { Button } from "@/components/ui/button";
import { TrendingUp, Wallet, ArrowDownToLine, ListChecks, Sparkles, Info } from "lucide-react";

export default function UserDashboard() {
  const { user } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [inv, tx, r] = await Promise.all([
          base44.entities.Investment.filter({}),
          base44.entities.Transaction.filter({}, "-created_date", 5),
          fetchCurrentRate(),
        ]);
        setInvestments(inv);
        setTransactions(tx);
        setRate(r);
      } catch (e) {} finally { setLoading(false); }
    })();
  }, []);

  const active = investments.filter((i) => i.status === "active" || i.status === "matured");
  const totalInvested = investments.reduce((a, i) => a + (i.principal || 0), 0);
  const portfolioValue = active.reduce((a, i) => a + (i.current_balance || 0), 0);
  const totalEarnings = investments.reduce((a, i) => a + (i.earnings || 0), 0);
  const withdrawable = investments.filter((i) => i.withdrawable).reduce((a, i) => a + (i.current_balance || 0), 0);
  const activeCount = investments.filter((i) => i.status === "active").length;
  const maturedCount = investments.filter((i) => i.status === "matured").length;

  const firstName = (user?.full_name || "there").split(" ")[0];
  const hasInvestments = investments.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome, {firstName}</h1>
          <p className="text-sm text-slate-500">Here's your WEALTHBLOOM overview.</p>
        </div>
        <AIAssistant />
      </div>

      {/* Current rate card */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium opacity-90">Current Investment Rate</span>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <div className="text-xs opacity-75">Annual</div>
            <div className="text-2xl font-bold">{rate?.annual_rate ?? 0}%</div>
          </div>
          <div>
            <div className="text-xs opacity-75">Monthly</div>
            <div className="text-2xl font-bold">{rate?.monthly_rate ?? 0}%</div>
          </div>
          <div>
            <div className="text-xs opacity-75">Daily</div>
            <div className="text-2xl font-bold">{rate?.daily_rate ?? 0}%</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-xs opacity-80">
          <span>Source: {rate?.source || "Administrator-configured rate"}</span>
          <span>•</span>
          <span>Last updated: {formatDate(rate?.effective_date)}</span>
          <span>•</span>
          <span>Status: {rate?.status || "current"}</span>
        </div>
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex gap-2 text-xs text-amber-800">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Investment returns are variable and may change based on prevailing market conditions. Past performance does not guarantee future results.</span>
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Investment Balance" value={formatNaira(portfolioValue)} accent="emerald" icon={Wallet} />
        <StatCard label="Total Invested" value={formatNaira(totalInvested)} accent="slate" icon={TrendingUp} />
        <StatCard label="Total Earnings" value={formatNaira(totalEarnings)} accent="blue" icon={Sparkles} />
        <StatCard label="Withdrawable" value={formatNaira(withdrawable)} accent="amber" icon={ArrowDownToLine} />
        <StatCard label="Active Investments" value={activeCount} accent="emerald" icon={TrendingUp} />
        <StatCard label="Matured Investments" value={maturedCount} accent="slate" icon={ListChecks} />
        <StatCard label="Total Transactions" value={transactions.length} accent="blue" icon={Wallet} />
        <StatCard label="Account Status" value={user?.data?.account_status || "active"} accent="amber" />
      </div>

      {!hasInvestments && (
        <div className="bg-white rounded-2xl border border-slate-200">
          <EmptyState
            title="Welcome to WEALTHBLOOM."
            message="Investment Balance: ₦0.00. You don't have any investments yet. Start your first investment when you're ready."
            action={<Button asChild className="bg-emerald-600 hover:bg-emerald-700"><Link to="/invest">Start Investing</Link></Button>}
          />
        </div>
      )}

      {hasInvestments && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Active Investments</h2>
            <Button asChild variant="outline" size="sm"><Link to="/my-investments">View all</Link></Button>
          </div>
          <div className="space-y-2">
            {active.slice(0, 3).map((i) => (
              <div key={i.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div>
                  <div className="font-medium text-slate-900">{formatNaira(i.principal)}</div>
                  <div className="text-xs text-slate-500">Balance {formatNaira(i.current_balance)} • {i.status}</div>
                </div>
                <div className="text-right text-xs text-slate-500">Matures {formatDate(i.maturity_date)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}