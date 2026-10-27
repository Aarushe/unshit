import Link from "next/link";
import type { SiteContent, SiteLinks } from "@/lib/schema";

// One layout — hairline rails, framed panels, hatched placeholders — rendered
// in two typographic voices:
//   v0  Inter + Plex Mono
//   v1  LT Superior Serif headings, Inter Display text, stacked "file" cards

export type Variant = "v0" | "v1";

const type = {
  v0: {
    root: "font-sans",
    name: "text-sm font-semibold tracking-tight",
    h1: "text-[2.75rem]/[1] font-normal tracking-[-0.05em] sm:text-7xl/[1] lg:text-8xl/[1]",
    h2: "text-3xl/[1.1] font-medium tracking-tighter sm:text-[2.5rem]/[1.05]",
    ctaTitle: "text-4xl/[1.05] font-medium tracking-tighter sm:text-6xl/[1]",
    cellTitle: "text-base/7 font-semibold tracking-tight",
    cardTitle: "text-xl/7 font-semibold tracking-tight",
    stat: "text-3xl/none font-medium tracking-tighter sm:text-5xl/none",
    eventTitle: "text-sm/6 font-medium",
    question: "text-base/7 font-medium",
    eyebrow: "font-mono text-xs/6 font-medium tracking-widest text-gray-500 uppercase",
    lead: "text-lg/8 text-gray-600",
    body: "text-base/7 text-gray-600",
    small: "text-sm/6 text-gray-600",
    spotTitle: "text-base/6 font-semibold tracking-tight",
  },
  v1: {
    root: "font-display",
    name: "text-[17px]/5 tracking-[-0.3px]",
    h1: "font-serif text-[2.625rem]/[1.12] tracking-[-0.045em] sm:text-[4rem]/[1.12] lg:text-[4.75rem]/[1.1]",
    h2: "font-serif text-[2.125rem]/[1.15] tracking-[-0.035em] sm:text-[2.75rem]/[1.12]",
    ctaTitle: "font-serif text-[2.75rem]/[1.1] tracking-[-0.045em] sm:text-[4rem]/[1.08]",
    cellTitle: "font-serif text-2xl/8 tracking-[-0.02em]",
    cardTitle: "font-serif text-[1.875rem]/10 tracking-[-0.02em]",
    stat: "font-serif text-[2.5rem]/none tracking-[-0.04em] sm:text-[3.5rem]/none",
    eventTitle: "font-serif text-xl/7 tracking-[-0.015em]",
    question: "font-serif text-[1.375rem]/8 tracking-[-0.015em]",
    eyebrow: "text-sm/6 text-gray-950/55",
    lead: "text-lg/8 tracking-[0.1px] text-gray-950/60",
    body: "text-base/[1.625] tracking-[0.1px] text-gray-950/60",
    small: "text-[0.9375rem]/[1.65] tracking-[0.1px] text-gray-950/60",
    spotTitle: "font-serif text-[1.375rem]/7 tracking-[-0.015em]",
  },
} satisfies Record<Variant, Record<string, string>>;

type T = (typeof type)[Variant];
type Props = { c: SiteContent; t: T; v: Variant; links: SiteLinks };

export function Site({
  content,
  links,
  variant,
  banner,
}: {
  content: SiteContent;
  links: SiteLinks;
  variant: Variant;
  banner?: React.ReactNode;
}) {
  const p: Props = { c: content, t: type[variant], v: variant, links };
  return (
    <div className={`overflow-x-clip ${p.t.root}`}>
      {banner}
      <Header {...p} />
      <main>
        <Hero {...p} />
        {content.stats.length > 0 && <Stats {...p} />}
        {content.principles.length > 0 && <Principles {...p} />}
        {content.programs.length > 0 && <Programs {...p} />}
        {content.events.length > 0 && <Events {...p} />}
        {content.faqs.length > 0 && <Faq {...p} />}
        <Cta {...p} />
      </main>
      <Footer {...p} />
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
    <div className="border-t border-gray-950/5">
      <div className={`mx-auto max-w-6xl border-x border-gray-950/5 ${className}`}>
        {children}
      </div>
    </div>
  );
}

function Annotation({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t border-gray-950/5">
      <div className="mx-auto max-w-6xl border-x border-gray-950/5 px-4 sm:px-6">
        <p className="truncate font-mono text-xs/7 whitespace-pre text-gray-950/35">
          {children}
        </p>
      </div>
    </div>
  );
}

function Gap({ id }: { id?: string }) {
  return (
    <div id={id} className="h-16 scroll-mt-14 border-t border-gray-950/5 sm:h-24" />
  );
}

/** Outer tinted frame holding stacked inner panels. */
function Frame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl bg-gray-950/[0.025] p-1.5 ring-1 ring-gray-950/5 ring-inset ${className}`}
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
    <div className={`rounded-xl bg-white shadow-xs ring-1 ring-gray-950/5 ${className}`}>
      {children}
    </div>
  );
}

/** The mono "file" strip that heads a panel: `name.txt · note  ● ● ●`. */
function FileBar({ file, note }: { file: string; note?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-950/5 px-4 py-2.5">
      <p className="truncate font-mono text-xs/5">
        <span className="text-gray-950">{file}</span>
        {note && <span className="text-gray-400"> · {note}</span>}
      </p>
      <div className="flex shrink-0 gap-1.5">
        <span className="size-2.5 rounded-full bg-gray-950/10" />
        <span className="size-2.5 rounded-full bg-gray-950/10" />
        <span className="size-2.5 rounded-full bg-gray-950/10" />
      </div>
    </div>
  );
}

/** Floating white card that sits on a hatched panel. */
function Float({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl bg-white shadow-lg ring-1 shadow-gray-950/5 ring-gray-950/10 ${className}`}
    >
      {children}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-gray-950/[0.04] px-1.5 py-0.5 font-mono text-[0.6875rem]/5 text-gray-600 ring-1 ring-gray-950/5 ring-inset">
      {children}
    </span>
  );
}

function Button({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <a
      href={href}
      className={
        secondary
          ? "rounded-full bg-white px-4 py-2 text-sm/6 font-semibold text-gray-950 ring-1 ring-gray-950/10 transition-colors hover:bg-gray-50"
          : "rounded-full bg-gray-950 px-4 py-2 text-sm/6 font-semibold text-white transition-colors hover:bg-gray-800"
      }
    >
      {children}
    </a>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 shrink-0" fill="none" aria-hidden>
      <rect width="24" height="24" rx="6" className="fill-gray-950" />
      <circle cx="12" cy="12" r="6" className="stroke-white" strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="2.5" ry="6" className="stroke-white" strokeWidth="1.5" />
      <path d="M6 12h12" className="stroke-white" strokeWidth="1.5" />
    </svg>
  );
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`size-4 ${className}`} aria-hidden>
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

const pad = (i: number) => String(i + 1).padStart(2, "0");
const fileName = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "file";

/* ----------------------------------------------------------------------------
 * Header
 * ------------------------------------------------------------------------- */

function Header({ c, t, links }: Props) {
  const nav = [
    c.principles.length > 0 && [c.sections.principles.eyebrow, "#principles"],
    c.programs.length > 0 && [c.sections.programs.eyebrow, "#programs"],
    c.events.length > 0 && [c.sections.events.eyebrow, "#events"],
    c.faqs.length > 0 && ["FAQ", "#faq"],
  ].filter(Boolean) as [string, string][];

  return (
    <header className="sticky top-0 z-20 border-b border-gray-950/5 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <a href="#" className="flex min-w-0 items-center gap-2.5">
            <Logo />
            <span className={`truncate ${t.name}`}>{c.name}</span>
          </a>
          {c.label && (
            <span className="hidden shrink-0 rounded-full bg-gray-950/5 px-2 font-mono text-[0.6875rem]/5 font-medium text-gray-600 sm:inline">
              {c.label}
            </span>
          )}
        </div>
        <nav className="flex shrink-0 items-center gap-6">
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
            href={links.action}
            className="rounded-full bg-gray-950 px-3.5 py-1 text-sm/6 font-semibold text-white transition-colors hover:bg-gray-800"
          >
            {c.cta.primary.split(" ")[0]}
          </a>
        </nav>
      </div>
    </header>
  );
}

/* ----------------------------------------------------------------------------
 * Hero
 * ------------------------------------------------------------------------- */

function Hero(p: Props) {
  const { c, t, v, links } = p;
  return (
    <section>
      <div className="h-10 sm:h-16" />
      <Annotation>{c.meta.join("   ·   ")}</Annotation>
      <Rail className="px-4 py-2 sm:px-6">
        {v === "v1" && c.badge && (
          <p className="flex items-center gap-2 pt-2 pb-4 text-sm/5 text-gray-950/55">
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-gray-950/30" />
              <span className="relative size-2 rounded-full bg-gray-950" />
            </span>
            {c.badge}
          </p>
        )}
        <h1 className={`max-w-5xl text-balance ${t.h1}`}>{c.headline}</h1>
      </Rail>
      <Annotation>{`h1  ·  ${c.tagline.toLowerCase()}`}</Annotation>
      <Rail className="px-4 py-3 sm:px-6">
        <p className={`max-w-2xl ${t.lead}`}>
          {c.intro}
          {c.highlights.length === 3 && (
            <>
              {" "}
              Think <Mono>{c.highlights[0]}</Mono>, <Mono>{c.highlights[1]}</Mono>{" "}
              and <Mono>{c.highlights[2]}</Mono>.
            </>
          )}
        </p>
      </Rail>
      <Rail className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
        <Button href={links.action}>{c.cta.primary}</Button>
        <form className="flex w-full items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-gray-950/10 focus-within:ring-gray-950/25 sm:w-72">
          <input
            type="email"
            placeholder={c.cta.secondary}
            className="min-w-0 flex-1 bg-transparent text-sm/6 text-gray-950 placeholder:text-gray-500 focus:outline-none"
          />
          <kbd className="font-sans text-xs/4 text-gray-400">↵</kbd>
        </form>
      </Rail>
      <Rail className="p-2 sm:p-4">
        <HeroShowcase {...p} />
      </Rail>
    </section>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[0.9em] font-medium text-gray-950">{children}</code>
  );
}

function HeroShowcase({ c, t }: Props) {
  const lines = c.statement.lines;
  const active = Math.min(4, lines.length - 1);
  return (
    <Frame>
      <div className="grid gap-1.5 lg:grid-cols-[1.15fr_1fr]">
        <Panel className="overflow-hidden">
          <FileBar file={`${fileName(c.statement.title)}.txt`} note={c.statement.note} />
          <ol className="py-4 font-mono text-[0.8125rem]/7">
            {lines.map((line, i) => (
              <li
                key={i}
                className={`flex border-l-2 pr-4 ${
                  i === active ? "border-gray-950 bg-gray-950/[0.04]" : "border-transparent"
                }`}
              >
                <span className="w-12 shrink-0 pr-4 text-right text-gray-950/25 select-none">
                  {i + 1}
                </span>
                <span className={i === active ? "text-gray-950" : "text-gray-600"}>
                  {line}
                </span>
              </li>
            ))}
            <li className="flex border-l-2 border-transparent pr-4">
              <span className="w-12 shrink-0 pr-4 text-right text-gray-950/25 select-none">
                {lines.length + 1}
              </span>
              <span className="text-gray-400">
                — <span className="animate-pulse text-gray-950">▍</span>
              </span>
            </li>
          </ol>
        </Panel>
        <Panel className="hatch flex items-center justify-center p-6 sm:p-10">
          <Spotlight c={c} t={t} />
        </Panel>
      </div>
      {c.command && <CommandBar command={c.command} />}
    </Frame>
  );
}

/** `$ cmd --flag value …` with the first flag pair highlighted. */
function CommandBar({ command }: { command: string }) {
  const m = command.match(/^(\S+(?:\s+[^-\s]\S*)?)(\s+--\S+\s+[^-\s]\S*)?(.*)$/);
  const [head, flag, rest] = m ? [m[1], m[2], m[3]] : [command, "", ""];
  return (
    <Panel className="px-4 py-3">
      <p className="truncate font-mono text-[0.8125rem]/6 text-gray-500">
        <span className="text-gray-400">$ </span>
        <span className="text-gray-950">{head}</span>
        {flag && (
          <>
            {" "}
            <span className="rounded bg-gray-950/5 px-1 py-0.5 text-gray-950">
              {flag.trim()}
            </span>
          </>
        )}
        {rest}
      </p>
    </Panel>
  );
}

function Spotlight({ c, t }: { c: SiteContent; t: T }) {
  const s = c.spotlight;
  return (
    <Float className="w-full max-w-xs p-5">
      <div className="flex items-start justify-between">
        <div className="flex size-11 items-center justify-center rounded-full bg-gray-100 font-sans text-sm font-semibold text-gray-950 ring-1 ring-gray-950/5">
          {s.initials}
        </div>
        <span className="font-mono text-[0.6875rem]/5 text-gray-400">{s.ref}</span>
      </div>
      <p className={`mt-4 ${t.spotTitle}`}>{s.title}</p>
      <p className="text-sm/6 text-gray-500">{s.subtitle}</p>
      <p className={`mt-4 ${t.small}`}>{s.body}</p>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {s.tags.map((tag, i) => (
          <span
            key={i}
            className="rounded-full bg-gray-950/5 px-2 py-0.5 text-xs/5 font-medium text-gray-700"
          >
            {tag}
          </span>
        ))}
      </div>
    </Float>
  );
}

/* ----------------------------------------------------------------------------
 * Stats
 * ------------------------------------------------------------------------- */

function Stats({ c, t }: Props) {
  return (
    <Rail className="mt-px grid grid-cols-3 divide-x divide-gray-950/5">
      {c.stats.slice(0, 3).map((s, i) => (
        <div key={i} className="px-4 py-8 sm:px-6 sm:py-10">
          <p className={`tabular-nums ${t.stat}`}>{s.value}</p>
          <p className="mt-3 font-mono text-xs/5 text-gray-500">{s.label}</p>
        </div>
      ))}
    </Rail>
  );
}

/* ----------------------------------------------------------------------------
 * Section heading
 * ------------------------------------------------------------------------- */

function SectionHead({
  id,
  head,
  t,
}: {
  id: string;
  head: SiteContent["sections"]["principles"];
  t: T;
}) {
  return (
    <>
      <Gap id={id} />
      <Rail className="px-4 py-3 sm:px-6">
        <p className={t.eyebrow}>{head.eyebrow}</p>
      </Rail>
      <Rail className="px-4 py-2 sm:px-6">
        <h2 className={`max-w-3xl text-balance ${t.h2}`}>{head.title}</h2>
      </Rail>
      {head.body && (
        <Rail className="px-4 py-3 sm:px-6">
          <p className={`max-w-2xl ${t.body}`}>{head.body}</p>
        </Rail>
      )}
    </>
  );
}

/* ----------------------------------------------------------------------------
 * Principles
 * ------------------------------------------------------------------------- */

const placements = [
  "place-items-start",
  "place-items-center",
  "place-items-end",
  "items-end justify-items-start",
  "items-start justify-items-end",
  "items-end justify-items-center",
];

function Principles({ c, t }: Props) {
  return (
    <section>
      <SectionHead id="principles" head={c.sections.principles} t={t} />
      <Rail className="mt-6 border-t border-gray-950/5">
        <div className="grid gap-px bg-gray-950/5 sm:grid-cols-2 lg:grid-cols-3">
          {c.principles.map((p, i) => (
            <div key={i} className="bg-white p-4 sm:p-6">
              <div
                className={`hatch grid h-32 rounded-lg ring-1 ring-gray-950/5 ${placements[i % placements.length]}`}
              >
                <div className="flex size-14 items-center justify-center rounded-lg bg-gray-950 font-mono text-sm font-medium text-white shadow-sm">
                  {pad(i)}
                </div>
              </div>
              <h3 className={`mt-6 ${t.cellTitle}`}>{p.title}</h3>
              <p className={`mt-1 ${t.small}`}>{p.body}</p>
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

function Programs(props: Props) {
  const { c } = props;
  return (
    <section>
      <SectionHead id="programs" head={c.sections.programs} t={props.t} />
      <Rail className="mt-6 border-t border-gray-950/5 p-2 sm:p-4">
        <div className="grid gap-2 sm:gap-4 md:grid-cols-2">
          {c.programs.map((p, i) =>
            props.v === "v1" ? (
              <StackedCard key={i} program={p} index={i} {...props} />
            ) : (
              <SplitCard key={i} program={p} index={i} {...props} />
            ),
          )}
        </div>
      </Rail>
    </section>
  );
}

type Program = SiteContent["programs"][number];

/** v0: hatched visual over a text panel. */
function SplitCard({ program: p, index, t, links }: Props & { program: Program; index: number }) {
  return (
    <Frame>
      <Panel className="hatch flex h-48 items-center justify-center overflow-hidden">
        <ProgramVisual program={p} index={index} serif={false} />
      </Panel>
      <Panel className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className={t.cardTitle}>{p.name}</h3>
          <span className="shrink-0 font-mono text-xs/5 text-gray-500">{p.kind}</span>
        </div>
        <p className={`mt-2 ${t.small}`}>{p.body}</p>
        <div className="mt-auto flex items-center justify-between gap-4 pt-6">
          <div className="flex flex-wrap gap-1.5">
            {p.tags.map((tag, i) => (
              <Chip key={i}>{tag}</Chip>
            ))}
          </div>
          <a
            href={links.action}
            className="group flex shrink-0 items-center gap-0.5 text-sm/6 font-semibold text-gray-950"
          >
            Learn more
            <Arrow className="transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </Panel>
    </Frame>
  );
}

/** v1: the stacked "file" card — file bar + text, hatched float, command strip. */
function StackedCard({ program: p, index, t, links }: Props & { program: Program; index: number }) {
  return (
    <Frame>
      <Panel className="overflow-hidden">
        <FileBar file={`${fileName(p.slug || p.name)}.txt`} note={p.kind} />
        <div className="px-5 pt-5 pb-6 sm:px-6">
          <h3 className={t.cardTitle}>{p.name}</h3>
          <p className={`mt-2 ${t.small}`}>{p.body}</p>
        </div>
      </Panel>
      <Panel className="hatch flex h-60 flex-1 items-center justify-center overflow-hidden p-6">
        <ProgramVisual program={p} index={index} serif />
      </Panel>
      <Panel className="flex items-center justify-between gap-4 px-4 py-3">
        <p className="truncate font-mono text-[0.8125rem]/6 text-gray-500">
          <span className="text-gray-400">$ </span>
          <span className="text-gray-950">join</span>{" "}
          <span className="rounded bg-gray-950/5 px-1 py-0.5 text-gray-950">
            {fileName(p.slug || p.name)}
          </span>{" "}
          {p.tags.map((tag) => `--${fileName(tag)}`).join(" ")}
        </p>
        <a
          href={links.action}
          className="group flex shrink-0 items-center gap-0.5 text-sm/6 font-medium text-gray-950"
        >
          Learn more
          <Arrow className="transition-transform group-hover:translate-x-0.5" />
        </a>
      </Panel>
    </Frame>
  );
}

/* Program visuals: bespoke ones for the default programs, a generic card otherwise. */

function ProgramVisual({
  program: p,
  index,
  serif,
}: {
  program: Program;
  index: number;
  serif: boolean;
}) {
  const display = serif ? "font-serif tracking-[-0.04em]" : "font-medium tracking-tighter";

  if (p.slug === "fellowship") {
    return (
      <Float className="p-4">
        {serif && (
          <p className="mb-3 flex items-baseline gap-2">
            <span className="font-serif text-5xl/none tracking-[-0.05em]">12</span>
            <span className="text-sm text-gray-500">weeks</span>
          </p>
        )}
        <div className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className={`flex size-8 items-center justify-center rounded-md font-mono text-[0.625rem] ${
                i < 8 ? "bg-gray-950 text-white" : "bg-gray-950/5 text-gray-400"
              }`}
            >
              {pad(i)}
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-[0.6875rem] text-gray-500">
          week 08 of 12 · demo night in 4
        </p>
      </Float>
    );
  }
  if (p.slug === "salons") {
    return serif ? (
      <Float className="w-64 -rotate-2 rounded-sm px-6 py-5">
        <p className="text-[0.6875rem]/4 tracking-[0.12em] text-gray-500 uppercase">
          Salon No. 31
        </p>
        <p className="mt-2 font-serif text-[1.625rem]/[1.15] tracking-[-0.03em]">
          What is a homepage for?
        </p>
        <div className="my-4 border-t border-gray-950/10" />
        <p className="text-[0.8125rem]/5 text-gray-500">London · Thu 6 Nov · 7pm</p>
      </Float>
    ) : (
      <div>
        <div className="flex justify-center gap-3 pb-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="size-6 rounded-full bg-white ring-1 ring-gray-950/15" />
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
                i === 2 ? "bg-gray-950 ring-gray-950" : "bg-white ring-gray-950/15"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }
  if (p.slug === "grants") {
    return (
      <Float className={`w-64 p-4 ${serif ? "rotate-1" : ""}`}>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[0.6875rem] text-gray-500">grant #118</span>
          <span className="rounded-full bg-gray-950/5 px-1.5 font-mono text-[0.625rem]/4 text-gray-600">
            approved
          </span>
        </div>
        <p className={`mt-2 text-3xl tabular-nums ${display}`}>$4,800</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-950/5">
          <div className="h-full w-3/5 rounded-full bg-gray-950" />
        </div>
        <p className="mt-2 font-mono text-[0.6875rem] text-gray-500">decided in 9 days</p>
      </Float>
    );
  }
  if (p.slug === "commons") {
    return (
      <Float className="w-64 divide-y divide-gray-950/5">
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
      </Float>
    );
  }

  // Generic: a small index card built from the program itself.
  return (
    <Float className={`w-64 p-4 ${index % 2 ? "rotate-1" : "-rotate-1"}`}>
      <div className="flex items-baseline justify-between font-mono text-[0.6875rem] text-gray-400">
        <span>{pad(index)}</span>
        <span>{p.kind}</span>
      </div>
      <p className={`mt-6 text-3xl/none ${display}`}>{p.name}</p>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {p.tags.map((tag, i) => (
          <Chip key={i}>{tag}</Chip>
        ))}
      </div>
    </Float>
  );
}

/* ----------------------------------------------------------------------------
 * Events
 * ------------------------------------------------------------------------- */

function Events({ c, t, v, links }: Props) {
  const first = c.events[0]?.date;
  const last = c.events.at(-1)?.date;
  return (
    <section>
      <SectionHead id="events" head={c.sections.events} t={t} />
      <Rail className="mt-6 border-t border-gray-950/5 p-2 sm:p-4">
        <Frame>
          <Panel className="overflow-hidden">
            {v === "v1" && (
              <FileBar
                file={`${fileName(c.sections.events.eyebrow)}.ics`}
                note={first && last && first !== last ? `${first} – ${last}` : undefined}
              />
            )}
            <div className="divide-y divide-gray-950/5">
              {c.events.map((e, i) => (
                <a
                  key={i}
                  href={links.action}
                  className="group grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-gray-950/[0.02] sm:grid-cols-[6rem_1fr_8rem_6rem_1rem] sm:px-6"
                >
                  <span className="font-mono text-xs/6 text-gray-500 tabular-nums">
                    {e.date}
                  </span>
                  <span className={`text-gray-950 ${t.eventTitle}`}>{e.title}</span>
                  <span className="hidden text-sm/6 text-gray-500 sm:block">{e.city}</span>
                  <span className="justify-self-end sm:justify-self-start">
                    <Chip>{e.type.toLowerCase()}</Chip>
                  </span>
                  <Arrow className="hidden text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-950 sm:block" />
                </a>
              ))}
            </div>
          </Panel>
        </Frame>
      </Rail>
    </section>
  );
}

/* ----------------------------------------------------------------------------
 * FAQ
 * ------------------------------------------------------------------------- */

function Faq({ c, t, v }: Props) {
  return (
    <section>
      <Gap id="faq" />
      <Rail className="grid gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_2fr]">
        <div>
          <p className={t.eyebrow}>FAQ</p>
          <h2 className={`mt-3 ${t.h2}`}>
            {v === "v1" ? "Questions, answered" : "Questions, answered."}
          </h2>
        </div>
        <div className="divide-y divide-gray-950/5 border-y border-gray-950/5">
          {c.faqs.map((f, i) => (
            <details key={i} className="group" open={i === 0}>
              <summary
                className={`flex cursor-pointer list-none items-center justify-between gap-6 py-4 [&::-webkit-details-marker]:hidden ${t.question}`}
              >
                {f.q}
                <span className="relative size-3.5 shrink-0 text-gray-400">
                  <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
                  <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current transition-transform group-open:scale-y-0" />
                </span>
              </summary>
              <p className={`max-w-xl pb-5 ${t.small}`}>{f.a}</p>
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

function Cta({ c, t, links }: Props) {
  const anchor = c.principles.length > 0 ? "#principles" : "#";
  return (
    <section id="apply" className="scroll-mt-14">
      <Gap />
      <Rail className="hatch px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className={`text-balance ${t.ctaTitle}`}>{c.cta.title}</h2>
          <p className={`mx-auto mt-5 max-w-md ${t.body}`}>{c.cta.body}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href={links.action}>{c.cta.primary}</Button>
            <Button href={anchor} secondary>
              Read more
            </Button>
          </div>
        </div>
      </Rail>
    </section>
  );
}

function Footer({ c, t, links }: Props) {
  return (
    <footer className="border-t border-gray-950/5">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 border-x border-gray-950/5 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className={t.name}>{c.name}</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs/6 text-gray-500">
          {links.source && (
            <a href={links.source} className="hover:text-gray-950" target="_blank" rel="noreferrer">
              original ↗
            </a>
          )}
          <a href="#" className="hover:text-gray-950">top ↑</a>
          <Link href={links.alternate} className="hover:text-gray-950">
            other version →
          </Link>
        </div>
      </div>
      <div className="border-t border-gray-950/5">
        <div className="mx-auto h-10 max-w-6xl border-x border-gray-950/5" />
      </div>
    </footer>
  );
}
