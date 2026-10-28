import Link from "next/link";
import { Motion } from "./motion";

export const repo = "https://github.com/Aarushe/new-internet-society";

// One full-width row: the rule spans the viewport, the content sits in the
// centered column whose side rules run the full height of the page.
export function Row({ id, className = "", children }: { id?: string; className?: string; children?: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-14 border-t border-gray-950/5 first:border-t-0">
      <div className={`mx-auto max-w-3xl border-x border-gray-950/5 ${className}`}>{children}</div>
    </div>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip font-display">
      <div id="page-start" className="h-px -mb-px" />
      <header className="border-b border-gray-950/5">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between border-x border-gray-950/5 px-4 sm:px-6">
          <Link href="/" className="text-[17px]/5 tracking-[-0.3px]">
            New Internet Society
          </Link>
          <p className="text-sm/6 text-gray-950/55">
            Made by{" "}
            <a href="https://x.com/aarushe_reddy" target="_blank" rel="noreferrer" className="link">
              @aarushe_reddy
            </a>
          </p>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {children}
        <div className="flex flex-1 flex-col border-t border-gray-950/5">
          <div className="hatch mx-auto min-h-24 w-full max-w-3xl flex-1 border-x border-gray-950/5" />
        </div>
        <div id="page-end" className="h-px" />
      </main>
      <EdgeBlur side="top" />
      <EdgeBlur side="bottom" />
      <Motion />
    </div>
  );
}

// Layers of increasing blur, each masked to a band that overlaps the next, so
// the page softens gradually toward the edge instead of in one step.
const blurs = [0.5, 1, 2, 4, 8, 16];

function EdgeBlur({ side }: { side: "top" | "bottom" }) {
  const toward = side === "bottom" ? "bottom" : "top";
  return (
    <div
      id={`${side}-blur`}
      data-hidden=""
      aria-hidden
      className={`edge-blur pointer-events-none fixed inset-x-0 z-10 ${side === "bottom" ? "bottom-0 h-24" : "top-0 h-16"}`}
    >
      {blurs.map((px, i) => {
        const at = (n: number) => `${Math.min(Math.max(n, 0), 1) * 100}%`;
        const step = 1 / blurs.length;
        const mask = `linear-gradient(to ${toward}, transparent ${at(i * step - step)}, black ${at(i * step)}, black ${at(i * step + step)}, transparent ${at(i * step + 2 * step)})`;
        return (
          <div
            key={px}
            className="absolute inset-0"
            style={{ backdropFilter: `blur(${px}px)`, WebkitBackdropFilter: `blur(${px}px)`, maskImage: mask, WebkitMaskImage: mask }}
          />
        );
      })}
      <div className={`absolute inset-0 from-white/0 to-white/60 ${side === "bottom" ? "bg-linear-to-b" : "bg-linear-to-t"}`} />
    </div>
  );
}

const headline = "Never navigate a shitty UI in your life ever again";

export function Hero() {
  return (
    <>
      <Row className="h-16 sm:h-24" />
      <Row className="px-4 py-2 sm:px-6">
        <p className="enter font-mono text-xs/7 text-gray-950/35">Browser extension · One click · Any site</p>
      </Row>
      <Row className="px-4 py-3 sm:px-6">
        <h1 className="font-serif text-[2.5rem]/[1.12] tracking-[-0.045em] sm:text-[3.5rem]/[1.08]">
          {headline.split(" ").map((word, i) => (
            <span key={i} className="enter inline-block" style={{ "--i": i + 1 } as React.CSSProperties}>
              {word}
              {i < headline.split(" ").length - 1 && "\u00a0"}
            </span>
          ))}
        </h1>
      </Row>
      <Row className="px-4 py-3 sm:px-6">
        <p className="enter text-lg/8 tracking-[0.1px] [--i:11] text-pretty text-gray-950/60">
          One click rebuilds the site you&rsquo;re on in a clean, consistent layout. It keeps
          the page&rsquo;s own text, links, images, tables and forms, and leaves the clutter
          behind. Nothing added, nothing rewritten.
        </p>
      </Row>
    </>
  );
}

// A chevron that slides forward while its tail draws in, becoming an arrow.
function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
      <path
        d="M6.5 4L10.5 8L6.5 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform duration-150 ease-out group-hover:translate-x-[2.5px] group-focus-visible:translate-x-[2.5px] motion-reduce:transition-none"
      />
      <path
        d="M3 8L10 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="origin-right scale-x-0 transition-transform duration-150 ease-out [transform-box:fill-box] group-hover:translate-x-[1.5px] group-hover:scale-x-100 group-focus-visible:translate-x-[1.5px] group-focus-visible:scale-x-100 motion-reduce:transition-none"
      />
    </svg>
  );
}

const button =
  "group inline-flex items-center gap-1.5 rounded-full py-1.5 text-sm/6 transition-[scale,background-color] duration-150 active:scale-[0.97]";

export function Install({
  href = repo,
  examples = "#examples",
}: {
  href?: string;
  examples?: string;
}) {
  return (
    <Row className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 sm:px-6">
      <span className="enter flex flex-wrap gap-2 [--i:12]">
        <a href={href} target="_blank" rel="noopener noreferrer" className={`${button} bg-gray-950 pr-3 pl-4 font-semibold text-white`}>
          Install the extension
          <Arrow />
        </a>
        <a href={examples} className={`${button} bg-gray-950/[0.06] px-4 font-medium text-gray-950 hover:bg-gray-950/10`}>
          See examples
        </a>
      </span>
      <span className="enter font-mono text-xs text-gray-950/45 [--i:13]">Chrome · Edge · Brave · Arc · Dia · Firefox · Safari</span>
    </Row>
  );
}
