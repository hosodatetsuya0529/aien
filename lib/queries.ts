import { prisma } from "./prisma";
import { THEME_POOL, CATEGORIES } from "./generator";

// 表示順 = AIの基礎スコア + 重み×いいね（＝いいねが順位に反映される）
export const LIKE_WEIGHT = 0.5;
export function orderValue(e: { score: number; likes: number }): number {
  return e.score + LIKE_WEIGHT * e.likes;
}

// ホーム：ランキングを“エンゲージ（いいね合計）”で並べ、上位だけ前に出す
export async function getTopRankings() {
  const rankings = await prisma.ranking.findMany({
    where: { status: "published" },
    include: { entries: { include: { talent: true } } },
  });

  return rankings
    .map((r) => {
      const engagement = r.entries.reduce((s, e) => s + e.likes, 0);
      const top = [...r.entries].sort((a, b) => orderValue(b) - orderValue(a)).slice(0, 5);
      return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        description: r.description,
        count: r.entries.length,
        engagement,
        createdAt: r.createdAt,
        top: top.map((e) => ({ id: e.talentId, name: e.talent.name })),
      };
    })
    .sort((a, b) => b.engagement - a.engagement);
}

// ランキング詳細（テーマ別カタログ）
export async function getRanking(slug: string) {
  const ranking = await prisma.ranking.findUnique({
    where: { slug },
    include: { entries: { include: { talent: true } } },
  });
  if (!ranking) return null;

  const entries = [...ranking.entries]
    .sort((a, b) => orderValue(b) - orderValue(a))
    .map((e, i) => ({
      id: e.id,
      position: i + 1,
      likes: e.likes,
      blurb: e.blurb,
      talent: e.talent,
    }));

  return {
    id: ranking.id,
    slug: ranking.slug,
    title: ranking.title,
    description: ranking.description,
    methodNote: ranking.methodNote,
    createdAt: ranking.createdAt,
    entries,
  };
}

// 人物ページ：そのタレントが登場する全ランキング（回遊の核）
export async function getTalent(id: string) {
  const talent = await prisma.talent.findUnique({
    where: { id },
    include: { entries: { include: { ranking: true } } },
  });
  if (!talent) return null;

  // 各ランキング内での順位を算出
  const appearances = [];
  for (const e of talent.entries) {
    if (e.ranking.status !== "published") continue;
    const siblings = await prisma.rankingEntry.findMany({
      where: { rankingId: e.rankingId },
      select: { score: true, likes: true },
    });
    const mine = orderValue(e);
    const position = siblings.filter((s) => orderValue(s) > mine).length + 1;
    appearances.push({
      rankingSlug: e.ranking.slug,
      rankingTitle: e.ranking.title,
      position,
      total: siblings.length,
      blurb: e.blurb,
      likes: e.likes,
    });
  }
  appearances.sort((a, b) => a.position - b.position);

  return { talent, appearances };
}

// ホーム（Netflix風）：カテゴリ別の行。各行に複数のランキングカード（ベスト3の顔）。
export async function getFeedByCategory() {
  const rankings = await prisma.ranking.findMany({
    where: { status: "published" },
    include: { entries: { include: { talent: true } } },
  });

  const catBySlug = new Map(THEME_POOL.map((t) => [t.slug, t.category]));

  const cards = rankings.map((r) => {
    const ordered = [...r.entries].sort((a, b) => orderValue(b) - orderValue(a));
    return {
      slug: r.slug,
      title: r.title,
      count: r.entries.length,
      createdAt: r.createdAt,
      category: catBySlug.get(r.slug) ?? "その他",
      thumbs: ordered.slice(0, 5).map((e) => ({
        talentId: e.talentId,
        name: e.talent.name,
        photoUrl: e.talent.photoUrl,
      })),
    };
  });

  const totalPeople = await prisma.talent.count();

  const groups = CATEGORIES.map((category) => ({
    category,
    rankings: cards
      .filter((c) => c.category === category)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  })).filter((g) => g.rankings.length > 0);

  return { groups, totalRankings: cards.length, totalPeople };
}

// ── 作品（映画・ドラマ）版 ───────────────────────────
// ランキングは「ベスト7」に統一（表示は上位7件）。
const RANKING_SIZE = 7;

// 常に7枠に揃える（ブランディング=ベスト7）。足りない分は「該当作なし」のプレースホルダで埋める。
type DisplayEntry = { entryId: string; workId: string; title: string; posterUrl: string | null; providers: string | null; likes: number; year?: number | null };
function fillToSeven<T extends DisplayEntry>(entries: T[]): T[] {
  const out = [...entries];
  for (let i = out.length; i < RANKING_SIZE; i++) {
    out.push({ entryId: `empty-${i}`, workId: "", title: "", posterUrl: null, providers: null, likes: 0, year: null } as T);
  }
  return out;
}

// サイトに表示する「現在のランキング総数」＝実数（自動削除で300〜350に保たれる）。
export async function getRankingTotal(): Promise<number> {
  return prisma.workRanking.count({ where: { status: "published" } });
}

export async function getWorkFeed() {
  // 全件取得せず、ランダムに40件だけ取得（1000件規模でも軽快）。開くたびに違う顔ぶれ。
  const ids = (await prisma.workRanking.findMany({ where: { status: "published" }, select: { id: true } })).map((r) => r.id);
  const sample = ids.map((id) => ({ id, k: Math.random() })).sort((a, b) => a.k - b.k).slice(0, 40).map((x) => x.id);
  const rankings = await prisma.workRanking.findMany({
    where: { id: { in: sample } },
    include: { entries: { include: { work: true } } },
  });
  return rankings
    .map((r) => {
      const ordered = [...r.entries].sort((a, b) => orderValue(b) - orderValue(a)).slice(0, RANKING_SIZE);
      return {
        slug: r.slug,
        title: r.title,
        description: r.description,
        count: RANKING_SIZE,
        good: r.good,
        bad: r.bad,
        createdAt: r.createdAt,
        entries: fillToSeven(ordered.map((e) => ({
          entryId: e.id,
          workId: e.workId,
          title: e.work.title,
          year: e.work.year,
          posterUrl: e.work.posterUrl,
          providers: e.work.providers,
          likes: e.likes,
        }))),
      };
    })
    // スマホ版のみ：開くたびに違うランキングが先頭に来るようランダムに並べ替え（毎回新しい体験）
    .map((x) => ({ x, k: Math.random() }))
    .sort((a, b) => a.k - b.k)
    .map((p) => p.x);
}

// PC版ホーム：ランキング自体を“人気順”に並べる（AIの基礎＋いいね＋グッドを加味）。
export async function getWorkRankingsRanked() {
  // 全件ではなく最新100件だけを人気順に（1000件規模でも軽快）。
  const rankings = await prisma.workRanking.findMany({
    where: { status: "published" },
    include: { entries: { include: { work: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return rankings
    .map((r) => {
      const ordered = [...r.entries].sort((a, b) => orderValue(b) - orderValue(a)).slice(0, RANKING_SIZE);
      return {
        slug: r.slug,
        title: r.title,
        count: RANKING_SIZE,
        good: r.good,
        bad: r.bad,
        createdAt: r.createdAt,
        entries: fillToSeven(ordered.map((e) => ({
          entryId: e.id,
          workId: e.workId,
          title: e.work.title,
          posterUrl: e.work.posterUrl,
          providers: e.work.providers,
          likes: e.likes,
        }))),
      };
    })
    .sort((a, b) => rankScore(b) - rankScore(a));
}
// 人気スコア＝エンゲージ(グッド×2＋いいね合計−バッド)に20分ごとに変わる揺らぎを加算。
// グッド/バッドを反映しつつ20分おきに順位が入れ替わる（“AIが再評価”の演出）。Claude不要＝無料。
const RANK_BUCKET_MS = 20 * 60 * 1000;
const RANK_SWING = 100;
function seeded(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}
function rankScore(r: { slug: string; good: number; bad: number; entries: { likes: number }[] }): number {
  const engagement = r.good * 2 + r.entries.reduce((s, e) => s + e.likes, 0) - r.bad;
  const bucket = Math.floor(Date.now() / RANK_BUCKET_MS);
  return engagement + seeded(r.slug + ":" + bucket) * RANK_SWING;
}

// 作品ランキング詳細ページ：全順位をフィードと同じ行データ形で返す。
export async function getWorkRanking(slug: string) {
  const ranking = await prisma.workRanking.findUnique({
    where: { slug },
    include: { entries: { include: { work: true } } },
  });
  if (!ranking) return null;
  const ordered = [...ranking.entries].sort((a, b) => orderValue(b) - orderValue(a)).slice(0, RANKING_SIZE);
  return {
    slug: ranking.slug,
    title: ranking.title,
    count: RANKING_SIZE,
    good: ranking.good,
    bad: ranking.bad,
    createdAt: ranking.createdAt,
    entries: fillToSeven(ordered.map((e) => ({
      entryId: e.id,
      workId: e.workId,
      title: e.work.title,
      posterUrl: e.work.posterUrl,
      providers: e.work.providers,
      likes: e.likes,
    }))),
  };
}

// 作品ページ：1作品の情報＋「この作品が入っているランキング」（順位付き、回遊用）
export async function getWork(id: string) {
  const work = await prisma.work.findUnique({
    where: { id },
    include: { entries: { include: { ranking: true } } },
  });
  if (!work) return null;

  const appearances = [];
  for (const e of work.entries) {
    if (e.ranking.status !== "published") continue;
    const siblings = await prisma.workEntry.findMany({
      where: { rankingId: e.rankingId },
      select: { score: true, likes: true },
    });
    const mine = orderValue(e);
    const position = siblings.filter((s) => orderValue(s) > mine).length + 1;
    if (position <= RANKING_SIZE) {
      appearances.push({
        rankingSlug: e.ranking.slug,
        rankingTitle: e.ranking.title,
        count: Math.min(siblings.length, RANKING_SIZE),
        position,
      });
    }
  }
  appearances.sort((a, b) => a.position - b.position);

  return { work, appearances };
}

// TikTok風：ランキングをフラットに（1画面1ランキング）。各ランキングの上位6人＋総数。
export async function getRankingsFlat() {
  const rankings = await prisma.ranking.findMany({
    where: { status: "published" },
    include: { entries: { include: { talent: true } } },
  });
  const catBySlug = new Map(THEME_POOL.map((t) => [t.slug, t.category]));

  return rankings
    .map((r) => {
      const ordered = [...r.entries].sort((a, b) => orderValue(b) - orderValue(a));
      return {
        slug: r.slug,
        title: r.title,
        count: r.entries.length,
        createdAt: r.createdAt,
        category: catBySlug.get(r.slug) ?? "その他",
        entries: ordered.slice(0, 6).map((e) => ({
          entryId: e.id,
          talentId: e.talentId,
          name: e.talent.name,
          photoUrl: e.talent.photoUrl,
          profile: e.talent.profile,
          likes: e.likes,
        })),
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ホーム（フィード）：新着順のランキングカード。各カードは顔サムネを数枚＋総数。
export async function getFeed() {
  const rankings = await prisma.ranking.findMany({
    where: { status: "published" },
    include: { entries: { include: { talent: true } } },
  });

  return rankings
    .map((r) => {
      const ordered = [...r.entries].sort((a, b) => orderValue(b) - orderValue(a));
      return {
        slug: r.slug,
        title: r.title,
        count: r.entries.length,
        createdAt: r.createdAt,
        thumbs: ordered.slice(0, 6).map((e) => ({
          talentId: e.talentId,
          name: e.talent.name,
          photoUrl: e.talent.photoUrl,
        })),
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ホーム：テーマ別の“横スクロール行”を縦に積む用。各行は順位順のエントリーを持つ。
export async function getHomeRows() {
  const rankings = await prisma.ranking.findMany({
    where: { status: "published" },
    include: { entries: { include: { talent: true } } },
  });

  return rankings
    .map((r) => {
      const engagement = r.entries.reduce((s, e) => s + e.likes, 0);
      const entries = [...r.entries]
        .sort((a, b) => orderValue(b) - orderValue(a))
        .slice(0, 20)
        .map((e, i) => ({
          entryId: e.id,
          position: i + 1,
          talentId: e.talentId,
          name: e.talent.name,
          photoUrl: e.talent.photoUrl,
          likes: e.likes,
        }));
      return { slug: r.slug, title: r.title, count: r.entries.length, engagement, entries };
    })
    .sort((a, b) => b.engagement - a.engagement);
}
