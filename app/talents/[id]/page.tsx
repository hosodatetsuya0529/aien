import Link from "next/link";
import { notFound } from "next/navigation";
import { getTalent } from "@/lib/queries";
import { Avatar } from "@/components/Avatar";

export const dynamic = "force-dynamic";

export default async function TalentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getTalent(id);
  if (!data) notFound();
  const { talent, appearances } = data;

  return (
    <main className="w-full max-w-2xl mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">
        ← トップにもどる
      </Link>

      <section className="mt-4 flex items-center gap-4">
        <div className="rounded-xl overflow-hidden shrink-0">
          <Avatar name={talent.name} photoUrl={talent.photoUrl} size={88} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold">{talent.name}</h1>
          {talent.kana && <p className="text-xs text-neutral-400">{talent.kana}</p>}
          <p className="text-sm text-neutral-500 mt-1">{talent.profile}</p>
          <p className="text-xs text-neutral-400 mt-0.5">{talent.agency}</p>
        </div>
      </section>

      {talent.tags && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {talent.tags.split(",").map((t) => (
            <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              {t}
            </span>
          ))}
        </div>
      )}

      <h2 className="text-sm font-medium mt-7 mb-3">登場しているランキング</h2>
      <ul className="space-y-2">
        {appearances.map((a) => (
          <li key={a.rankingSlug}>
            <Link
              href={`/rankings/${a.rankingSlug}`}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 hover:border-neutral-300 dark:hover:border-neutral-700 transition"
            >
              <span className="text-base font-bold text-neutral-700 dark:text-neutral-300 tabular-nums shrink-0 w-12 text-center">
                {a.position}<span className="text-xs font-normal text-neutral-400">位</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-sm font-medium block">{a.rankingTitle}</span>
                <span className="text-xs text-neutral-500 line-clamp-1">{a.blurb}</span>
              </span>
              <span className="text-xs text-rose-500 shrink-0">♥ {a.likes}</span>
            </Link>
          </li>
        ))}
        {appearances.length === 0 && (
          <li className="text-sm text-neutral-400">まだランキングに登場していません。</li>
        )}
      </ul>

      <footer className="mt-10 text-xs text-neutral-400 leading-relaxed">
        写真・プロフィールの出典はWikipedia（CC BY-SA）。掲載は参考であり優劣の断定ではありません。
      </footer>
    </main>
  );
}
