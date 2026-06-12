import Link from "next/link";
import { getFeedByCategory } from "@/lib/queries";
import { Avatar } from "@/components/Avatar";
import { Carousel } from "@/components/Carousel";

export const dynamic = "force-dynamic";

function ago(d: Date): string {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "たった今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

function Fresh({ d }: { d: Date }) {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 15)
    return (
      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
        ● {ago(d)}
      </span>
    );
  return <span className="text-[10px] text-neutral-400">{ago(d)}生成</span>;
}

const RANK_COLOR = ["#C99700", "#8A8F98", "#B06A2C"];
function rankColor(i: number) {
  return RANK_COLOR[i] ?? "#A9A6A0";
}

function RankingCard({
  slug,
  title,
  count,
  createdAt,
  thumbs,
}: {
  slug: string;
  title: string;
  count: number;
  createdAt: Date;
  thumbs: { talentId: string; name: string; photoUrl: string | null }[];
}) {
  return (
    <Link
      href={`/rankings/${slug}`}
      className="shrink-0 w-[270px] rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md hover:border-neutral-300 transition overflow-hidden"
    >
      <div className="px-3.5 pt-3 pb-2 border-b border-neutral-100">
        <div className="flex items-center justify-between mb-1">
          <Fresh d={createdAt} />
          <span className="text-[10px] text-neutral-400">全{count}人</span>
        </div>
        <h3 className="text-sm font-semibold leading-snug line-clamp-1">{title}</h3>
      </div>

      <ol className="px-2 py-1.5">
        {thumbs.map((t, i) => (
          <li
            key={t.talentId}
            className={`flex items-center gap-2.5 px-1.5 py-1.5 rounded-lg ${i === 0 ? "bg-amber-50" : ""}`}
          >
            <span
              className="w-6 text-center shrink-0 font-bold tabular-nums"
              style={{ color: rankColor(i), fontSize: i === 0 ? 20 : 17 }}
            >
              {i + 1}
            </span>
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-neutral-100">
              <Avatar name={t.name} photoUrl={t.photoUrl} fill />
            </div>
            <span className="text-[13px] font-medium truncate flex-1">{t.name}</span>
          </li>
        ))}
      </ol>

      <div className="px-3.5 py-2 border-t border-neutral-100 text-[11px] text-neutral-500">
        ランキングを全部見る ›
      </div>
    </Link>
  );
}

export default async function Browse() {
  const { groups, totalRankings, totalPeople } = await getFeedByCategory();

  return (
    <div className="w-full">
      <header className="border-b border-neutral-200 bg-white/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            タレント名鑑<span className="text-emerald-600">.</span>
          </Link>
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <Link href="/" className="text-emerald-600 font-medium">スワイプで見る →</Link>
            <span>
              ランキング <b className="text-neutral-800">{totalRankings.toLocaleString()}</b> 本
            </span>
            <span>
              掲載 <b className="text-neutral-800">{totalPeople.toLocaleString()}</b> 人
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-6">
        <h1 className="text-xl font-semibold mb-1">テーマ別タレントランキング（一覧）</h1>
        <p className="text-xs text-neutral-400 mb-6">
          AIが自動生成。横にスクロールして、気になるテーマへ。
        </p>

        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.category}>
              <h2 className="text-base font-semibold mb-2.5 flex items-center gap-2">
                <span className="w-1 h-4 bg-emerald-500 rounded-full inline-block" />
                {g.category}
              </h2>
              <Carousel>
                {g.rankings.map((r) => (
                  <RankingCard key={r.slug} {...r} />
                ))}
              </Carousel>
            </section>
          ))}
        </div>

        <footer className="mt-12 text-xs text-neutral-400 leading-relaxed max-w-2xl">
          本ランキングはAIによる選定・順位付けに読者の「いいね」を加味したものです。掲載は参考であり優劣の断定ではありません。写真・話題度・プロフィールの出典はTMDB・Wikipedia。
        </footer>
      </main>
    </div>
  );
}
