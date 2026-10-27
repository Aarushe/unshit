import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Redesign any website — New Internet Society",
  description:
    "Paste a link and read any page again in a calm, typeset layout. Its own words, links, images, tables and forms; nothing added, nothing rewritten.",
};

const view = (url: string) => `/redesign/view?url=${encodeURIComponent(url)}&v=1`;

const examples = [
  { url: "paulgraham.com/greatwork.html", label: "An essay", note: "Long-form text with a proper measure and real headings." },
  { url: "news.ycombinator.com", label: "A link list", note: "Dense rows of links, sorted into something you can scan." },
  { url: "en.wikipedia.org/wiki/Hypertext", label: "An encyclopedia entry", note: "Sections, references, tables and figures, all kept." },
  { url: "httpbin.org/forms/post", label: "A form", note: "Fields, radios and checkboxes in clean, framed inputs." },
  { url: "stripe.com", label: "A product site", note: "A busy marketing page, calmed down to what it says." },
];

const steps = [
  ["Paste a link", "Any public page: an article, a docs page, a forum thread, a form."],
  ["We read it", "Text, links, images, tables, forms and pop-up content are pulled out of the page as they are."],
  ["Read it again", "The same content, set in our layout: serif headings, a quiet palette and room to breathe."],
];

const keeps = ["Every word, in its order", "Links and image-only links", "Images and figures", "Tables and lists", "Forms and fields", "Pop-up and menu content"];
const never = ["Summaries or rewrites", "Added copy or ads", "Trackers and autoplay", "All-caps shouting"];

export default function Land() {
  return (
    <div className="min-h-dvh overflow-x-clip font-display">
      <header className="border-b border-gray-950/5">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[17px]/5 tracking-[-0.3px]">
            New Internet Society
          </Link>
          <nav className="flex items-center gap-5 text-sm/6 text-gray-950/55">
            <a href="#examples" className="hover:text-gray-950">Examples</a>
            <a href="#how" className="hover:text-gray-950">How it works</a>
            <a href="#extension" className="hidden hover:text-gray-950 sm:inline">Extension</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl border-x border-gray-950/5">
        {/* Hero */}
        <section id="top" className="scroll-mt-14">
          <div className="hatch h-12 sm:h-20" />
          <div className="border-t border-gray-950/5 px-4 py-2 sm:px-6">
            <p className="font-mono text-xs/7 text-gray-950/35">paste a link · read it again</p>
          </div>
          <div className="border-t border-gray-950/5 px-4 py-4 sm:px-6">
            <h1 className="max-w-3xl font-serif text-[2.75rem]/[1.08] tracking-[-0.045em] text-balance sm:text-[4.5rem]/[1.05] lg:text-[5.25rem]/[1.02]">
              The web you already read, set beautifully.
            </h1>
          </div>
          <div className="border-t border-gray-950/5 px-4 py-4 sm:px-6">
            <p className="max-w-2xl text-lg/8 tracking-[0.1px] text-gray-950/60">
              Paste any website and we&rsquo;ll redesign it on the spot. Same words, links, images,
              tables and forms, in a calm, typeset layout. Nothing added, nothing rewritten.
            </p>
          </div>

          <div className="border-t border-gray-950/5 p-2 sm:p-4">
            <form
              action="/redesign/view"
              className="rounded-2xl bg-gray-950/[0.025] p-1.5 ring-1 ring-gray-950/5 ring-inset"
            >
              <input type="hidden" name="v" value="1" />
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-stretch">
                <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-white px-4 py-4 shadow-xs ring-1 ring-gray-950/5 focus-within:ring-gray-950/25">
                  <span className="shrink-0 font-mono text-sm text-gray-400">https://</span>
                  <input
                    name="url"
                    required
                    autoFocus
                    placeholder="any-website.com/page"
                    inputMode="url"
                    autoComplete="url"
                    aria-label="Website URL"
                    className="min-w-0 flex-1 bg-transparent font-mono text-base text-gray-950 placeholder:text-gray-400 focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-xl bg-gray-950 px-6 py-4 text-[0.9375rem]/6 font-semibold text-white shadow-xs transition-colors hover:bg-gray-800 sm:py-0"
                >
                  Redesign it &rarr;
                </button>
              </div>
            </form>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-gray-950/5 px-4 py-3 sm:px-6">
            <span className="text-sm/6 text-gray-950/45">Or try</span>
            {examples.slice(0, 3).map((e) => (
              <Link
                key={e.url}
                href={view(e.url)}
                className="rounded-md bg-gray-950/[0.04] px-2 py-1 font-mono text-xs text-gray-700 ring-1 ring-gray-950/5 ring-inset transition-colors hover:bg-gray-950/[0.07] hover:text-gray-950"
              >
                {e.url}
              </Link>
            ))}
          </div>
        </section>

        {/* Examples */}
        <section id="examples" className="scroll-mt-14 border-t border-gray-950/5">
          <div className="hatch h-10 sm:h-14" />
          <div className="border-t border-gray-950/5 px-4 py-4 sm:px-6">
            <p className="text-sm/6 text-gray-950/55">Examples</p>
            <h2 className="mt-1 font-serif text-[2.125rem]/[1.15] tracking-[-0.035em] sm:text-[2.75rem]/[1.12]">
              See it on a few real pages
            </h2>
          </div>
          <div className="grid border-t border-gray-950/5 sm:grid-cols-2 lg:grid-cols-3">
            {examples.map((e) => (
              <Link
                key={e.url}
                href={view(e.url)}
                className="group flex flex-col gap-3 border-b border-gray-950/5 p-4 transition-colors hover:bg-gray-950/[0.02] sm:border-r sm:p-6"
              >
                <div className="rounded-xl bg-gray-950/[0.025] p-1 ring-1 ring-gray-950/5 ring-inset">
                  <div className="rounded-lg bg-white shadow-xs ring-1 ring-gray-950/5">
                    <div className="flex items-center gap-1.5 border-b border-gray-950/5 px-3 py-2">
                      <span className="size-2 rounded-full bg-gray-950/10" />
                      <span className="size-2 rounded-full bg-gray-950/10" />
                      <span className="size-2 rounded-full bg-gray-950/10" />
                      <span className="ml-2 truncate font-mono text-[0.6875rem] text-gray-500">{e.url}</span>
                    </div>
                    <div className="space-y-2 px-4 py-4">
                      <div className="font-serif text-lg/6 tracking-[-0.015em]">{e.label}</div>
                      <div className="h-1.5 w-full rounded-full bg-gray-950/[0.06]" />
                      <div className="h-1.5 w-5/6 rounded-full bg-gray-950/[0.06]" />
                      <div className="h-1.5 w-2/3 rounded-full bg-gray-950/[0.06]" />
                    </div>
                  </div>
                </div>
                <p className="text-[0.9375rem]/[1.6] tracking-[0.1px] text-gray-950/60">{e.note}</p>
                <span className="mt-auto text-sm/6 font-medium text-gray-950">
                  Redesign {e.url.split("/")[0]}{" "}
                  <span className="inline-block transition-transform group-hover:translate-x-0.5">&rarr;</span>
                </span>
              </Link>
            ))}
            <div className="hatch hidden border-b border-gray-950/5 lg:block" />
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-14">
          <div className="hatch h-10 sm:h-14" />
          <div className="border-t border-gray-950/5 px-4 py-4 sm:px-6">
            <p className="text-sm/6 text-gray-950/55">How it works</p>
            <h2 className="mt-1 font-serif text-[2.125rem]/[1.15] tracking-[-0.035em] sm:text-[2.75rem]/[1.12]">
              A redesign, not a rewrite
            </h2>
          </div>
          <ol className="grid border-t border-gray-950/5 sm:grid-cols-3">
            {steps.map(([title, body], i) => (
              <li key={title} className="border-b border-gray-950/5 p-4 sm:border-r sm:border-b-0 sm:p-6 sm:last:border-r-0">
                <span className="font-mono text-xs/6 text-gray-950/35">0{i + 1}</span>
                <h3 className="mt-2 font-serif text-2xl/8 tracking-[-0.02em]">{title}</h3>
                <p className="mt-2 text-base/[1.625] tracking-[0.1px] text-gray-950/60">{body}</p>
              </li>
            ))}
          </ol>
          <div className="grid border-t border-gray-950/5 sm:grid-cols-2">
            <div className="border-b border-gray-950/5 p-4 sm:border-r sm:border-b-0 sm:p-6">
              <h3 className="font-serif text-xl/7 tracking-[-0.015em]">What it keeps</h3>
              <ul className="mt-3 space-y-1.5 text-[0.9375rem]/6 text-gray-950/65">
                {keeps.map((k) => (
                  <li key={k} className="flex gap-2.5">
                    <span className="text-gray-950">&#10003;</span>
                    {k}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 sm:p-6">
              <h3 className="font-serif text-xl/7 tracking-[-0.015em]">What it never does</h3>
              <ul className="mt-3 space-y-1.5 text-[0.9375rem]/6 text-gray-950/65">
                {never.map((k) => (
                  <li key={k} className="flex gap-2.5">
                    <span className="text-gray-950/35">&times;</span>
                    {k}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Extension */}
        <section id="extension" className="scroll-mt-14">
          <div className="hatch h-10 border-t border-gray-950/5 sm:h-14" />
          <div className="flex flex-col gap-6 border-t border-gray-950/5 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-10">
            <div className="max-w-xl">
              <p className="text-sm/6 text-gray-950/55">Browser extension</p>
              <h2 className="mt-1 font-serif text-[2.125rem]/[1.15] tracking-[-0.035em] sm:text-[2.75rem]/[1.12]">
                Or redesign the page you&rsquo;re on, in one click
              </h2>
              <p className="mt-3 text-base/[1.625] tracking-[0.1px] text-gray-950/60">
                The extension restyles the live page in place, so logins, menus, pop-ups and
                payments keep working. Chrome, Edge, Brave, Arc, Firefox and Safari.
              </p>
            </div>
            <a
              href="#top"
              className="shrink-0 self-start rounded-full bg-gray-950 px-4 py-1.5 text-sm/6 font-semibold text-white transition-colors hover:bg-gray-800 sm:self-end"
            >
              Try a link first &uarr;
            </a>
          </div>
        </section>

        <div className="hatch h-16 border-t border-gray-950/5" />
      </main>

      <footer className="border-t border-gray-950/5">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm/6 text-gray-950/55 sm:px-6">
          <span>New Internet Society</span>
          <span>
            Made by{" "}
            <a
              href="https://x.com/aarushe_reddy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-950 underline decoration-gray-950/20 underline-offset-4 transition-colors hover:decoration-gray-950"
            >
              Aarushe Reddy
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
