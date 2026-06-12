import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const UA = "TalentRankMVP/0.1 (prototype)";
const TMDB_KEY = process.env.TMDB_API_KEY;
const SERPAPI_KEY = process.env.SERPAPI_KEY;

// 写真ソース①：TMDB（映画・ドラマ系。合法だが商用は要ライセンス）
async function tmdbPhoto(name: string): Promise<string | null> {
  if (!TMDB_KEY) return null;
  try {
    const r = await fetch(
      `https://api.themoviedb.org/3/search/person?api_key=${TMDB_KEY}&query=${encodeURIComponent(name)}&language=ja-JP&include_adult=false`,
      { headers: { "User-Agent": UA } }
    );
    if (r.ok) {
      const j = await r.json();
      const p = j.results?.[0]?.profile_path;
      if (p) return `https://image.tmdb.org/t/p/w342${p}`;
    }
  } catch {}
  return null;
}

// 写真ソース②：画像検索（SerpAPI / Google画像）。残り全員ぶんを埋める＝グレー運用。
async function searchPhoto(name: string): Promise<string | null> {
  if (!SERPAPI_KEY) return null;
  try {
    const r = await fetch(
      `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(name)}&api_key=${SERPAPI_KEY}&num=10`,
      { headers: { "User-Agent": UA } }
    );
    if (r.ok) {
      const j = await r.json();
      const img = j.images_results?.[0];
      return img?.original ?? img?.thumbnail ?? null;
    }
  } catch {}
  return null;
}

async function main() {
  if (!TMDB_KEY && !SERPAPI_KEY) {
    console.error("TMDB_API_KEY も SERPAPI_KEY も .env に未設定です。少なくとも片方を入れてください。");
    process.exit(1);
  }

  const targets = await prisma.talent.findMany({ where: { photoUrl: null } });
  console.log(`写真が無いタレント: ${targets.length}人（TMDB:${TMDB_KEY ? "有" : "無"} / 画像検索:${SERPAPI_KEY ? "有" : "無"}）`);

  let filled = 0;
  for (const t of targets) {
    let photo = await tmdbPhoto(t.name);
    if (!photo) photo = await searchPhoto(t.name);
    if (photo) {
      await prisma.talent.update({ where: { id: t.id }, data: { photoUrl: photo } });
      filled++;
      console.log(`  ✓ ${t.name}`);
    } else {
      console.log(`  – ${t.name}（取得できず）`);
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  console.log(`完了：${filled}/${targets.length}人ぶんの写真を追加`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
