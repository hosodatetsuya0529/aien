"use client";

import { useState } from "react";
import Link from "next/link";
import { Poster } from "./Poster";
import { ProviderBadges } from "./ProviderBadges";
import { Logo } from "./Logo";
import { RankingCount } from "./RankingCount";
import { moodColor } from "@/lib/mood";
import { displayTitle, rankLabel } from "@/lib/title";
import type { FeedEntry } from "./RankingRow";

type PcRanking = {
  slug: string;
  title: string;
  count: number;
  good: number;
  bad: number;
  createdAt: string | Date;
  entries: FeedEntry[];
};

const PAGE = 10; // 「もっと見る」で10件ずつ追加

// 人気No.チップの色：1位から 赤・橙・黄・緑・青・藍・紫 でループ
const RAINBOW = ["#ff4d4d", "#ff9a3c", "#ffd83c", "#3dd65f", "#3b8cff", "#5b5bf0", "#b15cff"];

function ago(d: Date): string {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "たった今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

// ランキング1本（人気No.N＋テーマ＋作品7枚をコンテナ幅いっぱいに均等配置）
function Block({ r, idx }: { r: PcRanking; idx: number }) {
  const accent = moodColor(r.slug);
  const rankColor = RAINBOW[idx % RAINBOW.length];
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span
          className="text-[12px] font-black tabular-nums px-2 py-1 rounded-md shrink-0"
          style={{ color: rankColor, background: `${rankColor}22` }}
        >
          人気No.{idx + 1}
        </span>
        <h2 className="text-[19px] font-extrabold leading-tight tracking-tight">
          {displayTitle(r.title)}
          <span className="ml-1.5" style={{ color: accent }}>{rankLabel(r.title, r.count)}</span>
        </h2>
        <span className="text-[12px] text-white/40 shrink-0">
          AIが<span className="text-emerald-400/80">{ago(new Date(r.createdAt))}</span>に生成
        </span>
      </div>

      <div className="grid grid-cols-7 gap-3.5">
        {r.entries.map((e, i) =>
          !e.workId ? (
            <div key={e.entryId} className="min-w-0">
              <div className="aspect-[2/3] w-full rounded-lg bg-neutral-800/40 ring-1 ring-white/10 flex items-center justify-center">
                <span className="text-[10px] text-white/25">該当作なし</span>
              </div>
              <div className="mt-2 flex items-start gap-1.5">
                <span className="text-[17px] font-black tabular-nums leading-none mt-0.5 text-white/30">{i + 1}</span>
                <p className="text-[12px] font-semibold text-white/30 leading-tight">該当作なし</p>
              </div>
            </div>
          ) : (
          <div key={e.entryId} className="min-w-0">
            <Link
              href={`/movies/works/${e.workId}`}
              className={`block aspect-[2/3] w-full rounded-lg overflow-hidden bg-neutral-800 transition ${
                i === 0 ? "ring-2 ring-amber-400" : i === 1 ? "ring-2 ring-[#C9D1DC]" : "ring-1 ring-white/10 hover:ring-white/40"
              }`}
            >
              <Poster title={e.title} posterUrl={e.posterUrl} />
            </Link>
            <div className="mt-2 flex items-start gap-1.5">
              <span className="text-[17px] font-black tabular-nums leading-none mt-0.5" style={{ color: accent }}>
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-white/85 leading-tight line-clamp-1">{e.title}</p>
                {e.providers && <div className="mt-1"><ProviderBadges providers={e.providers} summary /></div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// PC版ホーム：ランキングを人気順で縦に積む。10件ずつ表示し、次の1本をフェードで覗かせて「もっと見る」。
export function PcHome({ rankings, total }: { rankings: PcRanking[]; total: number }) {
  const [shown, setShown] = useState(PAGE);
  const visible = rankings.slice(0, shown);
  const next = rankings[shown]; // 次に控えている1本（覗かせ用）

  return (
    <div className="hidden md:block min-h-screen bg-neutral-950 text-white">
      <div className="max-w-5xl mx-auto px-7 pt-12 pb-20">
        <header className="mb-6 flex items-baseline gap-2.5">
          <Logo size={26} />
          <h1 className="text-[20px] font-extrabold text-white leading-none">現在の人気ランキング</h1>
          <RankingCount count={total} />
        </header>

        <ol className="space-y-9">
          {visible.map((r, idx) => (
            <li key={r.slug}>
              <Block r={r} idx={idx} />
            </li>
          ))}
        </ol>

        {next && (
          <div className="relative mt-9 max-h-[200px] overflow-hidden">
            <Block r={next} idx={shown} />
            {/* 下に行くほど暗くフェード＝続きがある合図 */}
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/0 via-neutral-950/55 to-neutral-950" />
            <div className="absolute inset-x-0 bottom-0 flex justify-center pb-1">
              <button
                type="button"
                onClick={() => setShown((s) => s + PAGE)}
                className="rounded-full border border-white/20 bg-white/[0.08] hover:bg-white/15 backdrop-blur-sm transition px-8 py-2.5 text-sm font-bold shadow-lg"
              >
                もっと見る ↓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
