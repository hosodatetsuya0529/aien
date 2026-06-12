import type { PrismaClient, Talent } from "@prisma/client";

// ── AI生成レイヤー（MVP版） ─────────────────────────────
// 実運用ではここを LLM(Claude) に差し替え、テーマ・選定・ほめ文を無限生成する。
// MVPは「タレントのタグ＋話題度スコア」で決定論的に生成。

export type Theme = {
  slug: string;
  title: string;
  description: string;
  requires: string[]; // タレントのtagsに全て含まれる必要
  category: string;
  limit?: number;
};

// 表示するカテゴリの並び（Netflix風の“行”の順番）
export const CATEGORIES = [
  "話題・ジャンル横断",
  "演技で評判",
  "いま話題",
  "お笑い",
  "スポーツ",
  "アイドル・歌手",
  "ジャンルで探す",
  "定番・国民的",
  "印象で探す",
];

// AIが生成するテーマ群（実運用ではLLMが無限に量産する部分）
export const THEME_POOL: Theme[] = [
  // 演技で評判
  { slug: "engi-joyu", title: "芝居が上手いと評判の女優", description: "演技力に定評がある女優。", requires: ["女優", "演技派"], category: "演技で評判" },
  { slug: "engi-haiyu", title: "芝居が上手いと評判の俳優", description: "演技力で高く評価される俳優。", requires: ["俳優", "演技派"], category: "演技で評判" },
  { slug: "butai", title: "舞台で鍛えた実力派", description: "舞台出身・舞台で評価される実力派。", requires: ["舞台"], category: "演技で評判" },
  { slug: "eiga-haiyu", title: "映画で観たい俳優", description: "映画で存在感を放つ俳優。", requires: ["俳優", "映画"], category: "演技で評判" },
  { slug: "kosei-haiyu", title: "個性派として光る俳優", description: "唯一無二の個性で魅せる俳優。", requires: ["俳優", "個性派"], category: "演技で評判" },

  // いま話題
  { slug: "wadai-joyu", title: "いま話題の女優", description: "いま注目を集めている女優。", requires: ["女優", "話題"], category: "いま話題" },
  { slug: "wadai-haiyu", title: "いま話題の俳優", description: "いま注目を集めている俳優。", requires: ["俳優", "話題"], category: "いま話題" },
  { slug: "wakate-joyu", title: "注目の若手女優", description: "これからの活躍が期待される若手女優。", requires: ["女優", "若手"], category: "いま話題" },
  { slug: "wakate-haiyu", title: "ブレイク中の若手俳優", description: "勢いのある若手俳優。", requires: ["俳優", "若手"], category: "いま話題" },

  // ジャンルで探す
  { slug: "cm-joyu", title: "CMでよく見る女優", description: "広告で見かける機会が多い女優。", requires: ["女優", "CM"], category: "ジャンルで探す" },
  { slug: "variety", title: "バラエティでも光る俳優", description: "バラエティでも輝く俳優。", requires: ["俳優", "バラエティ"], category: "ジャンルで探す" },
  { slug: "comedy", title: "コメディがうまいと評判", description: "笑いの間が絶妙な実力派。", requires: ["コメディ"], category: "ジャンルで探す" },
  { slug: "koe", title: "声・ナレーションが魅力的", description: "声に説得力・色気がある。", requires: ["声"], category: "ジャンルで探す" },
  { slug: "shibui", title: "渋くてかっこいい大人の俳優", description: "大人の色気と渋みのある俳優。", requires: ["俳優", "渋い"], category: "ジャンルで探す" },

  // 定番・国民的
  { slug: "okaasan", title: "国民的お母さん役が似合う女優", description: "“お母さん”を演じると沁みる女優。", requires: ["女優", "お母さん役"], category: "定番・国民的" },
  { slug: "veteran-haiyu", title: "ベテランの貫禄がある俳優", description: "長年第一線の貫禄ある俳優。", requires: ["俳優", "ベテラン"], category: "定番・国民的" },
  { slug: "veteran-joyu", title: "ベテランの存在感がある女優", description: "存在感のあるベテラン女優。", requires: ["女優", "ベテラン"], category: "定番・国民的" },
  { slug: "shuen-joyu", title: "ドラマ主演級の女優", description: "主演を張れる華のある女優。", requires: ["女優", "ドラマ主演"], category: "定番・国民的" },
  { slug: "kokumin-haiyu", title: "国民的俳優", description: "世代を超えて愛される国民的俳優。", requires: ["俳優", "国民的"], category: "定番・国民的" },

  // 印象で探す
  { slug: "toumeikan", title: "透明感があると評判の女優", description: "清潔感・透明感のある女優。", requires: ["女優", "透明感"], category: "印象で探す" },
  { slug: "chisei", title: "知性を感じる俳優・女優", description: "知的な佇まいが魅力。", requires: ["知性派"], category: "印象で探す" },
  { slug: "kosei-joyu", title: "個性派として愛される女優", description: "個性で記憶に残る女優。", requires: ["女優", "個性派"], category: "印象で探す" },

  // 話題・ジャンル横断（俳優・芸人・スポーツ・歌手がごちゃ混ぜに並ぶ）
  { slug: "mix-wadai", title: "いま日本で話題の人物", description: "ジャンルを超えて、いま最も注目される人物。", requires: ["話題"], category: "話題・ジャンル横断", limit: 20 },
  { slug: "mix-kokumin", title: "世代を超えて愛される国民的スター", description: "ジャンル横断の国民的スター。", requires: ["国民的"], category: "話題・ジャンル横断", limit: 20 },

  // お笑い
  { slug: "geinin-mc", title: "司会・MCが上手いと評判の芸人", description: "番組を回す力に定評のある芸人。", requires: ["芸人", "MC"], category: "お笑い" },
  { slug: "geinin-wadai", title: "いま面白いと評判の芸人", description: "勢いのある、いま話題の芸人。", requires: ["芸人", "話題"], category: "お笑い" },
  { slug: "geinin-chisei", title: "知性派と言われる芸人", description: "頭の回転・教養で魅せる芸人。", requires: ["芸人", "知性派"], category: "お笑い" },

  // スポーツ
  { slug: "sports-sekai", title: "世界で活躍する日本人アスリート", description: "世界の舞台で結果を出すアスリート。", requires: ["スポーツ", "話題"], category: "スポーツ" },
  { slug: "sports-kokumin", title: "国民的アスリート", description: "国民に愛されるアスリート。", requires: ["スポーツ", "国民的"], category: "スポーツ" },
  { slug: "sports-all", title: "いま注目のアスリート", description: "話題を集めるアスリート。", requires: ["スポーツ"], category: "スポーツ" },

  // アイドル・歌手
  { slug: "kasho", title: "歌唱力がすごいと評判のアーティスト", description: "歌のうまさに定評があるアーティスト。", requires: ["歌手", "歌唱力"], category: "アイドル・歌手" },
  { slug: "artist-wadai", title: "人気上昇中のアーティスト", description: "いま勢いのあるアーティスト。", requires: ["歌手", "話題"], category: "アイドル・歌手" },
  { slug: "artist-kokumin", title: "国民的アーティスト", description: "世代を超えて聴かれるアーティスト。", requires: ["歌手", "国民的"], category: "アイドル・歌手" },
];

// ほめ文（テーマ名は見出しに出るので、ここでは自然な一文）
const BLURB_TEMPLATES = [
  (t: Talent) => `${t.profile ?? "実力派"}として知られる存在。`,
  (t: Talent) => `安定した評価を集め、いま注目を集めている。`,
  (t: Talent) => `近年さらに評価を高めている。`,
  (t: Talent) => `${t.profile ?? "実力派"}。一目置かれる存在。`,
];

function makeBlurb(t: Talent, _theme: Theme, i: number): string {
  return BLURB_TEMPLATES[i % BLURB_TEMPLATES.length](t);
}

// 賑わって見せるためのダミーいいね。リアリティ重視で最大50まで（話題度が高い人ほど多め）。
export function seedDummyLikes(popularity: number): number {
  const frac = Math.min(Math.max(popularity, 0), 200000) / 200000; // 0..1
  return Math.max(3, Math.min(50, Math.round(frac * 32 + Math.random() * 22)));
}

export async function generateRankingFromTheme(prisma: PrismaClient, theme: Theme) {
  const all = await prisma.talent.findMany();
  const matched = all.filter((t) => {
    const tags = t.tags.split(",").map((s) => s.trim());
    return theme.requires.every((r) => tags.includes(r));
  });
  if (matched.length < 3) return null;

  const ranked = matched
    .map((t) => ({ t, score: t.popularity + Math.random() * 5 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, theme.limit ?? 50);

  const ranking = await prisma.ranking.create({
    data: { slug: theme.slug, title: theme.title, description: theme.description },
  });

  let i = 0;
  for (const { t, score } of ranked) {
    await prisma.rankingEntry.create({
      data: { rankingId: ranking.id, talentId: t.id, score: Math.round(score * 10) / 10, blurb: makeBlurb(t, theme, i), likes: seedDummyLikes(t.popularity) },
    });
    i++;
  }
  return ranking;
}

export async function generateNextRanking(prisma: PrismaClient) {
  const existing = await prisma.ranking.findMany({ select: { slug: true } });
  const used = new Set(existing.map((r) => r.slug));
  const next = THEME_POOL.find((t) => !used.has(t.slug));
  if (!next) return null;
  return generateRankingFromTheme(prisma, next);
}
