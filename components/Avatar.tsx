// 公式プロフィール写真の枠（MVPではイニシャル表示で統一）。
// 実運用ではここに公式/ライセンス済み写真を入れる。
export function Avatar({
  name,
  photoUrl,
  size = 64,
  fill = false,
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
  fill?: boolean; // 親要素いっぱいに広げる（グリッドのタイル用）
}) {
  const initial = name.trim().charAt(0);
  const box = fill
    ? { width: "100%", height: "100%", fontSize: 30 }
    : { width: size, height: size, fontSize: size * 0.4 };

  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photoUrl}
        alt={name}
        style={{ width: box.width, height: box.height, objectFit: "cover" }}
        className="bg-neutral-100 dark:bg-neutral-800"
      />
    );
  }
  return (
    <div
      style={box}
      className="flex items-center justify-center bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 font-medium select-none"
      aria-hidden
    >
      {initial}
    </div>
  );
}
