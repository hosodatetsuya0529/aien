// 作品ポスター。実ポスター(TMDB)があれば表示、無ければ“タイポグラフィ・ポスター”を生成。
// タイトルから決定論的に配色を選び、奥行き（上ハイライト＋下シェード）で仮タイル感を消す。
const GRADIENTS = [
  ["#1e3a5f", "#0a1622"], // 群青
  ["#4a1d3d", "#180a13"], // ワイン
  ["#1d4a3a", "#0a1a14"], // フォレスト
  ["#4a3618", "#19120a"], // セピア
  ["#36204f", "#120a1e"], // バイオレット
  ["#4a281d", "#190d08"], // ラスト
  ["#1d3f4a", "#08161a"], // ティール
  ["#45192b", "#170810"], // クリムゾン
  ["#2a2c40", "#0e0f18"], // スレート
  ["#1d4a45", "#081a18"], // ダークシアン
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function Poster({ title, posterUrl }: { title: string; posterUrl?: string | null }) {
  if (posterUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={posterUrl} alt={title} className="w-full h-full object-cover" />;
  }
  const [a, b] = GRADIENTS[hash(title) % GRADIENTS.length];
  return (
    <div className="relative w-full h-full" style={{ background: `linear-gradient(155deg, ${a}, ${b})` }}>
      {/* 上からの光 */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(115% 70% at 50% 6%, rgba(255,255,255,0.13), rgba(255,255,255,0) 55%)" }}
      />
      {/* 下の沈み */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/5"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.38), rgba(0,0,0,0))" }}
      />
      {/* タイトル */}
      <div className="absolute inset-0 flex items-center justify-center px-3 text-center">
        <span
          className="text-white font-bold leading-snug text-[14px] line-clamp-3 tracking-[0.01em]"
          style={{ textShadow: "0 1px 10px rgba(0,0,0,0.45)" }}
        >
          {title}
        </span>
      </div>
    </div>
  );
}
