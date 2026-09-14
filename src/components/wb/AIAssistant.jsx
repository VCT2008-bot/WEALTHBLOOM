import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Send, Loader2 } from "lucide-react";

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");
    try {
      const res = await base44.functions.invoke("aiAssistant", { question });
      setAnswer(res.data?.answer || "Sorry, I couldn't process that.");
    } catch (e) {
      setAnswer("The assistant is unavailable right now. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "What is the current investment rate?",
    "How do service fees work?",
    "What investment periods are available?",
    "Can I withdraw early?",
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white gap-2">
          <Sparkles className="w-4 h-4" /> Ask the Assistant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" /> WEALTHBLOOM Assistant
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-slate-500 -mt-2">
          The assistant explains platform information using real, admin-configured data. It cannot access your balance or perform actions.
        </p>
        <div className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder="Ask about rates, fees, periods, withdrawals…"
          />
          <Button onClick={ask} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s} onClick={() => setQuestion(s)} className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
              {s}
            </button>
          ))}
        </div>
        {answer && (
          <div className="mt-2 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-slate-700 whitespace-pre-wrap">
            {answer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}