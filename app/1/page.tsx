import type { Metadata } from "next";
import Link from "next/link";
import { charter, events, faqs, principles, programs, site } from "@/lib/content";

// Version 1 — editorial language: LT Superior Serif headlines, Inter Display
// body, a ruled column on grid paper, glossy ink buttons. Light, monochrome.

export const metadata: Metadata = {
  title: "New Internet Society — v1",
};

export default function V1() {
  return (
    <div className="grid-paper min-h-dvh overflow-x-clip font-display text-black">
      <Header />
      <main className="relative mx-auto max-w-[1040px] border-x border-black/[0.08] bg-white/40">
        <Hero />
        <Programs />
        <Principles />
        <Charter />
        <Gatherings />
        <Questions />
        <Apply />
        <Footer />
      </main>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Primitives
 * ------------------------------------------------------------------------- */

/** Horizontal rule with small square markers where it meets the column edges. */
function Rule() {
  return (
    <div className="relative border-t border-black/[0.08]" aria-hidden>
      <span className="absolute -top-[4px] -left-[4px] size-[7px] border border-black/15 bg-white" />
      <span className="absolute -top-[4px] -right-[4px] size-[7px] border border-black/15 bg-white" />
    </div>
  );
}

function Label({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 text-sm/5 text-black/55 sm:px-8">
      <span>{children}</span>
      {aside && <span className="tabular-nums text-black/35">{aside}</span>}
    </div>
  );
}

function InkButton({
  href,
  children,
  small = false,
}: {
  href: string;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <a
      href={href}
      className={`group inline-flex items-center gap-2.5 rounded-[10px] bg-linear-to-b from-neutral-600 to-neutral-950 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.28),0_0_0_1px_rgb(0_0_0/0.85),0_2px_6px_-1px_rgb(0_0_0/0.35)] transition-[filter] hover:brightness-125 ${
        small ? "px-2.5 py-1 text-sm/5" : "px-3.5 py-2 text-base/6"
      }`}
      style={{ letterSpacing: "0.1px" }}
    >
      {children}
      {!small && (
        <svg
          viewBox="0 0 8 10"
          className="size-2 fill-white/60 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        >
          <path d="M0 0l8 5-8 5z" />
        </svg>
      )}
    </a>
  );
}

function Tag({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 text-[13px]/5 ${
        light
          ? "bg-white text-black shadow-sm ring-1 ring-black/5"
          : "bg-black/70 text-white backdrop-blur"
      }`}
    >
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------------------
 * Header
 * ------------------------------------------------------------------------- */

function Header() {
  return (
    <header className="sticky top-0 z-20">
      <div className="relative mx-auto flex h-14 max-w-[1040px] items-center justify-between border-x border-b border-black/[0.08] bg-white/80 px-3 backdrop-blur-md sm:px-4">
        <div className="flex rounded-[10px] bg-black/[0.05] p-0.5 text-[13px]/5">
          <a
            href="#programs"
            className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-black shadow-sm ring-1 ring-black/5"
          >
            <span className="size-1.5 rounded-full bg-black" />
            Society
          </a>
          <a
            href="#charter"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-black/45 transition-colors hover:text-black"
          >
            Charter
          </a>
        </div>
        <Link
          href="/1"
          className="absolute left-1/2 hidden -translate-x-1/2 text-[17px]/5 tracking-[-0.3px] sm:block"
        >
          New Internet Society
        </Link>
        <InkButton href="#apply" small>
          Apply
        </InkButton>
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
      <div className="flex min-h-[520px] flex-col justify-end gap-8 px-5 pt-24 pb-8 sm:min-h-[600px] sm:px-8">
        <p className="flex items-center gap-2 text-sm/5 text-black/55">
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-black/30" />
            <span className="relative size-2 rounded-full bg-black" />
          </span>
          Cohort 05 applications are open
        </p>
        <h1 className="max-w-[860px] font-serif text-[42px]/[48px] tracking-[-0.045em] text-balance sm:text-[64px]/[72px]">
          A society for the people building the internet we actually want to
          live on
        </h1>
        <div className="flex flex-wrap items-center gap-4">
          <InkButton href="#apply">Apply for membership</InkButton>
          <a
            href="#charter"
            className="text-base/6 text-black/55 underline decoration-black/20 underline-offset-4 transition-colors hover:text-black"
          >
            Read the charter
          </a>
        </div>
      </div>
      <Rule />
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="max-w-xl text-base/6 tracking-[0.1px] text-black/60">
          Builders, writers and researchers who think the web is unfinished.
          Fellowships, salons and small grants for its quieter corners.
        </p>
        <dl className="flex gap-6">
          {site.stats.map((s) => (
            <div key={s.label} className="flex items-baseline gap-1.5">
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-serif text-[22px]/6 tracking-[-0.5px] tabular-nums">
                {s.value}
              </dd>
              <span className="text-sm/5 text-black/45">{s.label}</span>
            </div>
          ))}
        </dl>
      </div>
      <Rule />
    </section>
  );
}

/* ----------------------------------------------------------------------------
 * Programs — masonry of cards
 * ------------------------------------------------------------------------- */

function Card({
  children,
  tags,
  className = "",
}: {
  children: React.ReactNode;
  tags: string[];
  className?: string;
}) {
  return (
    <div className="rounded-[20px] bg-white p-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] ring-1 ring-black/[0.08]">
      <div
        className={`relative overflow-hidden rounded-[14px] bg-[#f4f4f2] ${className}`}
      >
        {children}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
          {tags.map((t, i) => (
            <Tag key={t} light={i === 0}>
              {t}
            </Tag>
          ))}
        </div>
      </div>
    </div>
  );
}

function Programs() {
  const [fellowship, salons, grants, commons] = programs;
  const tagsFor = (p: (typeof programs)[number]) => [p.name, ...p.tags];

  return (
    <section id="programs" className="scroll-mt-14">
      <Label aside="04">Programs</Label>
      <div className="grid gap-3 px-3 pb-3 sm:grid-cols-2 sm:gap-4 sm:px-4 sm:pb-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          <Card tags={tagsFor(fellowship)} className="aspect-[4/5]">
            <FellowshipArt />
          </Card>
          <Card tags={tagsFor(grants)} className="aspect-square">
            <GrantArt />
          </Card>
        </div>
        <div className="flex flex-col gap-3 sm:gap-4">
          <Card tags={tagsFor(salons)} className="aspect-[4/3]">
            <SalonArt />
          </Card>
          <Card tags={tagsFor(commons)} className="aspect-square">
            <CommonsArt />
          </Card>
          <div className="flex flex-1 items-center justify-center rounded-[20px] border border-dashed border-black/15 p-10">
            <p className="text-center font-serif text-[30px]/[34px] tracking-[-0.5px] text-black/25">
              More programs
              <br />
              coming soon
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-px border-t border-black/[0.08] bg-black/[0.08] sm:grid-cols-2">
        {programs.map((p) => (
          <div key={p.slug} className="bg-white px-5 py-6 sm:px-8 sm:py-8">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-serif text-[30px]/10 tracking-[-0.5px]">
                {p.name}
              </h3>
              <span className="text-sm/5 text-black/45">{p.kind}</span>
            </div>
            <p className="mt-2 max-w-md text-base/[26px] tracking-[0.1px] text-black/70">
              {p.body}
            </p>
          </div>
        ))}
      </div>
      <Rule />
    </section>
  );
}

function FellowshipArt() {
  return (
    <div className="flex h-full flex-col items-center justify-center pb-10">
      <p className="font-serif text-[180px]/[0.8] tracking-[-0.06em]">12</p>
      <p className="mt-6 text-sm/5 text-black/50">
        weeks · twelve people · one thing shipped each
      </p>
      <div className="mt-6 flex gap-1.5">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className={`h-5 w-1 rounded-full ${i < 8 ? "bg-black" : "bg-black/15"}`}
          />
        ))}
      </div>
    </div>
  );
}

function SalonArt() {
  return (
    <div className="flex h-full items-center justify-center pb-8">
      <div className="w-[68%] -rotate-3 rounded-sm bg-white px-6 py-5 shadow-[0_12px_30px_-8px_rgb(0_0_0/0.18),0_0_0_1px_rgb(0_0_0/0.04)]">
        <p className="text-[11px]/4 tracking-[0.12em] text-black/45 uppercase">
          Salon No. 31
        </p>
        <p className="mt-2 font-serif text-[26px]/[30px] tracking-[-0.03em]">
          What is a homepage for?
        </p>
        <div className="my-4 border-t border-black/10" />
        <p className="text-[13px]/5 text-black/55">
          London · Thursday 6 November · 7pm
        </p>
      </div>
    </div>
  );
}

function GrantArt() {
  return (
    <div className="flex h-full items-center justify-center pb-10">
      <div className="w-[72%] rotate-2 rounded-lg bg-white p-5 shadow-[0_12px_30px_-8px_rgb(0_0_0/0.18),0_0_0_1px_rgb(0_0_0/0.04)]">
        <div className="flex items-center justify-between text-[11px]/4 tracking-[0.12em] text-black/45 uppercase">
          <span>Small grant</span>
          <span>No. 118</span>
        </div>
        <p className="mt-6 text-[13px]/5 text-black/45">Pay to the order of</p>
        <p className="border-b border-black/10 pb-2 text-base/6">
          tiny-rss, a reader for everyone
        </p>
        <div className="mt-5 flex items-end justify-between">
          <p className="font-serif text-[40px]/none tracking-[-0.04em] tabular-nums">
            $4,800
          </p>
          <p className="text-[13px]/5 text-black/45">decided in 9 days</p>
        </div>
      </div>
    </div>
  );
}

function CommonsArt() {
  const items = [
    ["homepage-starter", "Template", "2.1k"],
    ["On slowness", "Essay", "880"],
    ["tiny-rss", "Tool", "1.4k"],
    ["Link rot field guide", "Essay", "650"],
  ];
  return (
    <div className="flex h-full items-center justify-center px-8 pb-10">
      <div className="w-full max-w-[340px] overflow-hidden rounded-xl bg-white shadow-[0_12px_30px_-8px_rgb(0_0_0/0.18),0_0_0_1px_rgb(0_0_0/0.05)]">
        <div className="flex items-center gap-1.5 border-b border-black/[0.06] px-3 py-2.5">
          <span className="size-2 rounded-full bg-black/10" />
          <span className="size-2 rounded-full bg-black/10" />
          <span className="size-2 rounded-full bg-black/10" />
          <span className="ml-2 text-[12px]/4 text-black/40">
            commons.nis.social
          </span>
        </div>
        <ul className="divide-y divide-black/[0.06]">
          {items.map(([name, kind, n]) => (
            <li
              key={name}
              className="flex items-center justify-between px-4 py-2.5 text-[13px]/5"
            >
              <span>{name}</span>
              <span className="flex gap-3 text-black/40">
                <span>{kind}</span>
                <span className="w-8 text-right tabular-nums">{n}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Principles
 * ------------------------------------------------------------------------- */

function Principles() {
  return (
    <section id="principles" className="scroll-mt-14">
      <Label aside="06">Principles</Label>
      <div className="divide-y divide-black/[0.08] border-t border-black/[0.08]">
        {principles.map((p) => (
          <div
            key={p.id}
            className="grid gap-2 px-5 py-6 sm:grid-cols-[1fr_1.15fr] sm:gap-10 sm:px-8 sm:py-8"
          >
            <h3 className="flex items-start gap-3 font-serif text-[30px]/10 tracking-[-0.5px]">
              <span className="pt-1 font-display text-sm/5 tracking-normal text-black/30 tabular-nums">
                {p.id}
              </span>
              {p.title}
            </h3>
            <p className="max-w-md text-base/[26px] tracking-[0.1px] text-black/70 sm:pt-1.5">
              {p.body}
            </p>
          </div>
        ))}
      </div>
      <Rule />
    </section>
  );
}

/* ----------------------------------------------------------------------------
 * Charter
 * ------------------------------------------------------------------------- */

function Charter() {
  return (
    <section id="charter" className="scroll-mt-14">
      <Label aside="Signed by 412">Charter</Label>
      <div className="px-5 pt-6 pb-14 sm:px-8 sm:pt-10 sm:pb-20">
        <blockquote className="max-w-[760px] font-serif text-[30px]/[38px] tracking-[-0.03em] text-balance sm:text-[40px]/[50px]">
          {charter.map((line, i) => (
            <span key={i} className={i === 0 ? "text-black" : "text-black/80"}>
              {line}{" "}
            </span>
          ))}
        </blockquote>
        <div className="mt-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {["AM", "JK", "RS", "LT"].map((i) => (
              <span
                key={i}
                className="flex size-8 items-center justify-center rounded-full bg-[#f4f4f2] text-[11px] font-medium text-black/60 ring-2 ring-white"
              >
                {i}
              </span>
            ))}
          </div>
          <p className="text-sm/5 text-black/55">
            and 408 other members, since 2024
          </p>
        </div>
      </div>
      <Rule />
    </section>
  );
}

/* ----------------------------------------------------------------------------
 * Gatherings
 * ------------------------------------------------------------------------- */

function Gatherings() {
  return (
    <section>
      <Label aside="Nov – Dec">Gatherings</Label>
      <ul className="divide-y divide-black/[0.08] border-t border-black/[0.08]">
        {events.map((e) => (
          <li key={e.title}>
            <a
              href="#apply"
              className="group grid grid-cols-[4.5rem_1fr] items-baseline gap-x-4 gap-y-1 px-5 py-5 transition-colors hover:bg-white sm:grid-cols-[7rem_1fr_9rem_1rem] sm:px-8"
            >
              <span className="text-sm/6 text-black/45 tabular-nums">
                {e.date}
              </span>
              <span className="font-serif text-[22px]/7 tracking-[-0.3px]">
                {e.title}
              </span>
              <span className="col-start-2 text-sm/6 text-black/55 sm:col-start-auto sm:text-right">
                {e.city}
              </span>
              <span className="hidden text-black/30 transition-transform group-hover:translate-x-0.5 group-hover:text-black sm:block">
                →
              </span>
            </a>
          </li>
        ))}
      </ul>
      <Rule />
    </section>
  );
}

/* ----------------------------------------------------------------------------
 * Questions
 * ------------------------------------------------------------------------- */

function Questions() {
  return (
    <section>
      <Label>Questions</Label>
      <div className="grid gap-px border-t border-black/[0.08] bg-black/[0.08] sm:grid-cols-2">
        {faqs.map((f) => (
          <div key={f.q} className="bg-white px-5 py-6 sm:px-8 sm:py-8">
            <h3 className="text-base/6 font-medium">{f.q}</h3>
            <p className="mt-2 text-base/[26px] tracking-[0.1px] text-black/60">
              {f.a}
            </p>
          </div>
        ))}
      </div>
      <Rule />
    </section>
  );
}

/* ----------------------------------------------------------------------------
 * Apply + footer
 * ------------------------------------------------------------------------- */

function Apply() {
  return (
    <section id="apply" className="scroll-mt-14">
      <div className="px-5 py-20 sm:px-8 sm:py-28">
        <h2 className="max-w-[640px] font-serif text-[42px]/[48px] tracking-[-0.045em] sm:text-[56px]/[62px]">
          Come build the next draft with us
        </h2>
        <p className="mt-5 max-w-md text-base/[26px] tracking-[0.1px] text-black/60">
          Tell us what you&apos;re making. A member reads every application and
          replies within two weeks.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <InkButton href="#apply">Apply for membership</InkButton>
          <form className="flex h-10 items-center rounded-[10px] bg-white pr-1 pl-3.5 ring-1 ring-black/10 focus-within:ring-black/25 sm:w-80">
            <input
              type="email"
              placeholder="Or get the monthly letter"
              className="min-w-0 flex-1 bg-transparent text-[15px] placeholder:text-black/40 focus:outline-none"
            />
            <button
              type="button"
              className="rounded-md px-2 py-1 text-sm text-black/55 hover:bg-black/5 hover:text-black"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
      <Rule />
    </section>
  );
}

function Footer() {
  return (
    <footer className="flex flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <p className="text-[21px]/5 tracking-[-0.5px]">New Internet Society</p>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm/5 text-black/55">
        <a href="#" className="hover:text-black">RSS</a>
        <a href="#charter" className="hover:text-black">Charter</a>
        <a href="#" className="hover:text-black">Code of conduct</a>
        <Link href="/" className="hover:text-black">← v0</Link>
      </div>
    </footer>
  );
}
