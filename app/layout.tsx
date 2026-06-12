import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AIEN — AIが自動生成するエンタメ動画ランキング",
  description:
    "AIが自動生成するエンタメ動画ランキング。映画・ドラマ・アニメをテーマ別に、いま配信で観られる作品をスワイプで楽しめる。",
  applicationName: "AIEN",
  appleWebApp: { capable: true, title: "AIEN", statusBarStyle: "black-translucent" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-900">
        {children}
        {/* TMDB利用規約で必須のクレジット表記 */}
        <footer className="mt-auto bg-neutral-950 py-5 px-5 text-center text-[11px] leading-relaxed text-neutral-500">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </footer>
      </body>
    </html>
  );
}
