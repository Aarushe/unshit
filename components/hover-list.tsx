"use client";

import { useRef, useState } from "react";

type Box = { x: number; y: number; w: number; h: number };

// One rounded tint that glides to whichever `[data-hover-item]` is under the
// pointer (after ashkashyap.me's project list). It appears in place on the
// first item and slides between items after that.
export function HoverList({
  className = "",
  inset = 4,
  rounded = true,
  children,
}: {
  className?: string;
  inset?: number;
  rounded?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [shown, setShown] = useState(false);
  // Off for the first frame after appearing, so it lands in place, not sliding in.
  const [glide, setGlide] = useState(false);

  function move(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return;
    const item = (e.target as Element).closest("[data-hover-item]");
    const root = ref.current;
    if (!item || !root) return;
    const a = root.getBoundingClientRect();
    const b = item.getBoundingClientRect();
    setBox({ x: b.left - a.left + inset, y: b.top - a.top + inset, w: b.width - inset * 2, h: b.height - inset * 2 });
    if (!shown) {
      setGlide(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setGlide(true)));
    }
    setShown(true);
  }

  return (
    <div
      ref={ref}
      onPointerOver={move}
      onPointerLeave={() => {
        setShown(false);
        setGlide(false);
      }}
      className={`relative ${className}`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute top-0 left-0 bg-gray-950/[0.025] motion-reduce:transition-none ${rounded ? "rounded-lg" : ""}`}
        style={{
          width: box?.w ?? 0,
          height: box?.h ?? 0,
          translate: box ? `${box.x}px ${box.y}px` : undefined,
          opacity: shown ? 1 : 0,
          transition: glide
            ? "translate 0.22s var(--ease-smooth), width 0.22s var(--ease-smooth), height 0.22s var(--ease-smooth), opacity 0.15s ease-out"
            : "opacity 0.15s ease-out",
        }}
      />
      {children}
    </div>
  );
}
