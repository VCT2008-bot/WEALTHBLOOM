import React from "react";
import AIAssistant from "@/components/wb/AIAssistant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Help() {
  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">Help</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">About WEALTHBLOOM</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>WEALTHBLOOM is an investment-management platform. You invest a chosen amount over a fixed period (30 days, 90 days, 6 months, or 1 year) and watch it grow.</p>
          <p>A ₦50 service fee is added to your investment amount — your full intended amount is invested. Withdrawals carry a flat ₦50 service fee with no early-withdrawal penalty.</p>
          <p className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-800">
            Investment returns are variable and may change based on prevailing market conditions. Past performance does not guarantee future results.
          </p>
          <div className="flex items-center justify-between pt-2">
            <span>Have a question?</span>
            <AIAssistant />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}