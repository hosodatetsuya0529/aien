"use client";

// AIEN ロゴ（レインボー）。クリックで規約/説明ページを必ず別タブ（別窓）で開く（スマホ含む）。
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <a
      href="/about"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="AIENについて・プライバシーポリシー（別タブで開く）"
      className="leading-none select-none shrink-0"
      onClick={(e) => {
        e.preventDefault();
        window.open("/about", "_blank", "noopener,noreferrer");
      }}
    >
      <span
        className="font-black tracking-tight"
        style={{
          fontSize: size,
          backgroundImage: "linear-gradient(95deg, #ff4d6d, #ff9a3c, #ffe14d, #38e08b, #2bd2ff, #5b7bff, #b15cff)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
        }}
      >
        AIEN
      </span>
    </a>
  );
}
