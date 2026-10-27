import Link from "next/link";
import {
  charter,
  events,
  faqs,
  principles,
  programs,
  site,
} from "@/lib/content";

// Version 0 — utility-docs language: Inter + Plex Mono, hairline grid rails,
// double-framed panels, hatched placeholders. Light, near-monochrome.

export default function Home() {
  return (
    <div className="overflow-x-clip">
      <Header />
      <main>
        <Hero />
        <Stats />
        <Principles />
        <Programs />
        <Events />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Layout primitives
 * ------------------------------------------------------------------------- */

function Rail({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="border-t border-gray-950/5 first:border-t-0">
      <div
        className={`mx-auto max-w-6xl border-x border-gray-950/5 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs/6 font-medium tracking-widest text-gray-500 uppercase">
      {children}
    </p>
  );
}

function Annotation({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t border-gray-950/5">
      <div className="mx-auto max-w-6xl border-x border-gray-950/5 px-4 sm:px-6">
        <p className="font-mono text-xs/7 whitespace-pre text-gray-950/35">
          {children}
        </p>
      </div>
    </div>
  );
}

/** Outer tinted frame with one or more stacked inner panels. */
function Frame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-gray-950/[0.025] p-1.5 ring-1 ring-gray-950/5 ring-inset ${className}`}
    >
      <div className="flex h-full flex-col gap-1.5">{children}</div>
    </div>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl bg-white shadow-xs ring-1 ring-gray-950/5 ${className}`}
    >
      {children}
    </div>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden>
      <rect width="24" height="24" rx="6" className="fill-gray-950" />
      <circle cx="12" cy="12" r="6" className="stroke-white" strokeWidth="1.5" />
      <ellipse
        cx="12"
        cy="12"
        rx="2.5"
        ry="6"
        className="stroke-white"
        strokeWidth="1.5"
      />
      <path d="M6 12h12" className="stroke-white" strokeWidth="1.5" />
    </svg>
  );
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={`size-4 ${className}`}
      aria-hidden
    >
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ----------------------------------------------------------------------------
 * Header
 * ------------------------------------------------------------------------- */

function Header() {
  const nav = [
    ["Principles", "#principles"],
    ["Programs", "#programs"],
    ["Events", "#events"],
    ["FAQ", "#faq"],
  ];
  return (
    <header className="sticky top-0 z-20 border-b border-gray-950/5 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-sm font-semibold tracking-tight">
              New Internet Society
            </span>
          </Link>
          <span className="hidden rounded-full bg-gray-950/5 px-2 font-mono text-[0.6875rem]/5 font-medium text-gray-600 sm:inline">
            cohort 05
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <div className="hidden items-center gap-6 md:flex">
            {nav.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="text-sm/6 text-gray-600 transition-colors hover:text-gray-950"
              >
                {label}
              </a>
            ))}
          </div>
          <a
            href="#apply"
            className="rounded-full bg-gray-950 px-3.5 py-1 text-sm/6 font-semibold text-white transition-colors hover:bg-gray-800"
          >
            Apply
          </a>
        </nav>
      </div>
    </header>
  );
}

/* ----------------------------------------------------------------------------
 * Hero
 * ------------------------------------------------------------------------- */

function Hero() {
  return (
    <section>
      <div className="h-10 sm:h-16" />
      <Annotation>{"est. 2024   ·   members-only   ·   free"}</Annotation>
      <Rail className="px-4 py-2 sm:px-6">
        <h1 className="max-w-5xl text-[2.75rem]/[1] font-normal tracking-[-0.05em] text-balance sm:text-7xl/[1] lg:text-8xl/[1]">
          The internet is still being written.
        </h1>
      </Rail>
      <Annotation>{"h1  ·  for the people building the next draft"}</Annotation>
      <Rail className="px-4 py-3 sm:px-6">
        <p className="max-w-2xl text-lg/8 text-gray-600">
          {site.tagline.replace(".", "")}, with things like{" "}
          <Mono>personal sites</Mono>, <Mono>open protocols</Mono> and{" "}
          <Mono>community archives</Mono>. We meet, make things in public, and
          fund the corners nobody else will.
        </p>
      </Rail>
      <Rail className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
        <a
          href="#apply"
          className="rounded-full bg-gray-950 px-4 py-2 text-sm/6 font-semibold text-white transition-colors hover:bg-gray-800"
        >
          Apply for membership
        </a>
        <form className="flex w-full items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-gray-950/10 sm:w-72 focus-within:ring-gray-950/25">
          <input
            type="email"
            placeholder="Get the monthly letter"
            className="min-w-0 flex-1 bg-transparent text-sm/6 text-gray-950 placeholder:text-gray-500 focus:outline-none"
          />
          <kbd className="font-sans text-xs/4 text-gray-400">↵</kbd>
        </form>
      </Rail>
      <Rail className="p-2 sm:p-4">
        <HeroShowcase />
      </Rail>
      <div className="h-px border-t border-gray-950/5" />
    </section>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[0.9em] font-medium text-gray-950">
      {children}
    </code>
  );
}

function HeroShowcase() {
  return (
    <Frame>
      <div className="grid gap-1.5 lg:grid-cols-[1.15fr_1fr]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-950/5 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs/5 text-gray-950">
                charter.txt
              </span>
              <span className="font-mono text-xs/5 text-gray-400">
                · signed by 412
              </span>
            </div>
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-gray-950/10" />
              <span className="size-2.5 rounded-full bg-gray-950/10" />
              <span className="size-2.5 rounded-full bg-gray-950/10" />
            </div>
          </div>
          <ol className="py-4 font-mono text-[0.8125rem]/7">
            {charter.map((line, i) => {
              const active = i === 4;
              return (
                <li
                  key={i}
                  className={`flex border-l-2 pr-4 ${
                    active
                      ? "border-gray-950 bg-gray-950/[0.04]"
                      : "border-transparent"
                  }`}
                >
                  <span className="w-12 shrink-0 pr-4 text-right text-gray-950/25 select-none">
                    {i + 1}
                  </span>
                  <span className={active ? "text-gray-950" : "text-gray-600"}>
                    {line}
                  </span>
                </li>
              );
            })}
            <li className="flex border-l-2 border-transparent pr-4">
              <span className="w-12 shrink-0 pr-4 text-right text-gray-950/25 select-none">
                {charter.length + 1}
              </span>
              <span className="text-gray-400">
                — <span className="animate-pulse text-gray-950">▍</span>
              </span>
            </li>
          </ol>
        </Panel>
        <Panel className="hatch flex items-center justify-center p-6 sm:p-10">
          <MemberCard />
        </Panel>
      </div>
      <Panel className="px-4 py-3">
        <p className="font-mono text-[0.8125rem]/6 text-gray-500">
          <span className="text-gray-400">$ </span>
          <span className="text-gray-950">nis join</span>{" "}
          <span className="rounded bg-gray-950/5 px-1 py-0.5 text-gray-950">
            --site ada.garden
          </span>{" "}
          --building &quot;a reading list that never ends&quot;
        </p>
      </Panel>
    </Frame>
  );
}

function MemberCard() {
  return (
    <div className="w-full max-w-xs rounded-xl bg-white p-5 shadow-lg ring-1 shadow-gray-950/5 ring-gray-950/10">
      <div className="flex items-start justify-between">
        <div className="flex size-11 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-950 ring-1 ring-gray-950/5">
          AM
        </div>
        <span className="font-mono text-[0.6875rem]/5 text-gray-400">
          #0412
        </span>
      </div>
      <p className="mt-4 text-base/6 font-semibold tracking-tight">
        Ada Moreno
      </p>
      <p className="text-sm/6 text-gray-500">
        Archivist · Lisbon ·{" "}
        <span className="text-gray-950 underline decoration-gray-950/20 underline-offset-2">
          ada.garden
        </span>
      </p>
      <p className="mt-4 text-sm/6 text-gray-600">
        Building a reading list that never ends, and a tiny tool to share it
        over RSS.
      </p>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {["Fellow ’26", "Salon host", "Grantee"].map((t) => (
          <span
            key={t}
            className="rounded-full bg-gray-950/5 px-2 py-0.5 text-xs/5 font-medium text-gray-700"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Stats
 * ------------------------------------------------------------------------- */

function Stats() {
  return (
    <Rail className="grid grid-cols-3 divide-x divide-gray-950/5">
      {site.stats.map((s) => (
        <div key={s.label} className="px-4 py-8 sm:px-6 sm:py-10">
          <p className="text-3xl/none font-medium tracking-tighter tabular-nums sm:text-5xl/none">
            {s.value}
          </p>
          <p className="mt-3 font-mono text-xs/5 text-gray-500">{s.label}</p>
        </div>
      ))}
    </Rail>
  );
}

/* ----------------------------------------------------------------------------
 * Principles
 * ------------------------------------------------------------------------- */

function SectionHead({
  id,
  eyebrow,
  title,
  body,
}: {
  id: string;
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <>
      <div id={id} className="h-16 scroll-mt-14 border-t border-gray-950/5 sm:h-24" />
      <Rail className="px-4 py-3 sm:px-6">
        <Eyebrow>{eyebrow}</Eyebrow>
      </Rail>
      <Rail className="px-4 py-2 sm:px-6">
        <h2 className="max-w-3xl text-3xl/[1.1] font-medium tracking-tighter text-balance sm:text-[2.5rem]/[1.05]">
          {title}
        </h2>
      </Rail>
      {body && (
        <Rail className="px-4 py-3 sm:px-6">
          <p className="max-w-2xl text-base/7 text-gray-600">{body}</p>
        </Rail>
      )}
    </>
  );
}

const placements = [
  "place-items-start",
  "place-items-center",
  "place-items-end",
  "items-end justify-items-start",
  "items-start justify-items-end",
  "items-end justify-items-center",
];

function Principles() {
  return (
    <section>
      <SectionHead
        id="principles"
        eyebrow="Principles"
        title="Six things we believe about the web."
        body="Not rules, more like defaults. Everything we fund, host and build starts from here."
      />
      <Rail className="mt-6 border-t border-gray-950/5">
        <div className="grid gap-px bg-gray-950/5 sm:grid-cols-2 lg:grid-cols-3">
          {principles.map((p, i) => (
            <div key={p.id} className="bg-white p-4 sm:p-6">
              <div
                className={`hatch grid h-32 rounded-lg p-0 ring-1 ring-gray-950/5 ${placements[i]}`}
              >
                <div
                  className="flex size-14 items-center justify-center rounded-lg bg-gray-950 font-mono text-sm font-medium text-white shadow-sm"
                >
                  {p.id}
                </div>
              </div>
              <h3 className="mt-6 text-base/7 font-semibold tracking-tight">
                {p.title}
              </h3>
              <p className="mt-1 text-sm/6 text-gray-600">{p.body}</p>
            </div>
          ))}
        </div>
      </Rail>
    </section>
  );
}

/* ----------------------------------------------------------------------------
 * Programs
 * ------------------------------------------------------------------------- */

function Programs() {
  return (
    <section>
      <SectionHead
        id="programs"
        eyebrow="Programs"
        title="Ways to take part, from one dinner to twelve weeks."
      />
      <Rail className="mt-6 border-t border-gray-950/5 p-2 sm:p-4">
        <div className="grid gap-2 sm:gap-4 md:grid-cols-2">
          {programs.map((p) => (
            <Frame key={p.slug}>
              <Panel className="hatch flex h-48 items-center justify-center overflow-hidden">
                <ProgramVisual slug={p.slug} />
              </Panel>
              <Panel className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-xl/7 font-semibold tracking-tight">
                    {p.name}
                  </h3>
                  <span className="font-mono text-xs/5 text-gray-500">
                    {p.kind}
                  </span>
                </div>
                <p className="mt-2 text-sm/6 text-gray-600">{p.body}</p>
                <div className="mt-auto flex items-center justify-between gap-4 pt-6">
                  <div className="flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-gray-950/[0.04] px-1.5 py-0.5 font-mono text-[0.6875rem]/5 text-gray-600 ring-1 ring-gray-950/5 ring-inset"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <a
                    href="#apply"
                    className="group flex items-center gap-0.5 text-sm/6 font-semibold text-gray-950"
                  >
                    Learn more
                    <Arrow className="transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
              </Panel>
            </Frame>
          ))}
        </div>
      </Rail>
    </section>
  );
}

function ProgramVisual({ slug }: { slug: string }) {
  if (slug === "fellowship") {
    return (
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/10">
        <div className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className={`flex size-8 items-center justify-center rounded-md font-mono text-[0.625rem] ${
                i < 8
                  ? "bg-gray-950 text-white"
                  : "bg-gray-950/5 text-gray-400"
              }`}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-[0.6875rem] text-gray-500">
          week 08 of 12 · demo night in 4
        </p>
      </div>
    );
  }
  if (slug === "salons") {
    return (
      <div className="relative">
        <div className="flex justify-center gap-3 pb-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="size-6 rounded-full bg-white ring-1 ring-gray-950/15"
            />
          ))}
        </div>
        <div className="flex h-12 w-64 items-center justify-center rounded-lg bg-white font-mono text-[0.6875rem] text-gray-500 shadow-sm ring-1 ring-gray-950/10">
          “what is a homepage for?”
        </div>
        <div className="flex justify-center gap-3 pt-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`size-6 rounded-full ring-1 ${
                i === 2
                  ? "bg-gray-950 ring-gray-950"
                  : "bg-white ring-gray-950/15"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }
  if (slug === "grants") {
    return (
      <div className="w-64 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/10">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[0.6875rem] text-gray-500">
            grant #118
          </span>
          <span className="rounded-full bg-gray-950/5 px-1.5 font-mono text-[0.625rem]/4 text-gray-600">
            approved
          </span>
        </div>
        <p className="mt-2 text-2xl font-medium tracking-tighter tabular-nums">
          $4,800
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-950/5">
          <div className="h-full w-3/5 rounded-full bg-gray-950" />
        </div>
        <p className="mt-2 font-mono text-[0.6875rem] text-gray-500">
          decided in 9 days
        </p>
      </div>
    );
  }
  return (
    <div className="w-64 divide-y divide-gray-950/5 rounded-xl bg-white shadow-sm ring-1 ring-gray-950/10">
      {[
        ["homepage-starter", "html"],
        ["on-slowness.md", "essay"],
        ["tiny-rss", "tool"],
      ].map(([name, kind]) => (
        <div
          key={name}
          className="flex items-center justify-between px-3 py-2 font-mono text-[0.6875rem]"
        >
          <span className="text-gray-950">{name}</span>
          <span className="text-gray-400">{kind}</span>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Events
 * ------------------------------------------------------------------------- */

function Events() {
  return (
    <section>
      <SectionHead
        id="events"
        eyebrow="Upcoming"
        title="Salons, demos and workshops."
        body="Most events are hosted by members in their own cities. Anyone can come to their first one."
      />
      <Rail className="mt-6 border-t border-gray-950/5 p-2 sm:p-4">
        <Frame>
          <Panel className="divide-y divide-gray-950/5 overflow-hidden">
            {events.map((e) => (
              <a
                key={e.title}
                href="#apply"
                className="group grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-gray-950/[0.02] sm:grid-cols-[6rem_1fr_8rem_6rem_1rem] sm:px-6"
              >
                <span className="font-mono text-xs/6 text-gray-500 tabular-nums">
                  {e.date}
                </span>
                <span className="text-sm/6 font-medium text-gray-950">
                  {e.title}
                </span>
                <span className="hidden text-sm/6 text-gray-500 sm:block">
                  {e.city}
                </span>
                <span className="justify-self-end sm:justify-self-start">
                  <span className="rounded-md bg-gray-950/[0.04] px-1.5 py-0.5 font-mono text-[0.6875rem]/5 text-gray-600 ring-1 ring-gray-950/5 ring-inset">
                    {e.type.toLowerCase()}
                  </span>
                </span>
                <Arrow className="hidden text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-950 sm:block" />
              </a>
            ))}
          </Panel>
        </Frame>
      </Rail>
    </section>
  );
}

/* ----------------------------------------------------------------------------
 * FAQ
 * ------------------------------------------------------------------------- */

function Faq() {
  return (
    <section>
      <div id="faq" className="h-16 scroll-mt-14 border-t border-gray-950/5 sm:h-24" />
      <Rail className="grid gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_2fr]">
        <div>
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mt-3 text-3xl/[1.1] font-medium tracking-tighter sm:text-[2.5rem]/[1.05]">
            Questions, answered.
          </h2>
        </div>
        <div className="divide-y divide-gray-950/5 border-y border-gray-950/5">
          {faqs.map((f, i) => (
            <details key={f.q} className="group" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-base/7 font-medium [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="relative size-3.5 shrink-0 text-gray-400">
                  <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
                  <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current transition-transform group-open:scale-y-0" />
                </span>
              </summary>
              <p className="max-w-xl pb-5 text-sm/6 text-gray-600">{f.a}</p>
            </details>
          ))}
        </div>
      </Rail>
    </section>
  );
}

/* ----------------------------------------------------------------------------
 * CTA + footer
 * ------------------------------------------------------------------------- */

function Cta() {
  return (
    <section id="apply" className="scroll-mt-14">
      <div className="h-16 border-t border-gray-950/5 sm:h-24" />
      <Rail className="hatch px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl/[1.05] font-medium tracking-tighter text-balance sm:text-6xl/[1]">
            Come build the next draft with us.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base/7 text-gray-600">
            Tell us what you&apos;re making. A member reads every application
            and replies within two weeks.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#apply"
              className="rounded-full bg-gray-950 px-4 py-2 text-sm/6 font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Apply for membership
            </a>
            <a
              href="#principles"
              className="rounded-full bg-white px-4 py-2 text-sm/6 font-semibold text-gray-950 ring-1 ring-gray-950/10 transition-colors hover:bg-gray-50"
            >
              Read the principles
            </a>
          </div>
        </div>
      </Rail>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-950/5">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 border-x border-gray-950/5 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-sm font-semibold tracking-tight">
            New Internet Society
          </span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs/6 text-gray-500">
          <a href="#" className="hover:text-gray-950">rss</a>
          <a href="#" className="hover:text-gray-950">charter</a>
          <a href="#" className="hover:text-gray-950">code of conduct</a>
          <Link href="/1" className="hover:text-gray-950">v1 →</Link>
        </div>
      </div>
      <div className="border-t border-gray-950/5">
        <div className="mx-auto h-10 max-w-6xl border-x border-gray-950/5" />
      </div>
    </footer>
  );
}
