import { ImageResponse } from "next/og";
import { getWorkRanking } from "@/lib/queries";
import { displayTitle, rankLabel } from "@/lib/title";
import { moodColor } from "@/lib/mood";

// シェア時にX等が表示するリンクカード画像。1位のポスター＋タイトルを自動生成。
export const alt = "AIENが自動生成したエンタメランキング";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// satoriに日本語フォントは同梱されないため、使う文字だけGoogle Fontsから取得する。
// 古いSafariのUAを名乗るとwoff2ではなくtruetypeが返る（satoriはwoff2非対応）。
async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
          },
        }
      )
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await getWorkRanking(slug);
  const title = (r ? displayTitle(r.title) : "AIEN").slice(0, 60);
  const label = r ? rankLabel(r.title, r.count) : "";
  const accent = moodColor(slug);
  const poster = r?.entries[0]?.posterUrl?.replace("/w342/", "/w500/") ?? null;

  const sub = "AIが自動生成したエンタメランキング";
  const credit = "画像: TMDB";
  const domain = "aientame.com";
  const font = await loadFont(`${title}${label}${sub}${credit}${domain}AIEN`);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0a0a0a",
          padding: 52,
        }}
      >
        {poster && (
          <img
            src={poster}
            width={350}
            height={526}
            style={{ borderRadius: 20, objectFit: "cover", border: `3px solid ${accent}` }}
          />
        )}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            paddingLeft: poster ? 52 : 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>
              <span style={{ color: "#f87171" }}>A</span>
              <span style={{ color: "#fbbf24" }}>I</span>
              <span style={{ color: "#34d399" }}>E</span>
              <span style={{ color: "#60a5fa" }}>N</span>
            </div>
            <span style={{ color: "#a3a3a3", fontSize: 24, marginLeft: 20 }}>{sub}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "#ffffff", fontSize: 54, fontWeight: 700, lineHeight: 1.32 }}>
              {title}
            </span>
            {label && (
              <span style={{ color: accent, fontSize: 60, fontWeight: 700, marginTop: 14 }}>
                {label}
              </span>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#e5e5e5", fontSize: 26 }}>{domain}</span>
            <span style={{ color: "#737373", fontSize: 18 }}>{credit}</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [{ name: "NotoSansJP", data: font, style: "normal" as const, weight: 700 as const }]
        : undefined,
    }
  );
}
