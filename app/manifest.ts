import type { MetadataRoute } from "next";

// ホーム画面に追加（インストール）した時に表示される名称・説明・配色。
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AIEN — AIが自動生成するエンタメ動画ランキング",
    short_name: "AIEN",
    description: "AIが自動生成するエンタメ動画ランキング",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
