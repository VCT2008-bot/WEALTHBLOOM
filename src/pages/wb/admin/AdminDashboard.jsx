import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatNaira, formatDateTime } from "@/lib/wb";
import StatCard from "@/components/wb/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Wallet, Percent, ArrowDownToLine, ArrowUpFromLine, BadgeDollarSign, ListChecks } from "lucide-react";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("adminStats", {});
        setData(res.data);
      } catch (e) {} finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" /></div>;
  if (!data) return <p className="text-slate-500">Unable to load dashboard.</p>;
  const s = data.stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500">Platform overview — all figures from live records.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={s.totalMembers} accent="slate" icon={Users} />
        <StatCard label="Total Invested" value={formatNaira(s.totalInvested)} accent="emerald" icon={TrendingUp} />
        <StatCard label="Portfolio Value" value={formatNaira(s.portfolioValue)} accent="blue" icon={Wallet} />
        <StatCard label="Total Earnings" value={formatNaira(s.totalEarnings)} accent="emerald" icon={Percent} />
        <StatCard label="Deposit Fees" value={formatNaira(s.depositFees)} accent="amber" icon={BadgeDollarSign} />
        <StatCard label="Withdrawal Fees" value={formatNaira(s.withdrawalFees)} accent="amber" icon={BadgeDollarSign} />
        <StatCard label="Total Platform Fees" value={formatNaira(s.totalFees)} accent="slate" icon={BadgeDollarSign} />
        <StatCard label="Active Investments" value={s.activeInvestments} accent="emerald" icon={TrendingUp} />
        <StatCard label="Matured Investments" value={s.maturedInvestments} accent="slate" icon={ListChecks} />
        <StatCard label="Pending Deposits" value={s.pendingDeposits} accent="amber" icon={ArrowDownToLine} />
        <StatCard label="Pending Withdrawals" value={s.pendingWithdrawals} accent="amber" icon={ArrowUpFromLine} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Deposits</CardTitle></CardHeader>
          <CardContent className="divide-y divide-slate-100">
            {data.recentDeposits.length === 0 && <p className="text-sm text-slate-400 py-4">No deposits yet.</p>}
            {data.recentDeposits.map((d) => (
              <div key={d.id} className="flex justify-between py-2.5 text-sm">
                <div><div className="font-medium text-slate-800">{d.user_email}</div><div className="text-xs text-slate-400">{formatDateTime(d.created_date)}</div></div>
                <div className="text-right"><div className="font-medium">{formatNaira(d.investment_amount)}</div><div className="text-xs text-slate-400">{d.status}</div></div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Withdrawals</CardTitle></CardHeader>
          <CardContent className="divide-y divide-slate-100">
            {data.recentWithdrawals.length === 0 && <p className="text-sm text-slate-400 py-4">No withdrawals yet.</p>}
            {data.recentWithdrawals.map((w) => (
              <div key={w.id} className="flex justify-between py-2.5 text-sm">
                <div><div className="font-medium text-slate-800">{w.user_email}</div><div className="text-xs text-slate-400">{w.withdrawal_type}</div></div>
                <div className="text-right"><div className="font-medium">{formatNaira(w.amount)}</div><div className="text-xs text-slate-400">{w.status}</div></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}