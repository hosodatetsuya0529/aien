// 配信サービスの設定（ブランド色・表示優先度・視聴リンク）を一元管理。
export type ProviderStyle = { label: string; bg: string; fg: string };

export const PROVIDER_STYLES: Record<string, ProviderStyle> = {
  Netflix: { label: "Netflix", bg: "#E50914", fg: "#ffffff" },
  "Disney+": { label: "Disney+", bg: "#113CCF", fg: "#ffffff" },
  "U-NEXT": { label: "U-NEXT", bg: "#000000", fg: "#ffffff" },
  "Prime Video": { label: "Prime", bg: "#1A98FF", fg: "#ffffff" },
  Hulu: { label: "Hulu", bg: "#1CE783", fg: "#0a0a0a" },
  Lemino: { label: "Lemino", bg: "#7A2EF0", fg: "#ffffff" },
  ABEMA: { label: "ABEMA", bg: "#0a0a0a", fg: "#3DDC84" },
  "DMM TV": { label: "DMM TV", bg: "#E50012", fg: "#ffffff" },
};

export const providerStyle = (name: string): ProviderStyle =>
  PROVIDER_STYLES[name] ?? { label: name, bg: "#3a3a3a", fg: "#e5e5e5" };

// 表示・並びの優先順位（ユーザー指定）
const PRIORITY = ["Netflix", "Disney+", "U-NEXT", "Prime Video", "ABEMA", "Lemino", "DMM TV", "Hulu"];
// 誘導しない配信サービス（リンク・バッジから除外）
const EXCLUDED = new Set(["FOD"]);
const rank = (n: string) => {
  const i = PRIORITY.indexOf(n);
  return i < 0 ? 999 : i;
};

// カンマ区切り文字列 → 優先度順の配列
export function parseProviders(providers?: string | null): string[] {
  if (!providers) return [];
  const names = [...new Set(providers.split(",").map((s) => s.trim()).filter((s) => s && !EXCLUDED.has(s)))];
  return names.sort((a, b) => rank(a) - rank(b));
}

// 各サービスでその作品を検索して観るための便利リンク（現状はアフィリでなく一般リンク）
export function watchUrl(provider: string, title: string): string {
  const q = encodeURIComponent(title);
  switch (provider) {
    case "Netflix":
      return `https://www.netflix.com/search?q=${q}`;
    case "Disney+":
      return `https://www.disneyplus.com/search?q=${q}`;
    case "U-NEXT":
      return `https://video.unext.jp/freeword?query=${q}`;
    case "Prime Video":
      // Amazon書籍等と紛れないよう Prime Video 専用サイトを検索
      return `https://www.primevideo.com/search?phrase=${q}`;
    case "Hulu":
      return `https://www.hulu.jp/search?q=${q}`;
    case "Lemino":
      return `https://lemino.docomo.ne.jp/search?query=${q}`;
    case "ABEMA":
      return `https://abema.tv/search?q=${q}`;
    case "DMM TV":
      return `https://tv.dmm.com/vod/list/?freeword=${q}`;
    default:
      return `https://www.google.com/search?q=${q}+配信`;
  }
}
