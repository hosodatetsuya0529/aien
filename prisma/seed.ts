import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── テーマ別ランキング（選定・順位は「AI=私の判断」） ──────────────
// ※ ここが検証対象：実在タレントをAIがどう選び・並べるかが世間感覚と合うか。
// 写真・プロフィール・話題度は実データ(TMDB / Wikipedia)で裏打ちする。
type ThemeDef = { slug: string; title: string; description: string; names: string[] };

const THEMES: ThemeDef[] = [
  {
    slug: "engi-jouzu-joyu",
    title: "芝居が上手いと評判の女優",
    description: "演技力に定評がある女優を、AIが選定・順位付けしたカタログ。",
    names: ["安藤サクラ", "宮沢りえ", "満島ひかり", "松たか子", "蒼井優", "尾野真千子", "杉咲花", "長澤まさみ", "黒木華", "田中裕子", "永作博美", "吉田羊"],
  },
  {
    slug: "engi-jouzu-haiyu",
    title: "芝居が上手いと評判の俳優",
    description: "演技力で高く評価される俳優を、AIが選定・順位付け。",
    names: ["役所広司", "西島秀俊", "阿部寛", "堺雅人", "菅田将暉", "松山ケンイチ", "柄本佑", "池松壮亮", "藤原竜也", "妻夫木聡", "大泉洋", "リリー・フランキー"],
  },
  {
    slug: "cm-yoku-miru-joyu",
    title: "CMでよく見る女優",
    description: "広告で見かける機会が多い女優を、AIが選定。",
    names: ["新垣結衣", "綾瀬はるか", "広瀬すず", "石原さとみ", "有村架純", "浜辺美波", "今田美桜", "川口春奈", "長澤まさみ", "上戸彩", "深田恭子", "永野芽郁"],
  },
  {
    slug: "okaasan-yaku",
    title: "国民的お母さん役が似合う女優",
    description: "ドラマで“お母さん”を演じると沁みる女優を、AIが選定。",
    names: ["松嶋菜々子", "石田ゆり子", "天海祐希", "木村佳乃", "真矢ミキ", "仲間由紀恵", "鈴木保奈美", "田中美佐子", "財前直見"],
  },
  {
    slug: "variety-hikaru",
    title: "バラエティでも光る俳優",
    description: "ドラマだけでなくバラエティでも輝く俳優を、AIが選定。",
    names: ["大泉洋", "ムロツヨシ", "佐藤二朗", "賀来賢人", "山田孝之", "古田新太", "神木隆之介", "高橋一生"],
  },
  {
    slug: "koe-narration",
    title: "声・ナレーションが魅力的な俳優",
    description: "声に説得力・色気があると評判の俳優を、AIが選定。",
    names: ["中井貴一", "西島秀俊", "内野聖陽", "津田健次郎", "堤真一", "阿部寛", "役所広司"],
  },
];

const UA = "TalentRankMVP/0.1 (prototype evaluation)";
const TMDB_KEY = process.env.TMDB_API_KEY; // 無料キーを .env に入れると写真が一気に埋まる

// 写真ソース①：TMDB（映画・ドラマDB。日本の俳優も顔写真が充実）
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

// 写真ソース②：Wikidata P18（ja Wikipedia本文に画像が無くても拾えることがある）
async function wikidataPhoto(qid: string | null): Promise<string | null> {
  if (!qid) return null;
  try {
    const r = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`, {
      headers: { "User-Agent": UA },
    });
    if (r.ok) {
      const j = await r.json();
      const fn = j.entities?.[qid]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      if (fn) return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fn)}?width=400`;
    }
  } catch {}
  return null;
}

async function fetchWiki(name: string) {
  let photoUrl: string | null = null;
  let profile: string | null = null;
  let blurb: string | null = null;
  let canonical = name;
  let qid: string | null = null;
  try {
    const r = await fetch(
      `https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
      { headers: { "User-Agent": UA } }
    );
    if (r.ok) {
      const j = await r.json();
      photoUrl = j.thumbnail?.source ?? j.originalimage?.source ?? null;
      profile = j.description ?? null;
      canonical = j.titles?.canonical ?? name;
      qid = j.wikibase_item ?? null;
      const extract: string = j.extract ?? "";
      if (extract) blurb = extract.split("。")[0] + "。";
    }
  } catch {}

  let popularity = 0;
  try {
    const t = encodeURIComponent(canonical.replace(/ /g, "_"));
    const r = await fetch(
      `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/ja.wikipedia/all-access/all-agents/${t}/monthly/20260301/20260531`,
      { headers: { "User-Agent": UA } }
    );
    if (r.ok) {
      const j = await r.json();
      const items: { views: number }[] = j.items ?? [];
      if (items.length) {
        popularity = Math.round(items.reduce((s, i) => s + (i.views || 0), 0) / items.length);
      }
    }
  } catch {}

  return { photoUrl, profile, blurb, popularity, qid };
}

async function main() {
  await prisma.like.deleteMany();
  await prisma.rankingEntry.deleteMany();
  await prisma.ranking.deleteMany();
  await prisma.talent.deleteMany();

  const names = [...new Set(THEMES.flatMap((t) => t.names))];
  console.log(`Fetching ${names.length} talents (TMDB key: ${TMDB_KEY ? "あり" : "なし"})...`);

  const idByName = new Map<string, string>();
  let withPhoto = 0;
  for (const name of names) {
    const w = await fetchWiki(name);
    // 写真は TMDB → ja Wikipedia → Wikidata の順で解決
    let photo = await tmdbPhoto(name);
    if (!photo) photo = w.photoUrl;
    if (!photo) photo = await wikidataPhoto(w.qid);
    if (photo) withPhoto++;

    const talent = await prisma.talent.create({
      data: {
        name,
        profile: w.profile ?? "実力派として知られる存在",
        photoUrl: photo,
        popularity: w.popularity,
        tags: "",
      },
    });
    idByName.set(name, talent.id);
    await new Promise((r) => setTimeout(r, 80));
  }
  console.log(`Talents created. 写真あり: ${withPhoto}/${names.length}`);

  for (const theme of THEMES) {
    const ranking = await prisma.ranking.create({
      data: { slug: theme.slug, title: theme.title, description: theme.description, methodNote: "AIが選定・順位付け／写真・話題度はTMDB・Wikipediaより取得。読者の「いいね」で順位に反映。" },
    });
    let i = 0;
    for (const name of theme.names) {
      const talentId = idByName.get(name);
      if (!talentId) continue;
      const t = await prisma.talent.findUnique({ where: { id: talentId } });
      await prisma.rankingEntry.create({
        data: {
          rankingId: ranking.id,
          talentId,
          score: 100 - i * 3,
          blurb: t?.profile ?? "実力派として知られる存在",
          likes: 0,
        },
      });
      i++;
    }
  }
  console.log(`Generated ${THEMES.length} rankings.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
