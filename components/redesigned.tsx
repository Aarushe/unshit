import Link from "next/link";
import type { Block, Field, Inline, Item, Page } from "@/lib/extract";
import { Annotation, Arrow, Frame, Gap, Panel, Rail, type, type Variant } from "./site";

// Renders a page read by lib/extract in our layout. Only the page's own
// content appears; the layout decides how it is presented, not what it says.

type Ctx = { v: Variant; t: (typeof type)[Variant]; host: string; article: boolean };

const prose = {
  v0: "text-[1.0625rem]/[1.75] text-gray-700",
  v1: "text-[1.0625rem]/[1.75] tracking-[0.1px] text-gray-950/75",
};
const quoteStyle = {
  v0: "text-xl/8 font-medium tracking-tight text-gray-950",
  v1: "font-serif text-2xl/9 tracking-[-0.02em] text-gray-950",
};

export function Redesigned({
  page,
  variant,
  banner,
  alternate,
}: {
  page: Page;
  variant: Variant;
  banner?: React.ReactNode;
  alternate: string;
}) {
  const ctx: Ctx = { v: variant, t: type[variant], host: page.host, article: page.kind === "article" };
  const t = ctx.t;
  const long = page.title.length > 70;

  return (
    <div className={`overflow-x-clip ${t.root}`}>
      {banner}
      {/* The page's own language and direction: right-to-left pages read right to left. */}
      <div lang={page.lang} dir={page.dir}>
        <header className="sticky top-0 z-20 border-b border-gray-950/5 bg-white/85 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
            <A href={page.url} ctx={ctx} className={`truncate ${t.name}`}>
              {page.siteName}
            </A>
            {page.nav.length > 0 && (
              <nav className="hidden min-w-0 items-center gap-6 overflow-hidden md:flex">
                {page.nav.map((n) => (
                  <A
                    key={n.href}
                    href={n.href}
                    ctx={ctx}
                    className="shrink-0 text-sm/6 text-gray-600 transition-colors hover:text-gray-950"
                  >
                    {n.label}
                  </A>
                ))}
              </nav>
            )}
          </div>
        </header>

        <main>
          <div className="h-10 sm:h-16" />
          <Annotation>{`${page.host}   ·   ${page.kind}`}</Annotation>
          <Rail className="px-4 py-2 sm:px-6">
            <h1 className={`text-balance ${ctx.article ? "mx-auto max-w-[680px]" : "max-w-5xl"} ${long || ctx.article ? t.h2 : t.h1}`}>
              {page.title}
            </h1>
          </Rail>
          {page.lead && (
            <Rail className="px-4 py-3 sm:px-6">
              <p className={`${ctx.article ? "mx-auto max-w-[680px]" : "max-w-2xl"} ${t.lead}`}>
                <Inlines c={page.lead} ctx={ctx} />
              </p>
            </Rail>
          )}

          {page.sections.map((s, i) =>
            ctx.article ? (
              <Rail key={i} className="px-4 py-8 sm:px-6 sm:py-10">
                <div className="mx-auto max-w-[680px]">
                  {s.heading && <h2 className={`mb-5 ${t.h2} text-[1.75rem]/[1.2] sm:text-[2rem]/[1.2]`}>{s.heading}</h2>}
                  <Flow items={s.items} ctx={ctx} />
                </div>
              </Rail>
            ) : (
              <section key={i}>
                {s.heading && (
                  <>
                    <Gap />
                    <Rail className="px-4 py-2 sm:px-6">
                      <h2 className={`max-w-3xl text-balance ${t.h2}`}>{s.heading}</h2>
                    </Rail>
                  </>
                )}
                <Wide items={s.items} ctx={ctx} />
              </section>
            ),
          )}
          <div className="h-16 border-t border-gray-950/5 sm:h-24" />
        </main>
      </div>

      <footer className="border-t border-gray-950/5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-x border-gray-950/5 px-4 py-8 sm:px-6">
          <span lang={page.lang} dir="auto" className={t.name}>
            {page.siteName}
          </span>
          <div className="flex gap-6 font-mono text-xs/6 text-gray-500">
            <a href={page.url} target="_blank" rel="noreferrer" className="hover:text-gray-950">
              original ↗
            </a>
            <Link href={alternate} className="hover:text-gray-950">
              other version →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Links: same-site links stay inside the redesign, others open the real site.
 * ------------------------------------------------------------------------- */

function A({
  href,
  ctx,
  className = "",
  children,
}: {
  href: string;
  ctx: Ctx;
  className?: string;
  children: React.ReactNode;
}) {
  // In-page jump to a dialog we turned into a collapsible section.
  if (href.startsWith("#")) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  let internal = false;
  try {
    const u = new URL(href);
    internal = (u.protocol === "http:" || u.protocol === "https:") && u.hostname.replace(/^www\./, "") === ctx.host;
  } catch {}
  if (internal) {
    return (
      <Link
        href={`/redesign/view?url=${encodeURIComponent(href)}&v=${ctx.v === "v1" ? "1" : "0"}`}
        className={className}
      >
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  );
}

function Inlines({ c, ctx, quiet = false }: { c: Inline[]; ctx: Ctx; quiet?: boolean }) {
  return (
    <>
      {c.map((s, i) => {
        if (s.t === "\n") return <br key={i} />;
        let node: React.ReactNode = s.t;
        if (s.code) node = <code className="rounded bg-gray-950/5 px-1 py-0.5 font-mono text-[0.85em] text-gray-950">{node}</code>;
        if (s.b) node = <strong className="font-semibold text-gray-950">{node}</strong>;
        if (s.i) node = <em>{node}</em>;
        if (s.href) {
          node = (
            <A
              href={s.href}
              ctx={ctx}
              className={
                quiet
                  ? "hover:text-gray-950 hover:underline"
                  : "text-gray-950 underline decoration-gray-950/20 underline-offset-[3px] transition-colors hover:decoration-gray-950/60"
              }
            >
              {node}
            </A>
          );
        }
        return <span key={i}>{node}</span>;
      })}
    </>
  );
}

/* ----------------------------------------------------------------------------
 * Layout of blocks
 * ------------------------------------------------------------------------- */

const WIDE = new Set(["cards", "table", "rows", "form", "code", "img", "stats"]);

/** Groups items into runs of text flow and wide framed blocks. */
function runs(items: Item[]) {
  const out: { wide: boolean; items: Item[] }[] = [];
  for (const it of items) {
    const wide = WIDE.has(it.k) || (it.k === "list" && linkList(it));
    const last = out.at(-1);
    if (last && last.wide === wide && (!wide || (it.k === "img" && last.items.at(-1)?.k === "img"))) last.items.push(it);
    else out.push({ wide, items: [it] });
  }
  return out;
}

/** Page layout: text in a readable column, framed blocks across the rail. */
function Wide({ items, ctx }: { items: Item[]; ctx: Ctx }) {
  return (
    <>
      {runs(items).map((r, i) =>
        r.wide ? (
          <Rail key={i} className="p-2 sm:p-4">
            {r.items.length >= 4 && r.items.every((it) => it.k === "img") ? (
              <Gallery images={r.items as Extract<Block, { k: "img" }>[]} />
            ) : r.items.length > 1 ? (
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                {r.items.map((it, j) => (
                  <BlockView key={j} item={it} ctx={ctx} />
                ))}
              </div>
            ) : (
              <BlockView item={r.items[0]} ctx={ctx} />
            )}
          </Rail>
        ) : (
          <Rail key={i} className="px-4 py-6 sm:px-6">
            <div className="max-w-3xl">
              <Flow items={r.items} ctx={ctx} />
            </div>
          </Rail>
        ),
      )}
    </>
  );
}

/** Many images in a row (logos, thumbnails): small tiles instead of full frames. */
function Gallery({ images }: { images: Extract<Block, { k: "img" }>[] }) {
  return (
    <Frame>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
        {images.map((img, i) => (
          <Panel key={i} className="flex h-24 items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote images from arbitrary hosts */}
            <img src={img.src} alt={img.alt} loading="lazy" referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain" />
          </Panel>
        ))}
      </div>
    </Frame>
  );
}

/** Article layout: everything in one reading column. */
function Flow({ items, ctx }: { items: Item[]; ctx: Ctx }) {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    // Consecutive disclosures read as one FAQ list.
    if (it.k === "details") {
      const group: Extract<Block, { k: "details" }>[] = [];
      while (items[i]?.k === "details") group.push(items[i++] as Extract<Block, { k: "details" }>);
      i--;
      out.push(<Disclosures key={i} items={group} ctx={ctx} />);
      continue;
    }
    out.push(
      <div key={i} className="mt-5 first:mt-0">
        <BlockView item={it} ctx={ctx} />
      </div>,
    );
  }
  return <>{out}</>;
}

/** A list whose items are each essentially one link: menus, actions, indexes. */
function linkList(b: Extract<Block, { k: "list" }>) {
  return (
    b.items.length >= 4 &&
    b.items.every((it) => {
      const total = it.c.reduce((n, s) => n + s.t.trim().length, 0);
      const linked = it.c.filter((s) => s.href).reduce((n, s) => n + s.t.trim().length, 0);
      return new Set(it.c.filter((s) => s.href).map((s) => s.href)).size === 1 && linked / Math.max(total, 1) >= 0.7;
    })
  );
}

function BlockView({ item, ctx }: { item: Item; ctx: Ctx }) {
  const { t, v } = ctx;
  const body = ctx.article ? prose[v] : `${t.body} text-gray-950/70`;

  switch (item.k) {
    case "h":
      return <h3 className={`pt-3 ${t.cellTitle}`}>{item.text}</h3>;

    case "p":
      return (
        <p className={body}>
          <Inlines c={item.c} ctx={ctx} />
        </p>
      );

    case "list":
      if (linkList(item)) {
        return (
          <Frame>
            <Panel className="divide-y divide-gray-950/5 overflow-hidden">
              {item.items.map((it, i) => (
                <A
                  key={i}
                  href={it.c.find((s) => s.href)!.href!}
                  ctx={ctx}
                  className="group flex items-center justify-between gap-4 px-4 py-3 text-sm/6 text-gray-950 transition-colors hover:bg-gray-950/[0.02] sm:px-5"
                >
                  <span style={{ paddingLeft: `${it.depth * 1}rem` }}>{it.c.map((s) => s.t).join("")}</span>
                  <Arrow className="shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-950" />
                </A>
              ))}
            </Panel>
          </Frame>
        );
      }
      return (
        <ul className={`space-y-2 ${body}`}>
          {item.items.map((it, i) => (
            <li key={i} className="flex gap-3" style={{ paddingLeft: `${it.depth * 1.25}rem` }}>
              {item.ordered && it.depth === 0 ? (
                <span className="w-6 shrink-0 pt-px font-mono text-xs/[1.75rem] text-gray-400 tabular-nums">
                  {String(item.items.slice(0, i + 1).filter((x) => x.depth === 0).length).padStart(2, "0")}
                </span>
              ) : (
                <span className="mt-[0.75em] size-1.5 shrink-0 rounded-full bg-gray-950/25" />
              )}
              <span className="min-w-0">
                <Inlines c={it.c} ctx={ctx} />
              </span>
            </li>
          ))}
        </ul>
      );

    case "quote":
      return (
        <blockquote className={`border-s-2 border-gray-950 py-1 ps-5 ${quoteStyle[v]}`}>
          <Inlines c={item.c} ctx={ctx} />
        </blockquote>
      );

    case "code":
      return (
        <Frame>
          <Panel className="overflow-x-auto">
            <pre className="p-4 font-mono text-[0.8125rem]/6 text-gray-800">{item.text}</pre>
          </Panel>
        </Frame>
      );

    case "hr":
      return <div className="border-t border-gray-950/10" />;

    case "img":
      return (
        <Frame>
          <Panel className="hatch overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote images from arbitrary hosts */}
            <img src={item.src} alt={item.alt} loading="lazy" referrerPolicy="no-referrer" className="mx-auto h-auto max-h-[36rem] w-auto max-w-full" />
          </Panel>
          {item.caption && (
            <Panel className="px-4 py-2.5">
              <p className="font-mono text-xs/5 text-gray-500">{item.caption}</p>
            </Panel>
          )}
        </Frame>
      );

    case "table":
      return (
        <Frame>
          <Panel className="overflow-x-auto">
            <table className="w-full text-left text-sm/6">
              {item.head.length > 0 && (
                <thead className="border-b border-gray-950/5">
                  <tr>
                    {item.head.map((h, i) => (
                      <th key={i} className="px-4 py-2.5 font-mono text-xs/5 font-medium whitespace-nowrap text-gray-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-gray-950/5">
                {item.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className={`px-4 py-3 align-top ${j === 0 ? "text-gray-950" : "text-gray-600"}`}>
                        <Inlines c={cell} ctx={ctx} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </Frame>
      );

    case "rows":
      return (
        <Frame>
          <Panel className="divide-y divide-gray-950/5 overflow-hidden">
            {item.items.map((row, i) => (
              <div key={i} className="px-4 py-3 sm:px-5">
                <p className={`text-gray-950 ${v === "v1" ? "font-serif text-lg/7 tracking-[-0.01em]" : "text-[0.9375rem]/6 font-medium"}`}>
                  <Inlines c={row.main} ctx={ctx} quiet />
                </p>
                {row.meta.map((m, j) => (
                  <p key={j} className="mt-0.5 text-xs/5 text-gray-500">
                    <Inlines c={m} ctx={ctx} quiet />
                  </p>
                ))}
              </div>
            ))}
          </Panel>
        </Frame>
      );

    case "cards":
      return (
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {item.cards.map((card, i) => (
            <Frame key={i}>
              <Panel className="flex-1 p-5 sm:p-6">
                <h3 className={t.cellTitle}>{card.title}</h3>
                <div className="mt-2 space-y-3">
                  {card.blocks.map((b, j) => (
                    <div key={j} className="text-sm/6 [&_p]:text-sm/6">
                      <BlockView item={b} ctx={{ ...ctx, article: false }} />
                    </div>
                  ))}
                </div>
              </Panel>
            </Frame>
          ))}
        </div>
      );

    case "stats":
      return (
        <div className="-mx-2 grid grid-cols-2 gap-px bg-gray-950/5 sm:-mx-4 sm:grid-cols-4">
          {item.items.map((s, i) => (
            <div key={i} className="bg-white px-4 py-6 sm:px-6">
              <p className={`tabular-nums ${t.stat}`}>{s.value}</p>
              <p className="mt-3 text-sm/5 text-gray-500">
                <Inlines c={s.label} ctx={ctx} quiet />
              </p>
            </div>
          ))}
        </div>
      );

    case "form":
      return <FormView form={item} ctx={ctx} />;

    case "details":
      return <Disclosures items={[item]} ctx={ctx} />;
  }
}

function Disclosures({ items, ctx }: { items: Extract<Block, { k: "details" }>[]; ctx: Ctx }) {
  return (
    <div className="mt-5 divide-y divide-gray-950/5 border-y border-gray-950/5 first:mt-0">
      {items.map((d, i) => (
        <details key={i} className="group">
          <summary className={`flex cursor-pointer list-none items-center justify-between gap-6 py-4 [&::-webkit-details-marker]:hidden ${ctx.t.question}`}>
            {d.summary}
            <span className="relative size-3.5 shrink-0 text-gray-400">
              <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
              <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current transition-transform group-open:scale-y-0" />
            </span>
          </summary>
          {/* Fragment links to this id auto-open the <details> in Chromium. */}
          <div id={d.id} className="scroll-mt-20 pb-6">
            <Flow items={d.blocks} ctx={ctx} />
          </div>
        </details>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Forms: real fields that submit to the original site.
 * ------------------------------------------------------------------------- */

const control =
  "w-full rounded-lg bg-white px-3 py-2 text-[0.9375rem]/6 text-gray-950 ring-1 ring-gray-950/10 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-gray-950/30";

function FormView({ form, ctx }: { form: Extract<Block, { k: "form" }>; ctx: Ctx }) {
  const visible = form.fields.filter((f) => f.type !== "hidden");
  const compact = visible.length === 1 && visible[0].kind === "input";
  return (
    <Frame className="max-w-2xl">
      <Panel>
        <form
          action={form.action}
          method={form.method}
          target="_blank"
          className={compact ? "flex flex-wrap items-end gap-3 p-4 sm:p-5" : "grid gap-5 p-5 sm:p-6"}
        >
          {form.fields
            .filter((f) => f.type === "hidden")
            .map((f, i) => (
              <input key={`h${i}`} type="hidden" name={f.name} defaultValue={f.value} />
            ))}
          {visible.map((f, i) => (
            <FieldView key={i} field={f} ctx={ctx} grow={compact} />
          ))}
          <div>
            <button
              type="submit"
              className="rounded-full bg-gray-950 px-4 py-2 text-sm/6 font-semibold text-white transition-colors hover:bg-gray-800"
            >
              {form.submit}
            </button>
          </div>
        </form>
      </Panel>
    </Frame>
  );
}

function FieldView({ field: f, ctx, grow }: { field: Field; ctx: Ctx; grow: boolean }) {
  const label = f.label && (
    <span className="mb-1.5 block text-sm/6 font-medium text-gray-950">
      {f.label}
      {f.required && <span className="text-gray-400"> *</span>}
    </span>
  );

  if (f.kind === "choice") {
    return (
      <fieldset>
        {f.label && <legend className="mb-1.5 text-sm/6 font-medium text-gray-950">{f.label}</legend>}
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {f.options.map((o, i) => (
            <label key={i} className={`flex items-center gap-2 ${ctx.t.small} text-gray-700`}>
              <input type={f.type} name={f.name} value={o.value} className="size-4 accent-gray-950" />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <label className={grow ? "min-w-48 flex-1" : "block"}>
      {label}
      {f.kind === "textarea" ? (
        <textarea name={f.name} required={f.required} placeholder={f.placeholder} defaultValue={f.value} rows={4} className={control} />
      ) : f.kind === "select" ? (
        <select name={f.name} required={f.required} multiple={f.multiple} defaultValue={f.multiple ? undefined : f.value || undefined} className={control}>
          {f.options.map((o, i) => (
            <option key={i} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input type={f.type} name={f.name} required={f.required} placeholder={f.placeholder} defaultValue={f.value} className={control} />
      )}
    </label>
  );
}
