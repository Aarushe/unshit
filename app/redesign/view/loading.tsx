export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-gray-950/[0.025] p-1.5 ring-1 ring-gray-950/5 ring-inset">
        <div className="rounded-xl bg-white shadow-xs ring-1 ring-gray-950/5">
          <div className="border-b border-gray-950/5 px-4 py-2.5 font-mono text-xs/5 text-gray-950">
            redesign.log <span className="text-gray-400">· working</span>
          </div>
          <ol className="space-y-1 p-5 font-mono text-[0.8125rem]/6 text-gray-500">
            <li>fetching the page…</li>
            <li>pulling out what it says…</li>
            <li className="text-gray-950">
              setting it in type <span className="animate-pulse">▍</span>
            </li>
          </ol>
        </div>
        <div className="hatch mt-1.5 h-16 rounded-xl ring-1 ring-gray-950/5" />
      </div>
    </div>
  );
}
