"use client";

import { useEffect, useRef } from "react";
import { ShareButton } from "./ShareButton";

// スワイプ操作＋ヒント。
// ・マウス：ドラッグで中身が追従 → 離すとヌルッと次/前へ（TikTok風）
// ・タッチ／トラックパッド／ホイール：ブラウザ標準のスナップスクロール
// ・↑↓キー／矢印ボタン：1ランキングずつ移動
export function SwipeNav() {
  const rafRef = useRef(0);

  const snap = () => document.querySelector("[data-feed]") as HTMLElement | null;

  // 各ランキング（section）のスクロール内オフセット。展開で高さが変わっても正しく追従する。
  const sectionTops = (c: HTMLElement): number[] => {
    const base = c.getBoundingClientRect().top - c.scrollTop;
    return [...c.querySelectorAll(":scope > section")].map((el) =>
      Math.round(el.getBoundingClientRect().top - base)
    );
  };
  const currentIndex = (c: HTMLElement, tops: number[]): number => {
    let idx = 0;
    for (let k = 0; k < tops.length; k++) if (tops[k] <= c.scrollTop + 4) idx = k;
    return idx;
  };

  // 現在地から target までヌルッと移動（easeOutCubic）
  const animateTo = (top: number) => {
    const c = snap();
    if (!c) return;
    cancelAnimationFrame(rafRef.current);
    const start = c.scrollTop;
    const dist = top - start;
    if (Math.abs(dist) < 1) {
      c.style.scrollSnapType = "";
      return;
    }
    c.style.scrollSnapType = "none";
    const t0 = performance.now();
    const dur = 320;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      c.scrollTop = start + dist * e;
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else c.style.scrollSnapType = "";
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const go = (dir: number) => {
    const c = snap();
    if (!c) return;
    const tops = sectionTops(c);
    const t = Math.max(0, Math.min(tops.length - 1, currentIndex(c, tops) + dir));
    animateTo(tops[t]);
  };

  useEffect(() => {
    const c = snap();
    if (!c) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); go(-1); }
    };
    window.addEventListener("keydown", onKey);

    // ドラッグ＝スワイプ（マウス／タッチ両対応のページャー）
    let dragging = false, startY = 0, startScroll = 0, moved = 0, startT = 0, startIdx = 0;
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-swipenav]")) return;
      cancelAnimationFrame(rafRef.current);
      dragging = true; startY = e.clientY; startScroll = c.scrollTop; moved = 0; startT = performance.now();
      startIdx = currentIndex(c, sectionTops(c)); // スワイプ開始時のランキングを基準にする
      c.style.scrollSnapType = "none";
      if (e.pointerType === "mouse") { c.style.userSelect = "none"; c.style.cursor = "grabbing"; }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dy = e.clientY - startY;
      moved = Math.max(moved, Math.abs(dy));
      c.scrollTop = startScroll - dy; // 指（カーソル）に追従
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      c.style.userSelect = "";
      c.style.cursor = "";
      const dy = e.clientY - startY;
      const v = dy / Math.max(1, performance.now() - startT); // px/ms（フリック速度）
      const tops = sectionTops(c);
      // 開始位置を基準に「隣の1つだけ」へ。上スワイプ=次へ、下スワイプ=前へ（戻る）。
      let t = startIdx;
      if (dy < -38 || v < -0.3) t = startIdx + 1;
      else if (dy > 38 || v > 0.3) t = startIdx - 1;
      t = Math.max(0, Math.min(tops.length - 1, t));
      animateTo(tops[t]); // 離したらヌルッと着地（必ず1つ）
    };
    const onClick = (e: MouseEvent) => {
      if (moved > 10) { e.preventDefault(); e.stopPropagation(); moved = 0; }
    };
    // 写真・テキストのネイティブdrag（画像が持ち上がる挙動）を止める＝スワイプを邪魔させない
    const onDragStart = (e: DragEvent) => e.preventDefault();
    c.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    c.addEventListener("click", onClick, true);
    c.addEventListener("dragstart", onDragStart);
    // JSが有効な時だけタッチ制御を奪う（=JSページャー）。未ロード時はネイティブのスナップにフォールバック。
    c.style.touchAction = "none";

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", onKey);
      c.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      c.removeEventListener("click", onClick, true);
      c.removeEventListener("dragstart", onDragStart);
      c.style.touchAction = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      data-swipenav
      className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center"
    >
      <div className="relative w-full max-w-[440px] px-5">
        <div className="pointer-events-auto absolute right-1 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 text-white">
          <button
            onClick={() => go(-1)}
            aria-label="前のランキング"
            className="text-white/35 hover:text-white/80 text-2xl leading-none transition"
          >
            ︿
          </button>
          <button
            onClick={() => go(1)}
            aria-label="次のランキングへ"
            className="flex flex-col items-center text-white/60 hover:text-white/95 transition"
          >
            <span className="text-[11px] [writing-mode:vertical-rl] tracking-[0.25em]">スワイプで次へ</span>
            <span className="text-2xl leading-none mt-2 animate-bounce">﹀</span>
          </button>
          <ShareButton />
        </div>
      </div>
    </div>
  );
}
