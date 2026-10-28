import Link from "next/link";

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
      <header className="border-b border-gray-950/5">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between border-x border-gray-950/5 px-4 sm:px-6">
          <Link href="/" className="text-[17px]/5 tracking-[-0.3px]">
            New Internet Society
          </Link>
          <p className="text-sm/6 text-gray-950/55">
            Made by{" "}
            <a href="https://x.com/aarushe_reddy" target="_blank" rel="noreferrer" className="text-gray-950 hover:underline">
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
      </main>
      <BottomBlur />
    </div>
  );
}

// Layers of increasing blur, each masked to a band that overlaps the next, so
// the page softens gradually toward the bottom edge instead of in one step.
const blurs = [0.5, 1, 2, 4, 8, 16];

function BottomBlur() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 z-10 h-24">
      {blurs.map((px, i) => {
        const at = (n: number) => `${Math.min(Math.max(n, 0), 1) * 100}%`;
        const step = 1 / blurs.length;
        const mask = `linear-gradient(to bottom, transparent ${at(i * step - step)}, black ${at(i * step)}, black ${at(i * step + step)}, transparent ${at(i * step + 2 * step)})`;
        return (
          <div
            key={px}
            className="absolute inset-0"
            style={{ backdropFilter: `blur(${px}px)`, WebkitBackdropFilter: `blur(${px}px)`, maskImage: mask, WebkitMaskImage: mask }}
          />
        );
      })}
      <div className="absolute inset-0 bg-linear-to-b from-white/0 to-white/60" />
    </div>
  );
}

export function Hero() {
  return (
    <>
      <Row className="h-16 sm:h-24" />
      <Row className="px-4 py-2 sm:px-6">
        <p className="font-mono text-xs/7 text-gray-950/35">a browser extension · one click · any site</p>
      </Row>
      <Row className="px-4 py-3 sm:px-6">
        <h1 className="font-serif text-[2.5rem]/[1.12] tracking-[-0.045em] sm:text-[3.5rem]/[1.08]">
          Never navigate a shitty UI in your life ever again
        </h1>
      </Row>
      <Row className="px-4 py-3 sm:px-6">
        <p className="text-lg/8 tracking-[0.1px] text-pretty text-gray-950/60">
          One click rebuilds the site you&rsquo;re on in a clean, consistent layout. It keeps
          the page&rsquo;s own text, links, images, tables and forms, and leaves the clutter
          behind. Nothing added, nothing rewritten.
        </p>
      </Row>
    </>
  );
}

export function Install({ href = `${repo}/tree/main/extension#install` }: { href?: string }) {
  return (
    <Row className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 sm:px-6">
      <a
        href={href}
        className="rounded-full bg-gray-950 px-4 py-1.5 text-sm/6 font-semibold text-white transition-colors hover:bg-gray-800"
      >
        Install the extension
      </a>
      <span className="font-mono text-xs text-gray-950/45">Chrome · Edge · Brave · Arc · Firefox · Safari</span>
    </Row>
  );
}
