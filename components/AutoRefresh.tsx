"use client";

import { useEffect } from "react";

// PWA（ホーム画面アプリ）はアイコンから開いても前回の画面をそのまま復元するため、
// フィードが古いまま表示され続ける。前面に復帰した時に一定時間経っていたら
// 再読み込みして、常に新しいランキングに出会えるようにする。
const STALE_MS = 5 * 60 * 1000;

export function AutoRefresh() {
  useEffect(() => {
    let loadedAt = Date.now();
    const refreshIfStale = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - loadedAt < STALE_MS) return;
      loadedAt = Date.now();
      window.location.reload();
    };
    // bfcache（戻る/進むキャッシュ）から復元された時も同じ判定を通す
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) refreshIfStale();
    };
    document.addEventListener("visibilitychange", refreshIfStale);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", refreshIfStale);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);
  return null;
}
