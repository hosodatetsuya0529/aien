"use client";

import { displayTitle, rankLabel } from "@/lib/title";

// 「Xでシェア」ボタン（グッド/バッドの並びの右に置く）。
// 同じタブで X の投稿画面へ素直に遷移する素のアンカー。投稿後は「戻る」でAIENに帰ってくる。
// 経緯: window.open はPWAでブロック / target=_blank ＋ x.com はアプリ引き渡し失敗で
// 元ページに弾かれる端末があった。長押し→新しいタブでは開けたことから、
// JSやタブ制御を一切挟まない同タブ遷移が最も確実。
const SITE = "https://aientame.com";

export function ShareButton({
  slug,
  title,
  count = 7,
}: {
  slug: string;
  title: string;
  count?: number;
}) {
  const text = `${displayTitle(title)}${rankLabel(title, count)}は…`;
  const url = `${SITE}/movies/rankings/${slug}`;
  const href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=AIEN`;

  const track = () => {
    (window as { gtag?: (...args: unknown[]) => void }).gtag?.("event", "share", {
      method: "x",
      content_type: "ranking",
      item_id: slug,
    });
  };

  return (
    <a
      href={href}
      onClick={track}
      aria-label="Xでシェア"
      className="relative z-40 flex items-center gap-1 shrink-0 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[12px] font-bold transition border bg-white/[0.06] border-white/10 text-white/65 hover:bg-white/10 active:scale-95"
    >
      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231z" />
      </svg>
      でシェア
    </a>
  );
}
