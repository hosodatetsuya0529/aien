import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShareButton } from "@/components/ShareButton";
import { getWorkRanking } from "@/lib/queries";
import { RankingRow } from "@/components/RankingRow";
import { RankingVote } from "@/components/RankingVote";
import { Logo } from "@/components/Logo";
import { moodColor } from "@/lib/mood";
import { displayTitle, rankLabel } from "@/lib/title";

export const dynamic = "force-dynamic";

function ago(d: Date): string {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "たった今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

// シェアされた時のOGカード用メタデータ（画像は opengraph-image.tsx が自動生成）
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = await getWorkRanking(slug);
  if (!r) return {};
  const name = `${displayTitle(r.title)}${rankLabel(r.title, r.count)}`;
  const description = "AIが自動生成したエンタメランキング。いま配信で観られる作品だけ。";
  return {
    title: `${name} | AIEN`,
    description,
    openGraph: { title: name, description, type: "article" },
    twitter: { card: "summary_large_image", title: name, description },
  };
}

export default async function WorkRankingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await getWorkRanking(slug);
  if (!r) notFound();

  return (
    <div className="min-h-[100dvh] bg-neutral-950 text-neutral-100">
      <div className="w-full max-w-[440px] mx-auto px-5 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-[13px] text-white/55 hover:text-white">← もどる</Link>
          <Logo size={19} />
        </div>

        <header className="mt-4 mb-5">
          <p className="mb-1.5 text-[12px] text-white/55">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 align-middle mr-1.5 animate-pulse" />
            AIが
            <span className="text-emerald-400 font-bold mx-0.5">{ago(r.createdAt)}</span>
            に生成
          </p>
          <div
            className="rounded-xl px-4 py-3.5 border-l-[3px] border"
            style={{ background: `${moodColor(slug)}1f`, borderColor: `${moodColor(slug)}66`, borderLeftColor: moodColor(slug) }}
          >
            <h1 className="text-[20px] font-extrabold text-white leading-[1.22] tracking-tight">
              {displayTitle(r.title)}
              <span className="ml-1.5 whitespace-nowrap font-black" style={{ color: moodColor(slug) }}>{rankLabel(r.title, r.count)}</span>
            </h1>
          </div>

          <div className="flex items-center gap-2.5 mt-3">
            <span className="text-[11px] text-white/40 shrink-0">このランキング、どう？</span>
            <RankingVote slug={r.slug} initialGood={r.good} initialBad={r.bad} />
            <span className="ml-auto">
              <ShareButton slug={r.slug} title={r.title} count={r.count} />
            </span>
          </div>
        </header>

        <ol className="space-y-4">
          {r.entries.map((e, i) => (
            <RankingRow key={e.entryId} e={e} i={i} />
          ))}
        </ol>
      </div>
    </div>
  );
}
