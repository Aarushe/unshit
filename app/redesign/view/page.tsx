import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Site, type Variant } from "@/components/site";
import { redesign, type Redesign } from "@/lib/redesign";

type Search = { url?: string; v?: string };

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Search>;
}): Promise<Metadata> {
  const { url } = await searchParams;
  return { title: url ? `Redesign · ${url}` : "Redesign" };
}

export default async function RedesignView({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { url, v } = await searchParams;
  if (!url) redirect("/redesign");
  // Always fetched live at request time.
  await connection();
  const variant: Variant = v === "1" ? "v1" : "v0";

  let result: Redesign;
  try {
    result = await redesign(url);
  } catch (err) {
    return <Failed url={url} message={err instanceof Error ? err.message : "Something went wrong."} />;
  }

  const other = `/redesign/view?url=${encodeURIComponent(url)}&v=${variant === "v1" ? "0" : "1"}`;
  return (
    <Site
      variant={variant}
      content={result.content}
      links={{ alternate: other, action: result.url, source: result.url }}
      banner={<Toolbar result={result} variant={variant} url={url} />}
    />
  );
}

function Toolbar({ result, variant, url }: { result: Redesign; variant: Variant; url: string }) {
  const href = (v: string) => `/redesign/view?url=${encodeURIComponent(url)}&v=${v}`;
  return (
    <div className="bg-gray-950 font-sans text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 sm:px-6">
        <p className="flex min-w-0 items-center gap-2 font-mono text-xs/6 text-white/60">
          <span className="truncate">
            redesign of <span className="text-white">{result.host}</span>
          </span>
          <span
            title={result.note}
            className="shrink-0 rounded-full bg-white/10 px-1.5 text-[0.6875rem]/5 text-white/80"
          >
            {result.source === "claude" ? "via claude" : "heuristic"}
          </span>
        </p>
        <div className="flex items-center gap-4 text-xs/6">
          <div className="flex rounded-full bg-white/10 p-0.5">
            {[
              ["0", "Sans"],
              ["1", "Serif"],
            ].map(([v, label]) => {
              const active = (variant === "v1" ? "1" : "0") === v;
              return (
                <Link
                  key={v}
                  href={href(v)}
                  className={`rounded-full px-2.5 ${active ? "bg-white text-gray-950" : "text-white/60 hover:text-white"}`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <a href={result.url} target="_blank" rel="noreferrer" className="text-white/60 hover:text-white">
            Original ↗
          </a>
          <Link href="/redesign" className="text-white/60 hover:text-white">
            New URL
          </Link>
        </div>
      </div>
      {result.note && (
        <p className="border-t border-white/10 px-4 py-1.5 text-center font-mono text-[0.6875rem]/5 text-white/45">
          {result.note}
        </p>
      )}
    </div>
  );
}

function Failed({ url, message }: { url: string; message: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-gray-950/[0.025] p-1.5 ring-1 ring-gray-950/5 ring-inset">
        <div className="rounded-xl bg-white shadow-xs ring-1 ring-gray-950/5">
          <div className="border-b border-gray-950/5 px-4 py-2.5 font-mono text-xs/5 text-gray-950">
            error.txt <span className="text-gray-400">· {url}</span>
          </div>
          <div className="p-5">
            <p className="text-base/7 font-semibold tracking-tight">Couldn&apos;t redesign that page</p>
            <p className="mt-1 text-sm/6 text-gray-600">{message}</p>
            <Link
              href="/redesign"
              className="mt-5 inline-block rounded-full bg-gray-950 px-4 py-1.5 text-sm/6 font-semibold text-white hover:bg-gray-800"
            >
              Try another URL
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
