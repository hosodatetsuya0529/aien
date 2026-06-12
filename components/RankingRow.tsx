import Link from "next/link";
import { Poster } from "./Poster";
import { LikeButton } from "./LikeButton";
import { ProviderBadges } from "./ProviderBadges";

export type FeedEntry = {
  entryId: string;
  workId: string;
  title: string;
  posterUrl: string | null;
  providers: string | null;
  likes: number;
};

const RANK_COLOR = ["#F6B100", "#D6DAE0", "#D89A5C"];
const rankColor = (i: number) => RANK_COLOR[i] ?? "rgba(255,255,255,0.5)";

// フィード・ランキングページ共通の1行。
// ・ポスターをタップ → 作品ページ（/movies/works/[id]）へ
// ・配信サービス名のミニバッジ＋いいねを表示
// 1位＝金枠 / 2位＝銀枠 / それ以下＝控えめ
const rankRing = (i: number) =>
  i === 0 ? "ring-2 ring-amber-400" : i === 1 ? "ring-2 ring-[#C9D1DC]" : "ring-1 ring-white/10";

export function RankingRow({ e, i, compact = false }: { e: FeedEntry; i: number; compact?: boolean }) {
  const poster = compact ? "w-[108px] h-[162px]" : "w-[128px] h-[192px]";
  // 該当作なし（7枠に満たないテーマの空き枠）
  if (!e.workId) {
    return (
      <li className="flex items-center gap-4">
        <div className={`block ${poster} rounded-xl shrink-0 bg-neutral-800/40 ring-1 ring-white/10 flex items-center justify-center`}>
          <span className="text-[11px] text-white/25">該当作なし</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 leading-none text-white/30"><span className="font-bold text-[15px]">{i + 1}位</span></div>
          <p className="font-bold text-white/30 text-lg">該当作なし</p>
        </div>
      </li>
    );
  }
  return (
    <li className="flex items-center gap-4">
      <Link
        href={`/movies/works/${e.workId}`}
        className={`block ${poster} rounded-xl overflow-hidden shrink-0 bg-neutral-800 ${rankRing(i)}`}
      >
        <Poster title={e.title} posterUrl={e.posterUrl} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 leading-none" style={{ color: rankColor(i) }}>
          <span className="font-bold" style={{ fontSize: 15 }}>{i + 1}位</span>
        </div>
        <p className="font-bold text-white leading-tight text-lg line-clamp-2">{e.title}</p>
        {e.providers && <div className="mt-1.5"><ProviderBadges providers={e.providers} summary summaryCount={2} /></div>}
        <div className="mt-2.5">
          <LikeButton entryId={e.entryId} initialLikes={e.likes} tone="dark" endpoint={`/api/work-entries/${e.entryId}/like`} />
        </div>
      </div>
    </li>
  );
}
