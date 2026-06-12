import { PrismaClient } from "@prisma/client";
import { THEME_POOL, generateRankingFromTheme } from "../lib/generator";

const prisma = new PrismaClient();
const UA = "TalentRankMVP/0.1 (prototype evaluation)";

// 追加ロスター（俳優以外）。タグは「AI=私の知識」による。写真はWikipediaの無料ぶんのみ。
const NEW: { name: string; tags: string }[] = [
  // お笑い芸人
  { name: "明石家さんま", tags: "芸人,MC,話題,国民的,ベテラン" },
  { name: "浜田雅功", tags: "芸人,MC,国民的,ベテラン" },
  { name: "有吉弘行", tags: "芸人,MC,話題,知性派" },
  { name: "設楽統", tags: "芸人,MC,話題,知性派" },
  { name: "バカリズム", tags: "芸人,知性派,話題,MC" },
  { name: "川島明", tags: "芸人,MC,話題,知性派" },
  { name: "若林正恭", tags: "芸人,話題,知性派" },
  { name: "山里亮太", tags: "芸人,話題,MC,知性派" },
  { name: "千原ジュニア", tags: "芸人,MC,知性派,ベテラン" },
  { name: "田村淳", tags: "芸人,MC,知性派" },
  { name: "宮川大輔", tags: "芸人,話題" },
  { name: "山内健司", tags: "芸人,話題,知性派" },
  // スポーツ選手
  { name: "大谷翔平", tags: "スポーツ,話題,国民的" },
  { name: "八村塁", tags: "スポーツ,話題" },
  { name: "羽生結弦", tags: "スポーツ,話題,国民的" },
  { name: "大坂なおみ", tags: "スポーツ,話題,国民的" },
  { name: "久保建英", tags: "スポーツ,話題" },
  { name: "三笘薫", tags: "スポーツ,話題" },
  { name: "ダルビッシュ有", tags: "スポーツ,話題" },
  { name: "錦織圭", tags: "スポーツ,国民的" },
  { name: "井上尚弥", tags: "スポーツ,話題,国民的" },
  { name: "村上宗隆", tags: "スポーツ,話題" },
  // アイドル・歌手
  { name: "米津玄師", tags: "歌手,話題,国民的,歌唱力" },
  { name: "あいみょん", tags: "歌手,話題,歌唱力" },
  { name: "宇多田ヒカル", tags: "歌手,国民的,歌唱力,ベテラン" },
  { name: "星野源", tags: "歌手,話題,国民的" },
  { name: "藤井風", tags: "歌手,話題,歌唱力" },
  { name: "MISIA", tags: "歌手,歌唱力,国民的,ベテラン" },
  { name: "福山雅治", tags: "歌手,国民的,ベテラン" },
  { name: "aiko", tags: "歌手,歌唱力,ベテラン" },
  { name: "玉置浩二", tags: "歌手,歌唱力,国民的,ベテラン" },
  { name: "中島みゆき", tags: "歌手,歌唱力,国民的,ベテラン" },
];

async function fetchWiki(name: string) {
  let photoUrl: string | null = null;
  let profile: string | null = null;
  let canonical = name;
  let qid: string | null = null;
  try {
    const r = await fetch(`https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`, { headers: { "User-Agent": UA } });
    if (r.ok) {
      const j = await r.json();
      photoUrl = j.thumbnail?.source ?? j.originalimage?.source ?? null;
      profile = j.description ?? null;
      canonical = j.titles?.canonical ?? name;
      qid = j.wikibase_item ?? null;
    }
  } catch {}
  if (!photoUrl && qid) {
    try {
      const r = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`, { headers: { "User-Agent": UA } });
      if (r.ok) {
        const j = await r.json();
        const fn = j.entities?.[qid]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
        if (fn) photoUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fn)}?width=400`;
      }
    } catch {}
  }
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
  return { photoUrl, profile, popularity };
}

async function main() {
  let added = 0;
  let withPhoto = 0;
  for (const p of NEW) {
    const exists = await prisma.talent.findFirst({ where: { name: p.name } });
    if (exists) {
      await prisma.talent.update({ where: { id: exists.id }, data: { tags: p.tags } });
      continue;
    }
    const w = await fetchWiki(p.name);
    if (w.photoUrl) withPhoto++;
    await prisma.talent.create({
      data: { name: p.name, profile: w.profile ?? "話題の人物", photoUrl: w.photoUrl, popularity: w.popularity, tags: p.tags },
    });
    added++;
    await new Promise((r) => setTimeout(r, 80));
  }
  console.log(`追加 ${added}人（写真あり ${withPhoto}）`);

  // 全ランキングを作り直し（既存タレントのタグはそのまま使う）
  await prisma.like.deleteMany();
  await prisma.rankingEntry.deleteMany();
  await prisma.ranking.deleteMany();
  let made = 0;
  for (const theme of THEME_POOL) {
    const r = await generateRankingFromTheme(prisma, theme);
    if (r) made++;
  }
  console.log(`ランキング生成 ${made}/${THEME_POOL.length}`);

  const rs = await prisma.ranking.findMany();
  let i = 0;
  for (const r of rs) {
    const mins = [1, 3, 5, 8, 12, 17, 23, 31, 42, 56, 73, 95, 120, 150][i % 14] + Math.floor(Math.random() * 3);
    await prisma.ranking.update({ where: { id: r.id }, data: { createdAt: new Date(Date.now() - mins * 60000) } });
    i++;
  }
  console.log("createdAt をばらしました");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
