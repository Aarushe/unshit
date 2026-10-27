import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Redesign any site — New Internet Society",
};

const examples = ["htmx.org", "indieweb.org", "solar.lowtechmagazine.com", "are.na/about"];

export default function RedesignHome() {
  return (
    <div className="min-h-dvh overflow-x-clip">
      <header className="border-b border-gray-950/5">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            New Internet Society
          </Link>
          <span className="font-mono text-xs text-gray-500">/redesign</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl border-x border-gray-950/5">
        <div className="h-16 sm:h-24" />
        <div className="border-t border-gray-950/5 px-4 py-2 sm:px-6">
          <p className="font-mono text-xs/7 text-gray-950/35">paste a link · pick a voice · read it again</p>
        </div>
        <div className="border-t border-gray-950/5 px-4 py-3 sm:px-6">
          <h1 className="text-[2.75rem]/[1] tracking-[-0.05em] text-balance sm:text-6xl/[1]">
            Redesign any website.
          </h1>
        </div>
        <div className="border-t border-gray-950/5 px-4 py-3 sm:px-6">
          <p className="max-w-xl text-lg/8 text-gray-600">
            We read the page, pull out what it&apos;s actually saying, and set it in one of
            our two layouts. Your words, re-typeset.
          </p>
        </div>

        <div className="border-t border-gray-950/5 p-2 sm:p-4">
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
                <label className="flex items-center gap-3 px-4 py-4">
                  <span className="font-mono text-sm text-gray-400">$</span>
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
        </div>

        <div className="border-t border-gray-950/5 px-4 py-5 sm:px-6">
          <p className="font-mono text-xs/6 font-medium tracking-widest text-gray-500 uppercase">
            Try one
          </p>
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
        </div>
        <div className="hatch h-24 border-t border-gray-950/5" />
      </main>
    </div>
  );
}
