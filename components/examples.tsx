"use client";

import { useEffect, useRef, useState } from "react";

export type Example = { site: string; before?: string; after?: string };

// One example at a time: the redesign lies over the original and a handle
// wipes between them. Both are full-page screenshots that scroll together.
// Drag sideways (or use the arrow keys on the handle) to compare; scroll to
// read; open it full screen to see it at size.
export function Examples({ items }: { items: Example[] }) {
  const [active, setActive] = useState(0);
  const [at, setAt] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [hinted, setHinted] = useState(false);
  const [full, setFull] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const example = items[active];

  // The first time the picture is on screen, sweep the handle once so it's
  // clear it moves.
  useEffect(() => {
    const el = stage.current;
    if (!el || hinted || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setHinted(true);
        [32, 68, 50].forEach((v, i) => setTimeout(() => setAt(v), 350 + i * 450));
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hinted]);

  // Full screen: lock the page behind it and close on Escape.
  useEffect(() => {
    if (!full) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    addEventListener("keydown", close);
    return () => {
      document.documentElement.style.overflow = overflow;
      removeEventListener("keydown", close);
    };
  }, [full]);

  function pick(i: number) {
    setActive(i);
    setAt(50);
    scroller.current?.scrollTo({ top: 0 });
  }

  function follow(clientX: number) {
    const r = stage.current?.getBoundingClientRect();
    if (r) setAt(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  }

  // Sideways drags move the handle; vertical drags and the wheel scroll the page.
  const drag = {
    onPointerDown(e: React.PointerEvent) {
      if (e.button !== 0) return;
      setDragging(true);
      follow(e.clientX);
      if (e.pointerType === "mouse") (e.currentTarget as Element).setPointerCapture(e.pointerId);
    },
    onPointerMove(e: React.PointerEvent) {
      if (dragging) follow(e.clientX);
    },
    onPointerUp: () => setDragging(false),
    onPointerCancel: () => setDragging(false),
  };

  const glide = dragging ? "" : "duration-500 ease-(--ease-smooth)";

  return (
    <div
      className={
        full
          ? "fixed inset-0 z-50 flex flex-col bg-white p-2 sm:p-4"
          : "rounded-2xl bg-fill p-1.5 ring-1 ring-gray-950/5 ring-inset"
      }
      role={full ? "dialog" : undefined}
      aria-modal={full || undefined}
      aria-label={full ? `${example.site}, before and after` : undefined}
    >
      <div
        className={`flex flex-col overflow-hidden rounded-xl bg-white shadow-xs ring-1 ring-gray-950/5 ${full ? "min-h-0 flex-1" : ""}`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-950/5 px-2 py-1.5">
          <div role="tablist" aria-label="Examples" className="flex min-w-0 gap-1 overflow-x-auto">
            {items.map(({ site }, i) => (
              <button
                key={site}
                role="tab"
                aria-selected={i === active}
                onClick={() => pick(i)}
                className={`shrink-0 rounded-md px-2 py-1 font-mono text-xs/5 transition-colors duration-300 ease-in-out ${
                  i === active ? "bg-fill text-gray-950" : "text-gray-950/45 hover:text-gray-950"
                }`}
              >
                {site}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden font-mono text-xs/5 text-gray-950/35 sm:block">drag to compare · scroll to read</span>
            <button
              onClick={() => setFull(!full)}
              aria-label={full ? "Exit full screen" : "Full screen"}
              className="flex size-7 items-center justify-center rounded-md text-gray-950/55 transition-colors duration-300 ease-in-out hover:bg-fill hover:text-gray-950"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d={full ? "M5.5 1.5V5.5H1.5M8.5 1.5V5.5H12.5M5.5 12.5V8.5H1.5M8.5 12.5V8.5H12.5" : "M1.5 5V1.5H5M9 1.5H12.5V5M1.5 9V12.5H5M9 12.5H12.5V9"}
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div ref={stage} className={`relative select-none ${full ? "min-h-0 flex-1" : "aspect-[16/10]"}`}>
          <div
            ref={scroller}
            {...drag}
            className={`absolute inset-0 touch-pan-y overflow-y-auto overscroll-contain ${dragging ? "cursor-grabbing" : "cursor-ew-resize"}`}
          >
            {/* Both pages share one grid cell, so the taller one sets the scroll height. */}
            <div className="grid">
              <div className="[grid-area:1/1]">
                <Layer src={example.before} label="before" site={example.site} />
              </div>
              <div
                className={`bg-white [grid-area:1/1] transition-[clip-path] ${glide}`}
                style={{ clipPath: `inset(0 0 0 ${at}%)` }}
              >
                <Layer src={example.after} label="after" site={example.site} />
              </div>
            </div>
          </div>

          {/* The handle stays put while the pages scroll beneath it. */}
          <div
            className={`pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-gray-950/20 transition-[left] ${glide}`}
            style={{ left: `${at}%` }}
          >
            <div
              role="slider"
              tabIndex={0}
              aria-label={`Compare ${example.site} before and after`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(at)}
              onKeyDown={(e) => {
                const step = e.shiftKey ? 10 : 2;
                if (e.key === "ArrowLeft") setAt((v) => Math.max(0, v - step));
                else if (e.key === "ArrowRight") setAt((v) => Math.min(100, v + step));
                else return;
                e.preventDefault();
              }}
              {...drag}
              className={`pointer-events-auto absolute top-1/2 left-0 flex h-8 w-5 cursor-ew-resize touch-none items-center justify-center gap-0.5 rounded-full bg-white shadow-sm ring-1 ring-gray-950/10 transition-transform duration-200 outline-offset-2 ${
                dragging ? "scale-110" : ""
              }`}
              // Centred on the line, but kept inside the frame at either end.
              style={{ translate: `${at < 3 ? 0 : at > 97 ? -20 : -10}px -50%` }}
            >
              <span className="h-3 w-px bg-gray-950/30" />
              <span className="h-3 w-px bg-gray-950/30" />
            </div>
          </div>

          <span className="pointer-events-none absolute top-3 left-3 rounded-md bg-white/90 px-1.5 py-0.5 font-mono text-[0.6875rem]/4 text-gray-950/55 shadow-xs ring-1 ring-gray-950/5">
            before
          </span>
          <span className="pointer-events-none absolute top-3 right-3 rounded-md bg-white/90 px-1.5 py-0.5 font-mono text-[0.6875rem]/4 text-gray-950/55 shadow-xs ring-1 ring-gray-950/5">
            after
          </span>
        </div>
      </div>
    </div>
  );
}

function Layer({ src, label, site }: { src?: string; label: string; site: string }) {
  if (src) {
    // Full-page screenshots at their own height, so the page can be scrolled.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={`${site}, ${label}`} draggable={false} className="block h-auto w-full" />;
  }
  // Until there's a screenshot: a tall page of hatching for the original and a
  // clean grid for the redesign, so the wipe and the scroll can be tried.
  return <div className={`aspect-[16/30] w-full ${label === "before" ? "hatch bg-white" : "grid-paper bg-white"}`} />;
}
