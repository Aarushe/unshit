import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Redesigned } from "@/components/redesigned";
import type { Variant } from "@/components/site";
import type { Page } from "@/lib/extract";
import { redesign } from "@/lib/redesign";

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
  if (!url) redirect("/");
  // Always fetched live at request time.
  await connection();
  const variant: Variant = v === "0" ? "v0" : "v1";

  let page: Page;
  try {
    page = await redesign(url);
  } catch (err) {
    return <Failed url={url} message={err instanceof Error ? err.message : "Something went wrong."} />;
  }

  const href = (to: string) => `/redesign/view?url=${encodeURIComponent(url)}&v=${to}`;
  return (
    <Redesigned
      page={page}
      variant={variant}
      alternate={href(variant === "v1" ? "0" : "1")}
      banner={<Toolbar page={page} variant={variant} href={href} />}
    />
  );
}

function Toolbar({ page, variant, href }: { page: Page; variant: Variant; href: (v: string) => string }) {
  return (
    <div className="bg-gray-950 font-sans text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 sm:px-6">
        <p className="min-w-0 truncate font-mono text-xs/6 text-white/60">
          redesign of <span className="text-white">{page.host}</span>
        </p>
        <div className="flex items-center gap-4 text-xs/6">
          <div className="flex rounded-full bg-white/10 p-0.5">
            {[
              ["1", "Serif"],
              ["0", "Sans"],
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
          <a href={page.url} target="_blank" rel="noreferrer" className="text-white/60 hover:text-white">
            Original ↗
          </a>
          <Link href="/" className="text-white/60 hover:text-white">
            New URL
          </Link>
        </div>
      </div>
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
              href="/"
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
