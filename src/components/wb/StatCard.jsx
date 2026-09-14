import React from "react";

export default function StatCard({ label, value, sublabel, accent = "emerald", icon: Icon }) {
  const accents = {
    emerald: "from-emerald-500 to-teal-600",
    slate: "from-slate-700 to-slate-900",
    amber: "from-amber-500 to-orange-600",
    blue: "from-blue-500 to-indigo-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${accents[accent]} flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
      {sublabel && <div className="text-xs text-slate-400">{sublabel}</div>}
    </div>
  );
}