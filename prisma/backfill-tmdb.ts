// 既存の全作品に、TMDBの実ポスター・配信先・主演・公開年を追記（再シード不要）。
// 実行: TMDB_API_KEY=xxx npx tsx prisma/backfill-tmdb.ts
import { PrismaClient } from "@prisma/client";
if (typeof process.loadEnvFile === "function") { try { process.loadEnvFile(); } catch {} } // .env を自動読込
const prisma = new PrismaClient();
const TMDB_KEY = process.env.TMDB_API_KEY;
const UA = "AIEN/0.1 (prototype)";

const PROVIDER_MAP: Record<string, string> = {
  "U-NEXT": "U-NEXT",
  Netflix: "Netflix",
  "Disney Plus": "Disney+",
  "Amazon Prime Video": "Prime Video",
  "Amazon Video": "Prime Video",
  Hulu: "Hulu",
  "DMM TV": "DMM TV",
  Lemino: "Lemino",
  "Lemino Premium": "Lemino",
  AbemaTV: "ABEMA",
  ABEMA: "ABEMA",
  FOD: "FOD",
};

type Info = { posterUrl: string | null; cast: string | null; providers: string | null; year: number | null };

async function tmdbInfo(title: string): Promise<Info> {
  const empty: Info = { posterUrl: null, cast: null, providers: null, year: null };
  if (!TMDB_KEY) return empty;
  try {
    const r = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=ja-JP&include_adult=false`,
      { headers: { "User-Agent": UA } }
    );
    if (!r.ok) return empty;
    const j = await r.json();
    const hit =
      (j.results ?? []).find((x: { poster_path?: string; media_type?: string }) => x.poster_path && (x.media_type === "movie" || x.media_type === "tv")) ??
      (j.results ?? []).find((x: { media_type?: string }) => x.media_type === "movie" || x.media_type === "tv");
    if (!hit) return empty;
    const posterUrl = hit.poster_path ? `https://image.tmdb.org/t/p/w342${hit.poster_path}` : null;
    const date: string = hit.release_date || hit.first_air_date || "";
    const year = date ? parseInt(date.slice(0, 4), 10) || null : null;

    let cast: string | null = null;
    let providers: string | null = null;
    if (hit.id && (hit.media_type === "movie" || hit.media_type === "tv")) {
      try {
        const cr = await fetch(`https://api.themoviedb.org/3/${hit.media_type}/${hit.id}/credits?api_key=${TMDB_KEY}&language=ja-JP`, { headers: { "User-Agent": UA } });
        if (cr.ok) {
          const cj = await cr.json();
          const names = (cj.cast ?? []).slice(0, 3).map((c: { name?: string }) => c.name).filter(Boolean);
          if (names.length) cast = names.join("・");
        }
      } catch {}
      try {
        const pr = await fetch(`https://api.themoviedb.org/3/${hit.media_type}/${hit.id}/watch/providers?api_key=${TMDB_KEY}`, { headers: { "User-Agent": UA } });
        if (pr.ok) {
          const pj = await pr.json();
          const flat: { provider_name?: string }[] = pj.results?.JP?.flatrate ?? [];
          const mapped = [...new Set(flat.map((p) => PROVIDER_MAP[p.provider_name ?? ""]).filter(Boolean))];
          if (mapped.length) providers = mapped.join(",");
        }
      } catch {}
    }
    return { posterUrl, cast, providers, year };
  } catch {
    return empty;
  }
}

async function main() {
  if (!TMDB_KEY) {
    console.error("TMDB_API_KEY が無い。 TMDB_API_KEY=xxx を付けて実行してください。");
    return;
  }
  const works = await prisma.work.findMany();
  let poster = 0,
    prov = 0;
  for (const w of works) {
    const info = await tmdbInfo(w.title);
    await prisma.work.update({
      where: { id: w.id },
      data: {
        posterUrl: info.posterUrl ?? w.posterUrl,
        cast: info.cast ?? w.cast,
        providers: info.providers ?? w.providers,
        year: info.year ?? w.year,
      },
    });
    if (info.posterUrl) poster++;
    if (info.providers) prov++;
    if (!info.posterUrl) console.log("  ポスター無し:", w.title);
    await new Promise((r) => setTimeout(r, 60));
  }
  console.log(`完了。ポスター ${poster}/${works.length}、配信先 ${prov}/${works.length}`);
}

main().finally(() => prisma.$disconnect());
