"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 「AIに新しいランキングを作らせる」デモ用ボタン
export function GenerateButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/generate", { method: "POST" });
      const data = await res.json();
      setMsg(data.title ? `「${data.title}」を生成しました` : data.message ?? "完了");
      router.refresh();
    } catch {
      setMsg("生成に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={generate}
        disabled={busy}
        className="h-9 px-4 text-sm font-medium rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 disabled:opacity-50"
      >
        {busy ? "生成中…" : "＋ AIに新しいランキングを作らせる"}
      </button>
      {msg && <span className="text-xs text-neutral-500">{msg}</span>}
    </div>
  );
}
