// 現在のランキング総数（実数）を表示。自動削除で常に300〜350に保たれるのでAIっぽい数字になる。
export function RankingCount({ count }: { count: number }) {
  return (
    <span className="ml-auto shrink-0 whitespace-nowrap text-[12px] text-white/40">
      現在のランキング数 <span className="text-emerald-400 font-bold tabular-nums">{count.toLocaleString()}</span>件
    </span>
  );
}
