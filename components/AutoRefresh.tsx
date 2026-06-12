"use client";

import { useEffect } from "react";

// PWA（ホーム画面アプリ）はアイコンから開いても前回の画面をそのまま復元するため、
// フィードが古いまま表示され続ける。「バックグラウンドにいた時間」が一定を超えて
// 前面に戻ってきたら再読み込みして、開き直すたび新しいランキングに出会えるようにする。
const STALE_MS = 60 * 1000;

export function AutoRefresh() {
  useEffect(() => {
    const loadedAt = Date.now();
    let hiddenAt: number | null = null;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt !== null && Date.now() - hiddenAt >= STALE_MS) {
        window.location.reload();
        return;
      }
      hiddenAt = null;
    };
    // bfcache（戻る/進むキャッシュ）から復元された時は読み込み時刻を基準に判定
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted && Date.now() - loadedAt >= STALE_MS) window.location.reload();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);
  return null;
}
