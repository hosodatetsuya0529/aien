"use client";

import { useState } from "react";

type Choice = "good" | "bad" | null;

// ランキング（AIのこの並び）へのグッド/バッド。1票だけ・付け替え/取消可（楽観更新）。
export function RankingVote({ slug, initialGood, initialBad }: { slug: string; initialGood: number; initialBad: number }) {
  const [good, setGood] = useState(initialGood);
  const [bad, setBad] = useState(initialBad);
  const [choice, setChoice] = useState<Choice>(null);
  const [busy, setBusy] = useState(false);

  const vote = async (v: "good" | "bad") => {
    if (busy) return;
    setBusy(true);
    const prev = choice;
    const next: Choice = prev === v ? null : v;
    setGood((g) => g + (next === "good" ? 1 : 0) - (prev === "good" ? 1 : 0));
    setBad((b) => b + (next === "bad" ? 1 : 0) - (prev === "bad" ? 1 : 0));
    setChoice(next);
    try {
      await fetch(`/api/work-rankings/${slug}/vote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vote: v, prev }),
      });
    } catch {}
    setBusy(false);
  };

  return (
    <div className="flex items-center gap-2" data-swipenav>
      <button
        type="button"
        onClick={() => vote("good")}
        aria-label="このランキングにグッド"
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition border ${
          choice === "good"
            ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-300"
            : "bg-white/[0.06] border-white/10 text-white/65 hover:bg-white/10"
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
          <path d="M2 10h4v11H2zM21.5 11.2c.3.4.5.9.5 1.4l-1.3 6A2 2 0 0 1 18.8 20H9V9.3l4.5-7c.5-.7 1.5-.9 2.2-.4.5.4.8 1 .7 1.6L15.6 9h4.3c.7 0 1.3.4 1.6 1z" />
        </svg>
        {good}
      </button>
      <button
        type="button"
        onClick={() => vote("bad")}
        aria-label="このランキングにバッド"
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition border ${
          choice === "bad"
            ? "bg-rose-500/20 border-rose-400/50 text-rose-300"
            : "bg-white/[0.06] border-white/10 text-white/65 hover:bg-white/10"
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
          <path d="M18 3h4v11h-4zM2.5 12.8c-.3-.4-.5-.9-.5-1.4l1.3-6A2 2 0 0 1 5.2 4H15v10.7l-4.5 7c-.5.7-1.5.9-2.2.4-.5-.4-.8-1-.7-1.6L8.4 15H4.1c-.7 0-1.3-.4-1.6-1z" />
        </svg>
        {bad}
      </button>
    </div>
  );
}
