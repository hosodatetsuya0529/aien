"use client";

import { displayTitle, rankLabel } from "@/lib/title";

// Xシェアボタン（TikTok風の矢印）。押すとXの投稿画面が
// 「〜〜ベスト7は…」＋ランキングURL入りで開く。
// フィードのレールでは props なしで置き、いま画面に出ている
// section[data-slug] からシェア対象を拾う（レールは固定表示で1個だけのため）。
export function ShareButton({
  slug,
  title,
  count = 7,
}: {
  slug?: string;
  title?: string;
  count?: number;
}) {
  const share = () => {
    let s = slug;
    let t = title;
    let c = count;
    if (!s || !t) {
      const feed = document.querySelector("[data-feed]") as HTMLElement | null;
      if (!feed) return;
      const base = feed.getBoundingClientRect().top - feed.scrollTop;
      let cur: HTMLElement | null = null;
      for (const el of feed.querySelectorAll<HTMLElement>(":scope > section[data-slug]")) {
        if (Math.round(el.getBoundingClientRect().top - base) <= feed.scrollTop + 4) cur = el;
      }
      if (!cur?.dataset.slug || !cur.dataset.title) return;
      s = cur.dataset.slug;
      t = cur.dataset.title;
      c = parseInt(cur.dataset.count || "7", 10);
    }
    const text = `${displayTitle(t)}${rankLabel(t, c)}は…`;
    const url = `${location.origin}/movies/rankings/${s}`;
    (window as { gtag?: (...args: unknown[]) => void }).gtag?.("event", "share", {
      method: "x",
      content_type: "ranking",
      item_id: s,
    });
    window.open(
      `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=AIEN`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <button
      onClick={share}
      aria-label="Xでシェア"
      className="flex flex-col items-center gap-1 text-white/60 hover:text-white/95 active:scale-95 transition"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M13 4v4c-6.575 1.028 -9.02 6.788 -10 12c-.037 .206 5.384 -5.962 10 -6v4l8 -7l-8 -7z" />
      </svg>
      <span className="text-[10px] tracking-wide">シェア</span>
    </button>
  );
}
