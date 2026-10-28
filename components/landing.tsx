import Link from "next/link";

const examples = ["paulgraham.com/greatwork.html", "news.ycombinator.com", "en.wikipedia.org/wiki/Hypertext", "httpbin.org/forms/post", "stripe.com"];

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
          <a
            href="https://x.com/aarushe_reddy"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-gray-500 transition-colors hover:text-gray-950"
          >
            by @aarushe_reddy
          </a>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {children}
        <div className="flex flex-1 flex-col border-t border-gray-950/5">
          <div className="hatch mx-auto min-h-24 w-full max-w-3xl flex-1 border-x border-gray-950/5" />
        </div>
      </main>
    </div>
  );
}

export function Hero() {
  return (
    <>
      <Row className="h-16 sm:h-24" />
      <Row className="px-4 py-2 sm:px-6">
        <p className="font-mono text-xs/7 text-gray-950/35">paste a link · pick a voice · read it again</p>
      </Row>
      <Row className="px-4 py-3 sm:px-6">
        <h1 className="font-serif text-[2.5rem]/[1.12] tracking-[-0.045em] sm:text-[3.5rem]/[1.08]">
          Never navigate a shitty UI in your life ever again
        </h1>
      </Row>
      <Row className="px-4 py-3 sm:px-6">
        <p className="text-lg/8 tracking-[0.1px] text-pretty text-gray-950/60">
          Paste any link and read it in one clean, consistent layout. We pull out the
          page&rsquo;s own text, links, images, tables and forms, and leave the clutter
          behind. Nothing added, nothing rewritten.
        </p>
      </Row>
    </>
  );
}

export function UrlForm({ id }: { id?: string }) {
  return (
    <Row id={id} className="p-2 sm:p-4">
      <form
        action="/redesign/view"
        className="rounded-2xl bg-gray-950/[0.025] p-1.5 ring-1 ring-gray-950/5 ring-inset"
      >
        <div className="flex flex-col gap-1.5">
          <div className="rounded-xl bg-white shadow-xs ring-1 ring-gray-950/5">
            <div className="flex items-center justify-between border-b border-gray-950/5 px-4 py-2.5">
              <span className="font-mono text-xs/5 text-gray-950">
                redesign.txt <span className="text-gray-400">· any public page</span>
              </span>
              <div className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-gray-950/10" />
                <span className="size-2.5 rounded-full bg-gray-950/10" />
                <span className="size-2.5 rounded-full bg-gray-950/10" />
              </div>
            </div>
            <label className="flex items-center px-4 py-4">
              <span className="font-mono text-[0.9375rem] text-gray-400">https://</span>
              <input
                name="url"
                required
                autoFocus
                placeholder="example.com"
                inputMode="url"
                autoComplete="url"
                className="min-w-0 flex-1 bg-transparent font-mono text-[0.9375rem] text-gray-950 placeholder:text-gray-400 focus:outline-none"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-xs ring-1 ring-gray-950/5">
            <fieldset className="flex rounded-full bg-gray-950/5 p-0.5 text-sm/6">
              <legend className="sr-only">Design</legend>
              {[
                ["0", "Sans", "font-sans"],
                ["1", "Serif", "font-serif text-[0.9375rem]"],
              ].map(([value, label, font], i) => (
                <label key={value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="v"
                    value={value}
                    defaultChecked={i === 1}
                    className="peer sr-only"
                  />
                  <span
                    className={`block rounded-full px-3 py-0.5 text-gray-500 peer-checked:bg-white peer-checked:text-gray-950 peer-checked:shadow-xs peer-checked:ring-1 peer-checked:ring-gray-950/5 peer-focus-visible:outline-2 ${font}`}
                  >
                    {label}
                  </span>
                </label>
              ))}
            </fieldset>
            <button
              type="submit"
              className="rounded-full bg-gray-950 px-4 py-1.5 text-sm/6 font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Redesign
            </button>
          </div>
        </div>
      </form>
    </Row>
  );
}

export function Examples() {
  return (
    <Row className="px-4 py-5 sm:px-6">
      <p className="text-sm/6 text-gray-950/55">Try one</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {examples.map((e) => (
          <Link
            key={e}
            href={`/redesign/view?url=${encodeURIComponent(e)}&v=1`}
            className="rounded-md bg-gray-950/[0.04] px-2 py-1 font-mono text-xs text-gray-700 ring-1 ring-gray-950/5 ring-inset transition-colors hover:bg-gray-950/[0.07] hover:text-gray-950"
          >
            {e}
          </Link>
        ))}
      </div>
    </Row>
  );
}
