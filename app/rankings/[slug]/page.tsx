import Link from "next/link";
import { notFound } from "next/navigation";
import { getRanking } from "@/lib/queries";
import { Avatar } from "@/components/Avatar";
import { LikeButton } from "@/components/LikeButton";

export const dynamic = "force-dynamic";

function ago(d: Date): string {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "たった今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

const RANK_COLOR = ["#F6B100", "#D6DAE0", "#D89A5C"];
const rankColor = (i: number) => RANK_COLOR[i] ?? "rgba(255,255,255,0.45)";

export default async function RankingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ranking = await getRanking(slug);
  if (!ranking) notFound();

  return (
    <div className="min-h-[100dvh] bg-neutral-950 text-neutral-100">
      <div className="w-full max-w-xl mx-auto px-5 py-6">
        <Link href="/" className="text-[13px] text-white/55 hover:text-white">
          ← トップにもどる
        </Link>

        <header className="mt-4 mb-5">
          <p className="mb-2 text-[12px] text-white/55">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 align-middle mr-1.5 animate-pulse" />
            AIが
            <span className="text-emerald-400 font-bold mx-0.5">{ago(ranking.createdAt)}</span>
            に生成
          </p>
          <h1 className="text-2xl font-bold leading-tight">
            {ranking.title}
            <span className="text-amber-400 ml-1.5 whitespace-nowrap">TOP{ranking.entries.length}</span>
          </h1>
          {ranking.description && (
            <p className="text-sm text-white/60 mt-1.5">{ranking.description}</p>
          )}
          <p className="text-[11px] text-white/35 mt-2">{ranking.methodNote}</p>
        </header>

        <ol>
          {ranking.entries.map((e, i) => (
            <li key={e.id}>
              <div className="flex items-center gap-3.5 py-3 border-t border-white/8">
                <span
                  className="w-9 text-center shrink-0 font-bold tabular-nums"
                  style={{ color: rankColor(i), fontSize: i < 3 ? 19 : 16 }}
                >
                  {i + 1}
                </span>
                <Link
                  href={`/talents/${e.talent.id}`}
                  className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-neutral-800 ${
                    i === 0 ? "ring-2 ring-amber-400" : "ring-1 ring-white/10"
                  }`}
                >
                  <Avatar name={e.talent.name} photoUrl={e.talent.photoUrl} fill />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/talents/${e.talent.id}`} className="font-semibold hover:underline">
                    {e.talent.name}
                  </Link>
                  {e.talent.profile && (
                    <p className="text-[12px] text-white/45 truncate">{e.talent.profile}</p>
                  )}
                </div>
                <LikeButton entryId={e.id} initialLikes={e.likes} tone="dark" />
              </div>

              {/* 本文内の広告枠（SEO流入の回収ポイント） */}
              {i === 4 && (
                <div className="my-3 rounded-xl border border-dashed border-white/15 py-6 text-center text-[11px] text-white/30">
                  広告（スポンサー）
                </div>
              )}
            </li>
          ))}
        </ol>

        <footer className="mt-8 text-[11px] text-white/35 leading-relaxed">
          AIによる選定・順位付けに読者の「いいね」を加味したものです。掲載は参考であり優劣の断定ではありません。写真・話題度・プロフィールの出典はTMDB・Wikipedia。
        </footer>
      </div>
    </div>
  );
}
