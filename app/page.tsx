import { getWorkFeed, getWorkRankingsRanked, getRankingTotal } from "@/lib/queries";
import { SwipeNav } from "@/components/SwipeNav";
import { RankingSection } from "@/components/RankingSection";
import { PcHome } from "@/components/PcHome";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

function ago(d: Date): string {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "たった今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

// AIENホーム（ドメイン直下で表示）。スマホ＝スワイプフィード／PC＝人気順ランキング一覧。
export default async function Home() {
  const [feed, ranked, total] = await Promise.all([getWorkFeed(), getWorkRankingsRanked(), getRankingTotal()]);

  return (
    <>
      {/* スマホ：スワイプフィード */}
      <div className="md:hidden">
        {/* 右上にAIENロゴ（固定） */}
        <div className="fixed top-3 right-4 z-40">
          <Logo size={19} />
        </div>
        <div data-feed className="h-[100dvh] overflow-y-scroll overscroll-contain snap-y snap-mandatory bg-neutral-950 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <SwipeNav />
          {feed.map((r) => (
            <section
              key={r.slug}
              className="h-[100dvh] snap-start snap-always flex flex-col items-center justify-center px-5 py-4"
            >
              <RankingSection slug={r.slug} title={r.title} count={r.count} agoText={ago(r.createdAt)} good={r.good} bad={r.bad} entries={r.entries} total={total} />
            </section>
          ))}
        </div>
      </div>

      {/* PC：人気順ランキング一覧 */}
      <PcHome rankings={ranked.map((r) => ({ ...r, agoText: ago(r.createdAt) }))} total={total} />
    </>
  );
}
