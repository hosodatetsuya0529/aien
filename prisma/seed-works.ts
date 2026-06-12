import { PrismaClient } from "@prisma/client";
import { seedDummyLikes } from "../lib/generator";

if (typeof process.loadEnvFile === "function") { try { process.loadEnvFile(); } catch {} } // .env を自動読込
const prisma = new PrismaClient();
const UA = "WorkRankMVP/0.1 (prototype)";
const TMDB_KEY = process.env.TMDB_API_KEY;

// ── 切り口の自由なテーマ別ランキング（選定・順位は AI=私の判断） ──
// 方針：テーマ名は「〜作品」で統一。1ランキングに映画・ドラマ・アニメをごちゃ混ぜ
// （サブスク時代＝視聴者は形式を区別しない。種別ラベルもUIに出さない）。
type Theme = { slug: string; title: string; description: string; titles: string[] };

// 種別（指定が無ければ "movie"）。表示には使わず内部管理用。
const KIND: Record<string, "drama" | "anime"> = {
  // ドラマ
  "愛の不時着": "drama", "イカゲーム": "drama", "ストレンジャー・シングス 未知の世界": "drama",
  "ブレイキング・バッド": "drama", "半沢直樹": "drama", "アンナチュラル": "drama",
  "梨泰院クラス": "drama", "MIU404": "drama",
  // アニメ
  "Another (小説)": "anime", "ひぐらしのなく頃に": "anime", "ヴァイオレット・エヴァーガーデン": "anime",
  "聲の形": "anime", "あの日見た花の名前を僕達はまだ知らない。": "anime", "STEINS;GATE": "anime",
  "魔法少女まどか☆マギカ": "anime", "進撃の巨人": "anime", "鬼滅の刃": "anime",
  "DEATH NOTE": "anime", "天気の子": "anime", "千と千尋の神隠し": "anime",
  "AKIRA (漫画)": "anime", "ワンパンマン": "anime", "君の名は。": "anime",
};

const THEMES: Theme[] = [
  {
    slug: "ochi-kowai-horror",
    title: "オチが怖いホラー作品",
    description: "ラストでゾッとする、後味の悪さが癖になるホラー。",
    titles: ["セブン", "ミスト (映画)", "シャッター アイランド", "ヘレディタリー/継承", "ミッドサマー (映画)", "来る (映画)", "Another (小説)", "ひぐらしのなく頃に"],
  },
  {
    slug: "ryoko-ikitakunaru",
    title: "見終わった後に旅行に行きたくなる作品",
    description: "風景と空気がよくて、どこかへ出かけたくなる作品。",
    titles: ["かもめ食堂", "LIFE!/ライフ", "食べて、祈って、恋をして", "海街diary", "リトル・ミス・サンシャイン", "イントゥ・ザ・ワイルド", "ヴァイオレット・エヴァーガーデン"],
  },
  {
    slug: "nakeru-eiga",
    title: "涙腺崩壊する作品",
    description: "気づいたら泣いている、感情を持っていかれる名作。",
    titles: ["タイタニック", "グリーンマイル", "フォレスト・ガンプ/一期一会", "おくりびと", "ライフ・イズ・ビューティフル", "聲の形", "あの日見た花の名前を僕達はまだ知らない。", "リメンバー・ミー (2017年の映画)"],
  },
  {
    slug: "fukusen-kami",
    title: "二度見する伏線が神な作品",
    description: "もう一度最初から観たくなる、仕掛けが効いた作品。",
    titles: ["シックス・センス", "ユージュアル・サスペクツ", "メメント (映画)", "インセプション", "プレステージ (映画)", "STEINS;GATE", "魔法少女まどか☆マギカ", "DEATH NOTE"],
  },
  {
    slug: "ikkimi-drama",
    title: "一気見が止まらない神作品",
    description: "続きが気になりすぎて夜更かし確定の沼。",
    titles: ["愛の不時着", "イカゲーム", "ストレンジャー・シングス 未知の世界", "ブレイキング・バッド", "進撃の巨人", "鬼滅の刃", "半沢直樹", "梨泰院クラス"],
  },
  {
    slug: "date-oshare",
    title: "デートで観たいおしゃれな作品",
    description: "ふたりの時間に似合う、空気のいい一本。",
    titles: ["ラ・ラ・ランド", "アメリ", "ノッティングヒルの恋人", "(500)日のサマー", "ローマの休日", "天気の子", "きみに読む物語"],
  },
  {
    slug: "shujinko-saikyo",
    title: "主人公が最強で爽快な作品",
    description: "理屈ぬきでスカッとする、無双系アクション。",
    titles: ["ジョン・ウィック", "マッドマックス 怒りのデス・ロード", "キングスマン", "イコライザー (映画)", "RRR (映画)", "トップガン マーヴェリック", "ワンパンマン"],
  },
  {
    slug: "isshou-meisaku",
    title: "人生で一度は観るべき名作",
    description: "迷ったらこれ。時代を超えて愛される傑作。",
    titles: ["ショーシャンクの空に", "ゴッドファーザー", "バック・トゥ・ザ・フューチャー", "ニュー・シネマ・パラダイス", "七人の侍", "千と千尋の神隠し", "AKIRA (漫画)"],
  },
];

// TMDBの配信プロバイダ名 → サイト内の正規名（ProviderBadgesのキーに合わせる）
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

// TMDBからポスター＋主演＋配信先を取得。キー無しなら全てnull。
async function tmdbInfo(title: string): Promise<{ posterUrl: string | null; cast: string | null; providers: string | null }> {
  if (!TMDB_KEY) return { posterUrl: null, cast: null, providers: null };
  try {
    const r = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=ja-JP&include_adult=false`,
      { headers: { "User-Agent": UA } }
    );
    if (!r.ok) return { posterUrl: null, cast: null, providers: null };
    const j = await r.json();
    const hit = (j.results ?? []).find(
      (x: { poster_path?: string; media_type?: string }) =>
        x.poster_path && (x.media_type === "movie" || x.media_type === "tv")
    ) ?? (j.results ?? [])[0];
    if (!hit) return { posterUrl: null, cast: null, providers: null };
    const posterUrl = hit.poster_path ? `https://image.tmdb.org/t/p/w342${hit.poster_path}` : null;
    const isAV = hit.id && (hit.media_type === "movie" || hit.media_type === "tv");

    let cast: string | null = null;
    let providers: string | null = null;
    if (isAV) {
      try {
        const cr = await fetch(
          `https://api.themoviedb.org/3/${hit.media_type}/${hit.id}/credits?api_key=${TMDB_KEY}&language=ja-JP`,
          { headers: { "User-Agent": UA } }
        );
        if (cr.ok) {
          const cj = await cr.json();
          const names = (cj.cast ?? []).slice(0, 3).map((c: { name?: string }) => c.name).filter(Boolean);
          if (names.length) cast = names.join("・");
        }
      } catch {}
      try {
        const pr = await fetch(
          `https://api.themoviedb.org/3/${hit.media_type}/${hit.id}/watch/providers?api_key=${TMDB_KEY}`,
          { headers: { "User-Agent": UA } }
        );
        if (pr.ok) {
          const pj = await pr.json();
          const flat: { provider_name?: string }[] = pj.results?.JP?.flatrate ?? [];
          const names = [
            ...new Set(flat.map((p) => PROVIDER_MAP[p.provider_name ?? ""]).filter(Boolean)),
          ];
          if (names.length) providers = names.join(",");
        }
      } catch {}
    }
    return { posterUrl, cast, providers };
  } catch {}
  return { posterUrl: null, cast: null, providers: null };
}

async function fetchWork(title: string) {
  let overview: string | null = null;
  let year: number | null = null;
  let canonical = title;
  try {
    const r = await fetch(`https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, { headers: { "User-Agent": UA } });
    if (r.ok) {
      const j = await r.json();
      canonical = j.titles?.canonical ?? title;
      const extract: string = j.extract ?? "";
      if (extract) overview = extract.split("。")[0] + "。";
      const blob = `${j.description ?? ""} ${extract}`;
      const m = blob.match(/(\d{4})年/);
      if (m) year = parseInt(m[1], 10);
    }
  } catch {}

  let popularity = 0;
  try {
    const t = encodeURIComponent(canonical.replace(/ /g, "_"));
    const r = await fetch(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/ja.wikipedia/all-access/all-agents/${t}/monthly/20260301/20260531`, { headers: { "User-Agent": UA } });
    if (r.ok) {
      const j = await r.json();
      const items: { views: number }[] = j.items ?? [];
      if (items.length) popularity = Math.round(items.reduce((s, i) => s + (i.views || 0), 0) / items.length);
    }
  } catch {}

  const { posterUrl, cast, providers } = await tmdbInfo(title);
  return { overview, year, popularity, posterUrl, cast, providers };
}

// 表示用にタイトルを整える（"セブン (映画)" → "セブン" など）
function cleanTitle(t: string): string {
  return t.replace(/\s*\(.*?\)\s*$/, "").replace(/\/.*$/, "").trim();
}

async function main() {
  await prisma.workEntry.deleteMany();
  await prisma.workRanking.deleteMany();
  await prisma.work.deleteMany();

  const allTitles = [...new Set(THEMES.flatMap((t) => t.titles))];
  console.log(`Fetching ${allTitles.length} works (TMDB: ${TMDB_KEY ? "あり" : "なし"})...`);

  const idByTitle = new Map<string, string>();
  let withPoster = 0;
  for (const title of allTitles) {
    const w = await fetchWork(title);
    if (w.posterUrl) withPoster++;
    const work = await prisma.work.create({
      data: {
        title: cleanTitle(title),
        year: w.year,
        kind: KIND[title] ?? "movie",
        posterUrl: w.posterUrl,
        cast: w.cast,
        providers: w.providers,
        overview: w.overview,
        popularity: w.popularity,
      },
    });
    idByTitle.set(title, work.id);
    await new Promise((r) => setTimeout(r, 70));
  }
  console.log(`Works created. ポスターあり: ${withPoster}/${allTitles.length}`);

  let i = 0;
  for (const theme of THEMES) {
    const ranking = await prisma.workRanking.create({
      data: { slug: theme.slug, title: theme.title, description: theme.description },
    });
    let pos = 0;
    for (const title of theme.titles) {
      const workId = idByTitle.get(title);
      if (!workId) continue;
      const work = await prisma.work.findUnique({ where: { id: workId } });
      await prisma.workEntry.create({
        data: {
          rankingId: ranking.id,
          workId,
          score: 100 - pos * 5,
          blurb: work?.overview ?? "話題の作品。",
          likes: seedDummyLikes((work?.popularity ?? 0) * 2),
        },
      });
      pos++;
    }
    const mins = [2, 5, 9, 16, 24, 38, 55, 80][i % 8] + Math.floor(Math.random() * 3);
    await prisma.workRanking.update({ where: { id: ranking.id }, data: { createdAt: new Date(Date.now() - mins * 60000) } });
    i++;
  }
  console.log(`Generated ${THEMES.length} work rankings`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
