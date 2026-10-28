"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type Example = { site: string; before?: string; after?: string };

// One example at a time: the redesign lies over the original and a handle
// wipes between them. Drag anywhere on the picture, or use the arrow keys.
export function Examples({ items }: { items: Example[] }) {
  const [active, setActive] = useState(0);
  const [at, setAt] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [hinted, setHinted] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
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
        const steps = [32, 68, 50];
        steps.forEach((v, i) => setTimeout(() => setAt(v), 350 + i * 450));
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hinted]);

  function pick(i: number) {
    setActive(i);
    setAt(50);
  }

  return (
    <div className="rounded-2xl bg-fill p-1.5 ring-1 ring-gray-950/5 ring-inset">
      <div className="overflow-hidden rounded-xl bg-white shadow-xs ring-1 ring-gray-950/5">
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
          <span className="hidden shrink-0 pr-2 font-mono text-xs/5 text-gray-950/35 sm:block">drag to compare</span>
        </div>

        <div ref={stage} className="relative aspect-[16/10] touch-pan-y select-none">
          <Layer src={example.before} label="before" site={example.site} />
          <div
            className={`absolute inset-0 ${dragging ? "" : "transition-[clip-path] duration-500 ease-(--ease-smooth)"}`}
            style={{ clipPath: `inset(0 0 0 ${at}%)` }}
          >
            <Layer src={example.after} label="after" site={example.site} />
          </div>

          {/* The handle: a hairline with a grip, following the wipe. */}
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-gray-950/20 ${
              dragging ? "" : "transition-[left] duration-500 ease-(--ease-smooth)"
            }`}
            style={{ left: `${at}%` }}
          >
            <div
              className={`absolute top-1/2 left-1/2 flex h-8 w-5 -translate-1/2 items-center justify-center gap-0.5 rounded-full bg-white shadow-sm ring-1 ring-gray-950/10 transition-transform duration-200 ${
                dragging ? "scale-110" : ""
              }`}
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

          {/* A full-size range input does the dragging and keyboard work. */}
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={at}
            aria-label={`Compare ${example.site} before and after`}
            onChange={(e) => setAt(Number(e.target.value))}
            onPointerDown={() => setDragging(true)}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
            className="absolute inset-0 h-full w-full cursor-ew-resize appearance-none opacity-0"
          />
        </div>
      </div>
    </div>
  );
}

function Layer({ src, label, site }: { src?: string; label: string; site: string }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={`${site}, ${label}`}
        fill
        sizes="(min-width: 768px) 736px, 100vw"
        className="object-cover object-top"
        draggable={false}
      />
    );
  }
  // Until there's a screenshot: hatching for the original, a clean grid for the redesign.
  return <div className={`absolute inset-0 ${label === "before" ? "hatch bg-white" : "grid-paper bg-white"}`} />;
}
