"use client";

import { useEffect, useState } from "react";

export default function ParallaxBackground() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let rafId = 0;

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        setScrollY(window.scrollY || 0);
        rafId = 0;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const layerOneOffset = scrollY * 0.18;
  const layerTwoOffset = scrollY * 0.35;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div
        className="absolute inset-[-6%] bg-cover bg-center opacity-60"
        style={{
          backgroundImage: "url('/back1.jpg')",
          transform: `translate3d(0, ${layerOneOffset}px, 0) scale(1.06)`,
        }}
      />

      <div
        className="absolute inset-[-10%] bg-cover bg-center opacity-45 mix-blend-overlay"
        style={{
          backgroundImage: "url('/back2.jpg')",
          transform: `translate3d(0, ${-layerTwoOffset}px, 0) scale(1.08)`,
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-900/15 to-slate-950/25" />
    </div>
  );
}
