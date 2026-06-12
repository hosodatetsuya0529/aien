import Link from "next/link";
import { notFound } from "next/navigation";
import { getWork } from "@/lib/queries";
import { moodColor } from "@/lib/mood";
import { displayTitle, rankLabel } from "@/lib/title";
import { parseProviders, providerStyle, watchUrl } from "@/lib/providers";
import { Poster } from "@/components/Poster";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getWork(id);
  if (!data) notFound();
  const { work, appearances } = data;
  const watchProviders = parseProviders(work.providers); // 優先度順

  // タイトル・年・配信バッジ
  const Meta = () => (
    <>
      <h1 className="text-[22px] md:text-[28px] font-bold leading-tight">{work.title}</h1>
      {work.year && <p className="text-[13px] md:text-[14px] text-white/45 mt-1.5 md:mt-2">{work.year}年</p>}
    </>
  );

  // 視聴リンク：配信中の全サービス分（優先度順）。便利リンクとして提示（現状アフィリではない）。
  const Watch = () =>
    watchProviders.length > 0 ? (
      <div className="mt-7 max-w-md space-y-2">
        {watchProviders.map((p) => {
          const s = providerStyle(p);
          return (
            <a
              key={p}
              href={watchUrl(p, work.title)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 font-bold text-[14px] ring-1 ring-inset ring-white/30 hover:brightness-110 active:scale-[0.99] transition"
              style={{ background: s.bg, color: s.fg }}
            >
              <span className="min-w-0">{s.label}で「{work.title}」を観よう</span>
              <span className="shrink-0">→</span>
            </a>
          );
        })}
      </div>
    ) : null;

  // AIの感想
  const AiComment = () =>
    work.aiComment ? (
      <section className="mt-7 max-w-2xl rounded-2xl bg-emerald-400/[0.07] border border-emerald-400/20 p-5">
        <p className="text-[12px] font-bold text-emerald-300 mb-2 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          AIの感想
        </p>
        <p className="text-base md:text-lg text-white leading-relaxed font-medium">{work.aiComment}</p>
      </section>
    ) : null;

  // 作品紹介（公式のあらすじ。無ければ非表示）
  const Synopsis = () =>
    work.overview ? (
      <section className="mt-8">
        <h2 className="text-sm font-bold text-white/80 mb-2">作品紹介</h2>
        <p className="text-sm md:text-[15px] text-white/70 leading-relaxed">{work.overview}</p>
      </section>
    ) : null;

  // この作品が入っているランキング（回遊導線）。「色んなランキングに入ってる→見てみよう」
  const Appearances = () =>
    appearances.length > 0 ? (
      <section className="mt-7">
        <h2 className="text-sm font-bold text-white/80 mb-3">この作品が入っているランキング</h2>
        <div className="space-y-2">
          {appearances.map((a) => (
            <Link
              key={a.rankingSlug}
              href={`/movies/rankings/${a.rankingSlug}`}
              className="flex items-center gap-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition border border-white/8 px-3.5 py-2.5"
            >
              <span className="text-[15px] font-black tabular-nums shrink-0 leading-none" style={{ color: moodColor(a.rankingSlug) }}>
                {a.position}位
              </span>
              <span className="min-w-0 flex-1 text-[13px] font-semibold leading-snug line-clamp-1">
                {displayTitle(a.rankingTitle)}
                <span className="ml-1 text-white/45 font-normal">{rankLabel(a.rankingTitle, a.count)}</span>
              </span>
              <span className="text-white/25 shrink-0">→</span>
            </Link>
          ))}
        </div>
      </section>
    ) : null;

  return (
    <div className="min-h-[100dvh] bg-neutral-950 text-neutral-100">
      {/* スマホ版 */}
      <div className="md:hidden w-full max-w-[440px] mx-auto px-5 py-6 pb-12">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-[13px] text-white/55 hover:text-white">← もどる</Link>
          <Logo size={19} />
        </div>
        <div className="mt-6 flex gap-4 items-start">
          <div className="w-[140px] h-[210px] rounded-xl overflow-hidden shrink-0 bg-neutral-800 ring-1 ring-white/10">
            <Poster title={work.title} posterUrl={work.posterUrl} />
          </div>
          {/* タイトル＋年を上寄せ、その下に公式紹介文。ポスターの高さを超えた分はフェードで途切れさせる */}
          <div className="min-w-0 flex-1 h-[210px] flex flex-col">
            <Meta />
            {work.overview && (
              <div className="relative mt-2.5 flex-1 min-h-0 overflow-hidden">
                <p className="text-[12px] text-white/55 leading-relaxed">{work.overview}</p>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-gradient-to-b from-transparent to-neutral-950" />
              </div>
            )}
          </div>
        </div>
        <Watch />
        <AiComment />
        <Appearances />
      </div>

      {/* PC版（ポスター＋情報の2カラム → その下に作品紹介） */}
      <div className="hidden md:block w-full max-w-3xl mx-auto px-7 pt-14 pb-20">
        <div className="flex items-center gap-3.5">
          <Link href="/" className="text-sm text-white/55 hover:text-white">← もどる</Link>
          <Logo size={20} />
        </div>
        <div className="mt-11 flex gap-8 items-start">
          {/* 左：ポスター＋その下に作品紹介（ポスター幅で折り返す） */}
          <div className="w-[220px] shrink-0">
            <div className="w-full h-[330px] rounded-2xl overflow-hidden bg-neutral-800 ring-1 ring-white/10">
              <Poster title={work.title} posterUrl={work.posterUrl} />
            </div>
            <Synopsis />
          </div>
          <div className="min-w-0 flex-1">
            <Meta />
            <Watch />
            <AiComment />
            <Appearances />
          </div>
        </div>
      </div>
    </div>
  );
}
