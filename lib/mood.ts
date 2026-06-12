// テーマ（ランキング）ごとの“ムードカラー”。タイトルをこの色で立たせ、
// スワイプするたび色が変わる＝大量に違うランキングが流れてくる物量感を出す。
// 将来はAIがテーマ生成時に色も一緒に出力する想定。今はslug→色のマップ。
const MOODS: Record<string, string> = {
  "ochi-kowai-horror": "#e0403e", // ホラー＝深紅
  "ryoko-ikitakunaru": "#1fb6a6", // 旅＝ターコイズ
  "nakeru-eiga": "#3b82f6", // 泣ける＝青
  "fukusen-kami": "#a855f7", // 伏線＝紫
  "ikkimi-drama": "#6366f1", // 一気見＝藍
  "date-oshare": "#ec4899", // デート＝ピンク
  "shujinko-saikyo": "#f59e0b", // 主人公最強＝琥珀
  "isshou-meisaku": "#eab308", // 名作＝ゴールド
  "otona-anime": "#d946ef", // アニメ＝フューシャ
  "netflix-asamade": "#e50914", // Netflix＝レッド
  "tonari-hanasu": "#06b6d4", // 衝撃＝シアン
  "hitori-yoru": "#818cf8", // 夜＝インディゴ
  "unext-kakure": "#22c55e", // 隠れた名作＝グリーン
};

// AI生成ランキング（slug未登録）には、slugのハッシュから多色パレットを割り当てて彩り豊かに。
const PALETTE = [
  "#e0403e", "#1fb6a6", "#3b82f6", "#a855f7", "#6366f1", "#ec4899",
  "#f59e0b", "#eab308", "#d946ef", "#e50914", "#06b6d4", "#818cf8",
  "#22c55e", "#f97316", "#14b8a6", "#8b5cf6", "#ef4444", "#0ea5e9",
];
function hashSlug(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export const moodColor = (slug: string): string =>
  MOODS[slug] ?? PALETTE[hashSlug(slug) % PALETTE.length];
