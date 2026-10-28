import type { Metadata } from "next";
import { Hero, Install, Page, Row, repo } from "@/components/landing";

export const metadata: Metadata = {
  title: "Redesign any site — New Internet Society",
};

const rules = [
  ["Text first", "Pictures stay only when they're content. Hero art, banners and promo slides go."],
  ["Nothing moves", "No animations, sliding or parallax. Carousels are shown whole, every slide at once."],
  ["Nothing spills", "Titles and buttons wrap instead of ending in “…”, and the page never scrolls sideways."],
  ["Nothing empty", "Unnamed links, arrow-only buttons and pagers are left out."],
  ["Same order", "The page's own order is kept. Only a page that is a form leads with it."],
  ["Same words", "Nothing is added or rewritten. Shouted capitals are set in sentence case."],
];

const questions = [
  [
    "Does it change the site?",
    "No. The original page stays loaded underneath, hidden. “original ↗” in the footer shows it as the site built it.",
  ],
  [
    "Do forms, logins and checkouts still work?",
    "Yes. The page's own fields and buttons are moved into the new layout, so validation, captchas and scripts work as before.",
  ],
  [
    "Is anything sent to a server?",
    "No. The extension runs entirely in your browser; the page never leaves it.",
  ],
  [
    "What about web apps?",
    "Editors, maps and dense dashboards keep their layout and get the design restyled in place instead.",
  ],
];

function Section({ id, n, title, children }: { id?: string; n: string; title: string; children: React.ReactNode }) {
  return (
    <>
      <Row id={id} className="flex items-baseline justify-between gap-4 px-4 py-3 sm:px-6">
        <h2 className="font-serif text-[1.75rem]/[1.2] tracking-[-0.03em]">{title}</h2>
        <span className="font-mono text-xs text-gray-950/35">{n}</span>
      </Row>
      {children}
    </>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return <Row className="space-y-4 px-4 py-4 text-base/7 text-pretty text-gray-950/70 sm:px-6">{children}</Row>;
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-sm bg-gray-950/[0.04] px-1 font-mono text-[0.8125rem] text-gray-950 ring-1 ring-gray-950/10 ring-inset">
      {children}
    </kbd>
  );
}

export default function V1() {
  return (
    <Page>
      <Hero />
      <Install href="#extension" />
      <Row className="hatch h-16 sm:h-24" />

      <Section n="01" title="One layout for every site">
        <Prose>
          <p>
            Every site invents its own interface: its own menus, pop-ups, banners and type. You
            learn a new one each time you open a link, and most of it is in the way.
          </p>
          <p>
            We read a page for what it is (who the site is, where you can go, what it wants you to
            know and what you came to do) and set it again from one set of building blocks. Same
            headings, same lists, same forms, on every site you visit.
          </p>
        </Prose>
      </Section>

      <Section n="02" title="The rules">
        <Row className="grid sm:grid-cols-2">
          {rules.map(([title, body], i) => (
            <div
              key={title}
              className={`border-gray-950/5 px-4 py-4 sm:px-6 ${i > 0 ? "border-t" : ""} ${i === 1 ? "sm:border-t-0" : ""} sm:odd:border-r`}
            >
              <h3 className="text-[0.9375rem]/6 font-medium text-gray-950">{title}</h3>
              <p className="mt-1 text-sm/6 text-pretty text-gray-950/60">{body}</p>
            </div>
          ))}
        </Row>
      </Section>

      <Section n="03" title="How to use it">
        <Prose>
          <p>
            Click the icon or press <Key>Alt</Key> <Key>Shift</Key> <Key>R</Key> on any site. It
            stays on for that site, so every page loads already redesigned. Click again to turn it
            off.
          </p>
        </Prose>
      </Section>

      <Section id="extension" n="04" title="Get the extension">
        <Prose>
          <p>
            It isn&rsquo;t in the stores yet. Install it straight from{" "}
            <a href={repo} target="_blank" rel="noreferrer" className="text-gray-950 underline decoration-gray-950/20 underline-offset-2 hover:decoration-gray-950">
              GitHub
            </a>{" "}
            in Chrome, Edge, Brave or Arc:
          </p>
          <ol className="list-decimal space-y-1 pl-5 marker:font-mono marker:text-xs marker:text-gray-950/35">
            <li>
              <a href={`${repo}/archive/refs/heads/main.zip`} className="text-gray-950 underline decoration-gray-950/20 underline-offset-2 hover:decoration-gray-950">
                Download the code
              </a>{" "}
              and unzip it.
            </li>
            <li>
              Open <code className="font-mono text-sm text-gray-950">chrome://extensions</code> and turn on
              Developer mode.
            </li>
            <li>
              Click Load unpacked and choose the <code className="font-mono text-sm text-gray-950">extension</code>{" "}
              folder inside it.
            </li>
            <li>Pin Redesign from the puzzle-piece menu.</li>
          </ol>
          <p className="text-sm/6 text-gray-950/55">
            Firefox 128+ and Safari 17+ work too; the{" "}
            <a href={`${repo}/tree/main/extension#install`} target="_blank" rel="noreferrer" className="underline decoration-gray-950/20 underline-offset-2 hover:text-gray-950">
              README
            </a>{" "}
            has the steps.
          </p>
        </Prose>
      </Section>

      <Section n="05" title="Limits">
        <Prose>
          <ul className="list-disc space-y-1 pl-5 marker:text-gray-950/25">
            <li>It keeps the content a page has. It never invents any.</li>
            <li>Embedded widgets from other sites, like some payment and login boxes, are left out.</li>
            <li>Browser pages, extension stores and PDFs can&rsquo;t be redesigned.</li>
          </ul>
        </Prose>
      </Section>

      <Section n="06" title="Questions">
        <Row>
          {questions.map(([q, a], i) => (
            <details key={q} className={`group border-gray-950/5 ${i > 0 ? "border-t" : ""}`}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-[0.9375rem]/6 text-gray-950 sm:px-6 [&::-webkit-details-marker]:hidden">
                {q}
                <span className="font-mono text-xs text-gray-950/35 group-open:rotate-45">+</span>
              </summary>
              <p className="px-4 pb-4 text-sm/6 text-pretty text-gray-950/60 sm:px-6">{a}</p>
            </details>
          ))}
        </Row>
      </Section>

      <Row className="px-4 py-5 sm:px-6">
        <p className="text-sm/6 text-gray-950/55">
          Made by{" "}
          <a href="https://x.com/aarushe_reddy" target="_blank" rel="noreferrer" className="text-gray-950 hover:underline">
            @aarushe_reddy
          </a>
          . Set in LT Superior Serif and Inter Display.
        </p>
      </Row>
    </Page>
  );
}
