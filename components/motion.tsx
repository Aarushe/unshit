"use client";

import { useEffect } from "react";

// Reveals each `.rise` element as soon as it is 40px into the screen, and
// hides each edge blur while that end of the page is in view.
export function Motion() {
  useEffect(() => {
    document.documentElement.dataset.motion = "on";
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-shown", "");
          reveal.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -40px 0px" },
    );
    document.querySelectorAll(".rise").forEach((el) => reveal.observe(el));

    // Each edge blur shows only while there is more page beyond that edge.
    const edges = (["top", "bottom"] as const).map((side) => {
      const blur = document.getElementById(`${side}-blur`);
      const sentinel = document.getElementById(side === "top" ? "page-start" : "page-end");
      const io = new IntersectionObserver(([e]) => blur?.toggleAttribute("data-hidden", e.isIntersecting));
      if (sentinel) io.observe(sentinel);
      return io;
    });

    return () => {
      reveal.disconnect();
      edges.forEach((io) => io.disconnect());
    };
  }, []);

  return null;
}
