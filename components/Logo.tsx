// AIEN logo. Click opens the about/terms page in a new tab. Plain anchor for best mobile compatibility.
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <a
      href="/about"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="AIEN about and privacy policy (opens in new tab)"
      className="leading-none select-none shrink-0"
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
