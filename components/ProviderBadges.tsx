// 配信サービスのミニバッジ。優先度順に並ぶ。summary=先頭1つ＋「ほかN」。
import { providerStyle, parseProviders } from "@/lib/providers";

function Chip({ name }: { name: string }) {
  const s = providerStyle(name);
  return (
    <span
      className="text-[10px] font-bold leading-none rounded-md px-2 py-1.5 ring-1 ring-inset ring-white/20 shadow-sm shrink-0"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}

export function ProviderBadges({ providers, max = 3, summary = false, summaryCount = 1 }: { providers?: string | null; max?: number; summary?: boolean; summaryCount?: number }) {
  const names = parseProviders(providers);
  if (!names.length) return null;

  if (summary) {
    const shown = names.slice(0, summaryCount);
    const rest = names.length - shown.length;
    return (
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        {shown.map((name) => (
          <Chip key={name} name={name} />
        ))}
        {rest > 0 && <span className="text-[11px] text-white/45 leading-none">ほか</span>}
      </div>
    );
  }

  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {shown.map((name) => (
        <Chip key={name} name={name} />
      ))}
      {rest > 0 && <span className="text-[10px] text-white/45 leading-none">+{rest}</span>}
    </div>
  );
}
