"use client";

import { useState } from "react";
import { getVoterKey } from "@/lib/voterKey";

export function LikeButton({
  entryId,
  initialLikes,
  overlay = false,
  tone = "light",
  endpoint,
}: {
  entryId: string;
  initialLikes: number;
  overlay?: boolean; // 写真の上に重ねる用（暗いピル）
  tone?: "light" | "dark"; // dark=ダーク背景で見やすいピル
  endpoint?: string; // 既定はタレント用。作品は /api/work-entries/[id]/like
}) {
  const url = endpoint ?? `/api/entries/${entryId}/like`;
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  async function like() {
    if (liked || busy) return;
    setBusy(true);
    setLikes((n) => n + 1); // 楽観的更新
    setLiked(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterKey: getVoterKey() }),
      });
      const data = await res.json();
      if (typeof data.likes === "number") setLikes(data.likes);
    } catch {
      setLikes((n) => n - 1);
      setLiked(false);
    } finally {
      setBusy(false);
    }
  }

  if (overlay) {
    return (
      <button
        onClick={like}
        disabled={liked}
        className="inline-flex items-center gap-1 text-[11px] rounded-full bg-black/55 px-1.5 py-0.5 backdrop-blur-sm transition"
        aria-label="いいね"
      >
        <span aria-hidden className={liked ? "text-rose-500" : "text-white"}>
          {liked ? "♥" : "♡"}
        </span>
        <span className="tabular-nums text-white">{likes.toLocaleString()}</span>
      </button>
    );
  }

  if (tone === "dark") {
    return (
      <button
        onClick={like}
        disabled={liked}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] transition ${
          liked ? "text-rose-400 bg-rose-400/15" : "text-white/75 bg-white/10 hover:bg-white/20"
        }`}
        aria-label="いいね"
      >
        <span aria-hidden className="text-[15px] leading-none">{liked ? "♥" : "♡"}</span>
        <span className="tabular-nums">{likes.toLocaleString()}</span>
      </button>
    );
  }

  return (
    <button
      onClick={like}
      disabled={liked}
      className={`inline-flex items-center gap-1 text-xs transition ${
        liked ? "text-rose-500" : "text-neutral-400 hover:text-rose-500"
      }`}
      aria-label="いいね"
    >
      <span aria-hidden>{liked ? "♥" : "♡"}</span>
      <span className="tabular-nums">{likes.toLocaleString()}</span>
    </button>
  );
}
