// 追加パターンのテーマ（既存作品を使い回し、再フェッチ無し）。
// ①ジャンル/形式を絞る（アニメ作品）②配信媒体で絞る（Netflix作品）。
// ※seed-worksを再実行すると消えるので、その後にこれを流す運用。
import { PrismaClient } from "@prisma/client";
import { seedDummyLikes } from "../lib/generator";

const prisma = new PrismaClient();

type NewTheme = { slug: string; title: string; description: string; works: string[]; forceProvider?: string };

const NEW: NewTheme[] = [
  {
    slug: "otona-anime",
    title: "大人こそ刺さるアニメ作品",
    description: "子ども向けと侮るな。大人の心を抉るアニメ。",
    works: ["進撃の巨人", "鬼滅の刃", "STEINS;GATE", "魔法少女まどか☆マギカ", "聲の形", "千と千尋の神隠し", "ヴァイオレット・エヴァーガーデン", "DEATH NOTE"],
  },
  {
    slug: "netflix-asamade",
    title: "気づけば朝になってるNetflix作品",
    description: "続きを観る指が止まらない、Netflixの沼。",
    works: ["イカゲーム", "ストレンジャー・シングス 未知の世界", "ブレイキング・バッド", "愛の不時着", "梨泰院クラス", "進撃の巨人", "DEATH NOTE"],
    forceProvider: "Netflix",
  },
  {
    slug: "tonari-hanasu",
    title: "観たら誰かに話したくなる衝撃作品",
    description: "黙ってられない、語りたくなる仕掛けの作品。",
    works: ["インセプション", "ユージュアル・サスペクツ", "シックス・センス", "プレステージ", "メメント", "セブン", "シャッター アイランド"],
  },
  {
    slug: "hitori-yoru",
    title: "ひとりの夜にしみる作品",
    description: "静かな夜にそっと寄り添ってくれる一本。",
    works: ["かもめ食堂", "海街diary", "おくりびと", "LIFE!", "ニュー・シネマ・パラダイス", "リトル・ミス・サンシャイン", "ローマの休日"],
  },
  {
    slug: "unext-kakure",
    title: "U-NEXTで観れる隠れた名作",
    description: "知る人ぞ知る、U-NEXTの底力。",
    works: ["ニュー・シネマ・パラダイス", "七人の侍", "おくりびと", "ショーシャンクの空に", "ゴッドファーザー", "グリーンマイル", "メメント"],
    forceProvider: "U-NEXT",
  },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

async function main() {
  for (const t of NEW) {
    await prisma.workRanking.deleteMany({ where: { slug: t.slug } }); // 再実行可
    const h = hash(t.slug);
    const ranking = await prisma.workRanking.create({
      data: {
        slug: t.slug,
        title: t.title,
        description: t.description,
        good: 20 + (h % 70),
        bad: 2 + ((h >>> 5) % 14),
        createdAt: new Date(Date.now() - (5 + (h % 90)) * 60000),
      },
    });

    let added = 0;
    for (const title of t.works) {
      const w = await prisma.work.findFirst({ where: { title } });
      if (!w) {
        console.warn("作品なし:", title);
        continue;
      }
      if (t.forceProvider) {
        const provs = (w.providers ?? "").split(",").map((s) => s.trim()).filter(Boolean);
        if (!provs.includes(t.forceProvider)) {
          provs.unshift(t.forceProvider);
          await prisma.work.update({ where: { id: w.id }, data: { providers: provs.join(",") } });
        }
      }
      await prisma.workEntry.create({
        data: { rankingId: ranking.id, workId: w.id, score: w.popularity || 50, likes: seedDummyLikes(w.popularity || 50), blurb: "" },
      });
      added++;
    }
    console.log(`追加: ${t.slug}（${added}作品）`);
  }
}

main().finally(() => prisma.$disconnect());
