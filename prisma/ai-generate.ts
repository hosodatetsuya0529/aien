// AIEN ランキング自動生成パイプライン（Claude＋TMDB）。
// 使い方:
//   ANTHROPIC_API_KEY を .env に設定（GEN_MODEL / GEN_COUNT は任意）
//   npx tsx prisma/ai-generate.ts
// 流れ: Claudeがテーマ＋作品＋辛口コメントを生成 → TMDBで実在/配信/ポスター照合 → DBへ公開。
import { PrismaClient } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "node:fs";
import { seedDummyLikes } from "../lib/generator";

try { process.loadEnvFile(); } catch {} // ローカルは.env、CI(GitHub Actions)は環境変数から
const prisma = new PrismaClient();
const TMDB_KEY = process.env.TMDB_API_KEY;
const MODEL = process.env.GEN_MODEL || "claude-opus-4-8";
const COUNT = parseInt(process.env.GEN_COUNT || "8", 10);
const PRUNE_KEEP = process.env.GEN_PRUNE_KEEP ? parseInt(process.env.GEN_PRUNE_KEEP, 10) : 0;

// ── 月予算ガード（自主上限）。今月の生成コストが上限に達したら生成しない ──
const MONTHLY_BUDGET = parseFloat(process.env.GEN_MONTHLY_BUDGET || "4.5"); // USD
const PRICES: Record<string, { in: number; out: number }> = {
  "claude-haiku-4-5": { in: 1, out: 5 },
  "claude-opus-4-8": { in: 5, out: 25 },
  "claude-sonnet-4-6": { in: 3, out: 15 },
};
const USAGE_FILE = new URL("./.gen-usage.json", import.meta.url);
const monthKey = () => new Date().toISOString().slice(0, 7); // "2026-06"
function loadUsage(): Record<string, number> {
  try { return JSON.parse(readFileSync(USAGE_FILE, "utf8")); } catch { return {}; }
}
function addUsage(costUSD: number): number {
  const u = loadUsage();
  u[monthKey()] = (u[monthKey()] || 0) + costUSD;
  writeFileSync(USAGE_FILE, JSON.stringify(u, null, 2));
  return u[monthKey()];
}

const PROVIDERS = ["Netflix", "U-NEXT", "Disney+", "Prime Video", "Hulu", "ABEMA", "Lemino", "DMM TV"];
const PROVIDER_MAP: Record<string, string> = {
  "U-NEXT": "U-NEXT", Netflix: "Netflix", "Disney Plus": "Disney+",
  "Amazon Prime Video": "Prime Video", "Amazon Video": "Prime Video", Hulu: "Hulu",
  "DMM TV": "DMM TV", Lemino: "Lemino", "Lemino Premium": "Lemino",
  AbemaTV: "ABEMA", ABEMA: "ABEMA",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── TMDB照合：作品名 → 実データ（無ければnull） ──
type TmdbInfo = { title: string; year: number | null; overview: string | null; posterUrl: string; providers: string | null; kind: "movie" | "drama" };
async function tmdbLookup(query: string): Promise<TmdbInfo | null> {
  if (!TMDB_KEY) return null;
  try {
    const r = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&language=ja-JP&include_adult=false`
    );
    if (!r.ok) return null;
    const j = await r.json();
    // ポスターのある映画/TVの中から「人気順」で選ぶ（同名の地味な作品への誤マッチを防ぐ）
    const cands = (j.results ?? []).filter(
      (x: { poster_path?: string; media_type?: string }) =>
        x.poster_path && (x.media_type === "movie" || x.media_type === "tv")
    );
    if (!cands.length) return null;
    cands.sort((a: { popularity?: number }, b: { popularity?: number }) => (b.popularity ?? 0) - (a.popularity ?? 0));
    const hit = cands[0];
    const title: string = hit.title || hit.name || query;
    const date: string = hit.release_date || hit.first_air_date || "";
    const year = date ? parseInt(date.slice(0, 4), 10) || null : null;
    const overview: string | null = hit.overview && hit.overview.trim() ? hit.overview.trim() : null;
    const posterUrl = `https://image.tmdb.org/t/p/w342${hit.poster_path}`;
    const kind: "movie" | "drama" = hit.media_type === "tv" ? "drama" : "movie";

    let providers: string | null = null;
    try {
      const pr = await fetch(`https://api.themoviedb.org/3/${hit.media_type}/${hit.id}/watch/providers?api_key=${TMDB_KEY}`);
      if (pr.ok) {
        const pj = await pr.json();
        const flat: { provider_name?: string }[] = pj.results?.JP?.flatrate ?? [];
        const names = [...new Set(flat.map((p) => PROVIDER_MAP[p.provider_name ?? ""]).filter(Boolean))];
        if (names.length) providers = names.join(",");
      }
    } catch {}
    return { title, year, overview, posterUrl, providers, kind };
  } catch {
    return null;
  }
}

// ── Claude：テーマ＋作品＋辛口コメントを生成 ──
const SYSTEM =
  "あなたはエンタメ動画ランキングサイト「AIEN」の生成エンジン。映画・ドラマ・アニメを横断し、思わずスワイプしたくなる“テーマ別ランキング”を量産する。\n" +
  "【テーマ】日本語。語尾は基本「〜作品」。★このサイトの命はタイトルの面白さ。ニッチで具体的、ユーザーの個人的な感情・あるある・特定の気分や状況にピンポイントで刺さる切り口にする（例:『金曜深夜に観ると週末が台無しになる作品』『主人公より脇役が記憶に残る作品』）。\n" +
  "・王道/スタンダードなテーマ（『人生で必ず観て欲しい』『感動の名作』『一度は観るべき』等）は極力避ける。誰もが思いつく切り口はNG、ひねりと意外性で攻める。\n" +
  "・タイトルに「ベスト〜」「TOP〜」等の順位語は入れない（システム側で付ける）。\n" +
  "・たまにジャンル限定「〜なアニメ作品」、配信媒体限定「〜なNetflix作品」「〜なU-NEXT作品」も混ぜてよい。\n" +
  "【作品選定】日本の配信(Netflix/U-NEXT/Disney+/Prime Video/Hulu/ABEMA/Lemino/DMM TV)で実際に観られる“有名作”のみ。マイナー作・架空作・未配信作は禁止。\n" +
  "・1ランキングに映画・ドラマ・アニメをごちゃ混ぜOK（サブスク視聴者は形式を区別しない）。ただしジャンル/媒体限定テーマのときはそれに従う。\n" +
  "・★なるべく新しめの作品を選ぶ。各ランキングに最低1つは直近1〜2年の新作・話題作を必ず含める（worksの上位に置く）。\n" +
  "【辛口コメント】各作品に“毒のある一言の感想”。性格＝作品を愛するがゆえ容赦なく刺す皮肉屋。50字以内・一〜二文・あらすじ要約禁止・ネタバレ禁止・ありきたりな褒め言葉(感動/名作/必見)禁止・絵文字禁止。具体的で意外な角度で斬る。";

type GenWork = { title: string; comment: string };
type GenTheme = { title: string; description: string; restrict: string | null; works: GenWork[] };

function extractJson(text: string): string {
  const s = text.indexOf("[");
  const e = text.lastIndexOf("]");
  if (s < 0 || e < 0) throw new Error("JSON配列が見つからない:\n" + text.slice(0, 300));
  return text.slice(s, e + 1);
}

async function generateThemes(count: number, avoid: string[]): Promise<{ themes: GenTheme[]; costUSD: number }> {
  const client = new Anthropic();
  const thinky = MODEL.startsWith("claude-opus") || MODEL.startsWith("claude-fable") || MODEL.includes("sonnet-4");
  const user =
    `${count}個の新しいランキングを作って。互いに切り口・ジャンルが被らないよう散らす。\n` +
    `既存テーマ（これらと似た切り口・タイトルは避ける）:\n${avoid.join(" / ") || "（なし）"}\n\n` +
    `各ランキングは works を12件（テーマ適合＆人気の高い順）。限定テーマ以外は映画/ドラマ/アニメを混ぜる。\n` +
    `★最重要：日本の主要サブスク(Netflix/U-NEXT/Disney+/Prime Video/Hulu/ABEMA/Lemino/DMM TV)で“現在配信中”の有名作だけを挙げる。配信が無い作品・マイナー作・古くてサブスクに無い作品は絶対に入れない。同名の地味な作品と紛れない、誰もが知る代表作を選ぶ。\n` +
    `出力はJSON配列のみ（前後に説明文やマークダウンを書かない）:\n` +
    `[{"title":"テーマ名(〜作品 等)","description":"20〜40字の説明","restrict":null,"works":[{"title":"作品の日本語タイトル","comment":"辛口の一言"}]}]\n` +
    `restrict は通常 null。アニメ限定なら "anime"、媒体限定なら "Netflix"/"U-NEXT"/"Disney+"/"Prime Video"/"Hulu" のいずれか。`;

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    messages: [{ role: "user", content: user }],
    ...(thinky ? { thinking: { type: "adaptive" } } : {}),
  });
  const msg = await stream.finalMessage();
  const text = msg.content.filter((b) => b.type === "text").map((b) => ("text" in b ? b.text : "")).join("");
  const parsed = JSON.parse(extractJson(text)) as GenTheme[];
  const price = PRICES[MODEL] ?? PRICES["claude-haiku-4-5"];
  const costUSD = (msg.usage.input_tokens / 1e6) * price.in + (msg.usage.output_tokens / 1e6) * price.out;
  return { themes: parsed.filter((t) => t && t.title && Array.isArray(t.works)), costUSD };
}

// ── 曜日・時間帯スケジュール（JST）。次の生成までの必要間隔（分）を返す。──
// 平日(月〜木): ピーク19-02時=60分 / それ以外=180分。金土日: ピーク=30分 / それ以外=120分。
function requiredIntervalMin(): number {
  const jst = new Date(Date.now() + 9 * 3600 * 1000);
  const h = jst.getUTCHours();
  const dow = jst.getUTCDay(); // 0=日,5=金,6=土
  const peak = h >= 19 || h < 2; // 19:00〜翌02:00
  const sessionDow = h < 2 ? (dow + 6) % 7 : dow; // 0-2時は前日のセッション扱い
  const weekend = sessionDow === 5 || sessionDow === 6 || sessionDow === 0; // 金土日
  if (weekend) return peak ? 30 : 120;
  return peak ? 60 : 180;
}

// ── メイン ──
async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY が未設定です（.env に追加してください）");
  if (!TMDB_KEY) throw new Error("TMDB_API_KEY が未設定です");

  // 月予算ガード：今月の累計コストが上限に達していたら生成しない（＝自動で止まる）
  const spent = loadUsage()[monthKey()] || 0;
  if (spent >= MONTHLY_BUDGET) {
    console.log(`⛔ 今月の生成コスト $${spent.toFixed(2)} が上限 $${MONTHLY_BUDGET} に到達。今月はこれ以上生成しません。`);
    await prisma.$disconnect();
    return;
  }
  console.log(`生成: ${COUNT}本 / モデル: ${MODEL} / 今月コスト $${spent.toFixed(2)}（上限 $${MONTHLY_BUDGET}）`);

  // スケジュール実行時（GEN_SCHEDULE=1）は、曜日・時間帯の必要間隔を満たした時だけ生成。
  if (process.env.GEN_SCHEDULE === "1") {
    const need = requiredIntervalMin();
    const last = await prisma.workRanking.findFirst({
      where: { slug: { startsWith: "gen-" } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const sinceMin = last ? (Date.now() - last.createdAt.getTime()) / 60000 : Infinity;
    if (sinceMin < need - 5) {
      console.log(`⏭ まだ生成タイミングではありません（前回 ${Math.round(sinceMin)}分前 / 必要間隔 ${need}分）。`);
      await prisma.$disconnect();
      return;
    }
    console.log(`⏰ スケジュールOK（前回 ${Number.isFinite(sinceMin) ? Math.round(sinceMin) + "分前" : "—"} / 必要間隔 ${need}分）`);
  }

  // 重複回避は直近40件のみ渡す（入力トークンを抑えてコスト削減）。
  const existing = await prisma.workRanking.findMany({ orderBy: { createdAt: "desc" }, take: 40, select: { title: true } });
  const { themes, costUSD } = await generateThemes(COUNT, existing.map((r) => r.title));
  const monthTotal = addUsage(costUSD);
  console.log(`Claudeが ${themes.length} テーマ生成（このバッチ $${costUSD.toFixed(4)} / 今月累計 $${monthTotal.toFixed(2)}）。TMDB照合中...`);

  let made = 0;
  for (const [ti, theme] of themes.entries()) {
    const restrict = theme.restrict;
    const providerRestrict = restrict && PROVIDERS.includes(restrict) ? restrict : null;

    const picked: { workId: string; comment: string }[] = [];
    for (const w of theme.works ?? []) {
      if (picked.length >= 7) break;
      const info = await tmdbLookup(w.title);
      await sleep(60);
      if (!info) continue;
      if (!info.providers) continue; // 日本の主要サブスクで配信中の作品のみ（観られない作品は除外）
      if (providerRestrict && !info.providers.split(",").includes(providerRestrict)) continue;

      let work = await prisma.work.findFirst({ where: { title: info.title } });
      if (!work) {
        work = await prisma.work.create({
          data: {
            title: info.title, year: info.year,
            kind: restrict === "anime" ? "anime" : info.kind,
            posterUrl: info.posterUrl, providers: info.providers, overview: info.overview,
            aiComment: w.comment ? w.comment.slice(0, 80) : null, popularity: 50,
          },
        });
      } else if (!work.aiComment && w.comment) {
        await prisma.work.update({ where: { id: work.id }, data: { aiComment: w.comment.slice(0, 80) } });
      }
      // 別題名が同一作品にマッチすることがある（ユニーク制約 rankingId+workId 違反になる）
      if (picked.some((p) => p.workId === work.id)) continue;
      picked.push({ workId: work.id, comment: w.comment ?? "" });
    }

    if (picked.length < 5) {
      console.log(`  − スキップ（候補不足 ${picked.length}件）: ${theme.title}`);
      continue;
    }

    const slug = `gen-${Date.now().toString(36)}-${ti}`;
    const ranking = await prisma.workRanking.create({
      data: { slug, title: theme.title, description: theme.description ?? null, status: "published" },
    });
    let pos = 0;
    for (const p of picked) {
      await prisma.workEntry.create({
        data: {
          rankingId: ranking.id, workId: p.workId, score: 100 - pos * 5,
          blurb: p.comment.slice(0, 120), likes: Math.floor(Math.random() * 21),
        },
      });
      pos++;
    }
    const mins = ti * 7 + Math.floor(Math.random() * 5) + 1; // 直近に生成された風に
    await prisma.workRanking.update({
      where: { id: ranking.id },
      data: { createdAt: new Date(Date.now() - mins * 60000), good: Math.floor(Math.random() * 21), bad: Math.floor(Math.random() * 9) },
    });
    made++;
    console.log(`  ✓ ${theme.title}（${picked.length}作品）`);
    await sleep(120);
  }

  // 1000件まで削除しない。超えたら古いランキングのみ削除（作品データは再利用のため保持）。
  const keep = PRUNE_KEEP > 0 ? PRUNE_KEEP : 1000;
  const all = await prisma.workRanking.findMany({ orderBy: { createdAt: "desc" }, select: { id: true } });
  const old = all.slice(keep);
  if (old.length) {
    await prisma.workEntry.deleteMany({ where: { rankingId: { in: old.map((r) => r.id) } } });
    await prisma.workRanking.deleteMany({ where: { id: { in: old.map((r) => r.id) } } });
    console.log(`古いランキング ${old.length}本を削除（作品データは保持＝再利用可 / 保持目標 ${keep}）`);
  }

  const total = await prisma.workRanking.count();
  console.log(`完了: ${made}/${themes.length} 本を公開。現在のランキング総数: ${total}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
