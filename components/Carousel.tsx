"use client";

import { useRef } from "react";

// Netflix風の横スクロール行（デスクトップはホバーで左右の送り矢印）
export function Carousel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className="relative group">
      <div
        ref={ref}
        className="flex gap-1.5 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <button
        onClick={() => scroll(-1)}
        aria-label="前へ"
        className="hidden md:flex absolute left-0 top-0 bottom-2 w-12 items-center justify-center text-3xl text-neutral-700 bg-gradient-to-r from-neutral-50 via-neutral-50/80 to-transparent opacity-0 group-hover:opacity-100 transition"
      >
        ‹
      </button>
      <button
        onClick={() => scroll(1)}
        aria-label="次へ"
        className="hidden md:flex absolute right-0 top-0 bottom-2 w-12 items-center justify-center text-3xl text-neutral-700 bg-gradient-to-l from-neutral-50 via-neutral-50/80 to-transparent opacity-0 group-hover:opacity-100 transition"
      >
        ›
      </button>
    </div>
  );
}
