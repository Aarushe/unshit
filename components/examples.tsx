"use client";

import { useEffect, useRef, useState } from "react";

export type Example = { site: string; before?: string; after?: string };

// One example at a time: the redesign lies over the original and a handle
// wipes between them. Both are full-page screenshots that scroll together,
// each at its own pace, so they reach their top and bottom at the same time.
// Drag sideways (or use the arrow keys on the handle) to compare; scroll to
// read; open it full screen to see it at size.
//
// Dragging and scrolling write straight to the DOM (a CSS variable for the
// wipe, a translate for each page) instead of going through React state, so
// they keep up with the pointer.
export function Examples({ items }: { items: Example[] }) {
  const [active, setActive] = useState(0);
  const [full, setFull] = useState(false);
  const [tallest, setTallest] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const grip = useRef<HTMLDivElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const at = useRef(50);
  const dragging = useRef(false);
  const frame = useRef(0);
  const glideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const example = items[active];

  // Puts the wipe at v percent. `glide` eases there (the first-view sweep, a
  // new tab); otherwise it lands at once.
  function place(v: number, glide = false) {
    const s = stage.current;
    if (!s) return;
    at.current = Math.min(100, Math.max(0, v));
    clearTimeout(glideTimer.current);
    if (glide) {
      s.dataset.glide = "";
      glideTimer.current = setTimeout(() => delete s.dataset.glide, 400);
    } else delete s.dataset.glide;
    s.style.setProperty("--at", `${at.current}%`);
    // The grip stays centred on the line but inside the frame at either end.
    grip.current?.style.setProperty("translate", `${at.current < 3 ? 0 : at.current > 97 ? -20 : -10}px -50%`);
    grip.current?.setAttribute("aria-valuenow", String(Math.round(at.current)));
  }

  // Moves each page by the same share of its own overflow as the scroller has
  // moved through its range.
  function sync() {
    const sc = scroller.current;
    if (!sc) return;
    const range = sc.scrollHeight - sc.clientHeight;
    const progress = range > 0 ? sc.scrollTop / range : 0;
    for (const el of layers.current) {
      if (el) el.style.translate = `0 ${-progress * Math.max(0, el.offsetHeight - sc.clientHeight)}px`;
    }
  }

  // The scroll range follows the taller page, re-measured as images load and
  // the frame resizes (full screen, window size).
  useEffect(() => {
    const measure = () => {
      setTallest(Math.max(0, ...layers.current.map((el) => el?.offsetHeight ?? 0)));
      sync();
    };
    const ro = new ResizeObserver(measure);
    layers.current.forEach((el) => el && ro.observe(el));
    if (stage.current) ro.observe(stage.current);
    return () => ro.disconnect();
  }, [active, full]);

  // The first time the picture is on screen, sweep the handle once so it's
  // clear it moves.
  useEffect(() => {
    const el = stage.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        [32, 68, 50].forEach((v, i) => timers.push(setTimeout(() => !dragging.current && place(v, true), 300 + i * 380)));
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

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
    place(50, true);
    scroller.current?.scrollTo({ top: 0 });
  }

  function follow(clientX: number) {
    const r = stage.current?.getBoundingClientRect();
    if (!r) return;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => place(((clientX - r.left) / r.width) * 100));
  }

  // Sideways drags move the handle; vertical drags and the wheel scroll the page.
  const drag = {
    onPointerDown(e: React.PointerEvent) {
      if (e.button !== 0) return;
      dragging.current = true;
      stage.current?.setAttribute("data-dragging", "");
      follow(e.clientX);
      if (e.pointerType === "mouse") (e.currentTarget as Element).setPointerCapture(e.pointerId);
    },
    onPointerMove(e: React.PointerEvent) {
      if (dragging.current) follow(e.clientX);
    },
    onPointerUp: () => stop(),
    onPointerCancel: () => stop(),
  };
  function stop() {
    dragging.current = false;
    stage.current?.removeAttribute("data-dragging");
  }

  const glide = "group-data-glide/stage:duration-300 group-data-glide/stage:ease-(--ease-smooth)";

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
                className={`shrink-0 rounded-md px-2 py-1 font-mono text-xs/5 transition-colors duration-150 ${
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
              className="flex size-7 items-center justify-center rounded-md text-gray-950/55 transition-colors duration-150 hover:bg-fill hover:text-gray-950"
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

        <div
          ref={stage}
          className={`group/stage relative select-none [--at:50%] ${full ? "min-h-0 flex-1" : "aspect-[16/10]"}`}
        >
          {/* The pages, each moved by sync() rather than scrolled itself. */}
          <div className="absolute inset-0 overflow-hidden">
            <div ref={(el) => void (layers.current[0] = el)} className="absolute inset-x-0 top-0 will-change-transform">
              <Layer src={example.before} label="before" site={example.site} />
            </div>
            <div
              className={`absolute inset-0 bg-white transition-[clip-path] duration-0 [clip-path:inset(0_0_0_var(--at))] ${glide}`}
            >
              <div ref={(el) => void (layers.current[1] = el)} className="absolute inset-x-0 top-0 will-change-transform">
                <Layer src={example.after} label="after" site={example.site} />
              </div>
            </div>
          </div>

          {/* An empty scroller on top takes the wheel, swipes and drags; its
              height is the taller page's, so it scrolls as far as that page. */}
          <div
            ref={scroller}
            onScroll={sync}
            {...drag}
            className="absolute inset-0 cursor-ew-resize touch-pan-y overflow-y-auto overscroll-contain group-data-dragging/stage:cursor-grabbing"
          >
            <div style={{ height: tallest }} />
          </div>

          {/* The handle stays put while the pages scroll beneath it. */}
          <div
            className={`pointer-events-none absolute inset-y-0 left-(--at) w-px -translate-x-1/2 bg-gray-950/20 transition-[left] duration-0 ${glide}`}
          >
            <div
              ref={grip}
              role="slider"
              tabIndex={0}
              aria-label={`Compare ${example.site} before and after`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={50}
              onKeyDown={(e) => {
                const step = e.shiftKey ? 10 : 2;
                if (e.key === "ArrowLeft") place(at.current - step);
                else if (e.key === "ArrowRight") place(at.current + step);
                else return;
                e.preventDefault();
              }}
              {...drag}
              style={{ translate: "-10px -50%" }}
              className="pointer-events-auto absolute top-1/2 left-0 flex h-8 w-5 cursor-ew-resize touch-none items-center justify-center gap-0.5 rounded-full bg-white shadow-sm ring-1 ring-gray-950/10 outline-offset-2 transition-[scale] duration-150 group-data-dragging/stage:scale-110"
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
    return <img src={src} alt={`${site}, ${label}`} draggable={false} decoding="async" className="block h-auto w-full" />;
  }
  // Until there's a screenshot: a tall page of hatching for the original and a
  // clean grid for the redesign, so the wipe and the scroll can be tried.
  return <div className={`aspect-[16/30] w-full ${label === "before" ? "hatch bg-white" : "grid-paper bg-white"}`} />;
}
