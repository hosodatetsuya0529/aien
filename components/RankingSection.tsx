import Link from "next/link";
import { RankingRow, type FeedEntry } from "./RankingRow";
import { RankingVote } from "./RankingVote";
import { RankingCount } from "./RankingCount";
import { moodColor } from "@/lib/mood";
import { displayTitle, rankLabel } from "@/lib/title";

// フィードの1ランキング分（折りたたみカード）。
// 1位・2位フル＋3位を下端フェードでチラ見せ。「3位以降を見る」で詳細ページへ遷移。
export function RankingSection({
  slug,
  title,
  count,
  agoText,
  good,
  bad,
  entries,
  total,
}: {
  slug: string;
  title: string;
  count: number;
  agoText: string;
  good: number;
  bad: number;
  entries: FeedEntry[];
  total: number;
}) {
  const href = `/movies/rankings/${slug}`;
  const top2 = entries.slice(0, 2);
  const peek = entries[2];
  const accent = moodColor(slug);

  return (
    <div className="w-full max-w-[440px]">
      <div className="mb-2 flex items-center justify-between gap-2 text-[12px] text-white/55">
        <span className="truncate">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 align-middle mr-1.5 animate-pulse" />
          AIが
          <span className="text-emerald-400 font-bold mx-0.5">{agoText}</span>
          に生成
        </span>
        <RankingCount count={total} />
      </div>

      <div
        className="rounded-xl px-4 py-3 mb-2 border-l-[3px] border"
        style={{ background: `${accent}1f`, borderColor: `${accent}66`, borderLeftColor: accent }}
      >
        <h2 className="text-[20px] font-extrabold text-white leading-[1.22] tracking-tight">
          {displayTitle(title)}
          <span className="ml-1.5 whitespace-nowrap font-black" style={{ color: accent }}>{rankLabel(title, count)}</span>
        </h2>
      </div>

      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-[11px] text-white/40 shrink-0">このランキング、どう？</span>
        <RankingVote slug={slug} initialGood={good} initialBad={bad} />
      </div>

      <ol className="space-y-3">
        {top2.map((e, i) => (
          <RankingRow key={e.entryId} e={e} i={i} compact />
        ))}
      </ol>

      {peek && (
        <div className="relative h-[92px] overflow-hidden mt-3">
          <ol>
            <RankingRow e={peek} i={2} compact />
          </ol>
          <Link
            href={href}
            aria-label="3位以降を見る"
            className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-950/50 to-neutral-950"
          />
        </div>
      )}

      <div className="mt-2.5 text-center">
        <Link
          href={href}
          className="inline-block rounded-full border border-white/20 bg-white/[0.06] px-5 py-2 text-[13px] font-bold text-white/90 hover:bg-white/12 active:scale-[0.98] transition"
        >
          3位以降を見る →
        </Link>
      </div>
    </div>
  );
}
