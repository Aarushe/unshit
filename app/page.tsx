import { AltKey } from "@/components/alt-key";
import { Examples, type Example } from "@/components/examples";
import { Hero, Install, Page, Row, repo } from "@/components/landing";

// Before and after screenshots of real sites, in public/examples. An entry
// without screenshots shows a placeholder.
const examples: Example[] = [
  {
    site: "indianvisaonline.gov.in",
    before: "/examples/indian-evisa-before.png",
    after: "/examples/indian-evisa-after.png",
  },
  {
    site: "vfsglobal.com",
    before: "/examples/vfs-global-before.jpg",
    after: "/examples/vfs-global-after.png",
  },
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
      <Row id={id} className="group/section flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <h2 className="rise font-serif text-[1.75rem]/[1.2] tracking-[-0.03em]">{title}</h2>
        <span className="font-mono text-xs text-gray-950/35 transition-colors duration-150 group-hover/section:text-gray-950/70">{n}</span>
      </Row>
      {children}
      <Row className="h-10 sm:h-14" />
    </>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <Row className="px-4 py-5 text-base/7 text-pretty text-gray-950/70 sm:px-6">
      <div className="rise space-y-4 [--i:1]">{children}</div>
    </Row>
  );
}

// Rows with a muted mark (a number or a dot) before each item.
function List({ marks, items }: { marks: string[]; items: React.ReactNode[] }) {
  return (
    <div className="flex flex-col">
      {items.map((item, i) => (
        <div key={i} className="flex items-baseline gap-3 py-0.5">
          <span className="w-3 shrink-0 font-mono text-xs text-gray-950/35">
            {marks[i]}
          </span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="keycap inline-block rounded-sm bg-fill px-1 font-mono text-[0.8125rem] text-gray-950">
      {children}
    </kbd>
  );
}

export default function Home() {
  return (
    <Page>
      <Hero />
      <Install />
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

      <Section id="examples" n="02" title="Test here">
        <Row className="p-2 sm:p-4">
          <div className="rise [--i:1]">
            <Examples items={examples} />
          </div>
        </Row>
      </Section>

      <Section n="03" title="How to use it">
        <Prose>
          <p>
            Click the icon or press <Key><AltKey /></Key> <Key>Shift</Key> <Key>R</Key> on any site. It
            stays on for that site, so every page loads already redesigned. Click again to turn it
            off.
          </p>
        </Prose>
      </Section>

      <Section id="extension" n="04" title="Get the extension">
        <Prose>
          <p>
            It isn&rsquo;t in the stores yet. Install it straight from{" "}
            <a href={repo} target="_blank" rel="noreferrer" className="link">
              GitHub
            </a>{" "}
            in Chrome, Edge, Brave or Arc:
          </p>
          <List
            marks={["1.", "2.", "3.", "4."]}
            items={[
              <>
                <a href={`${repo}/archive/refs/heads/main.zip`} className="link">
                  Download the code
                </a>{" "}
                and unzip it.
              </>,
              <>
                Open <code className="font-mono text-sm text-gray-950">chrome://extensions</code> and turn on
                Developer mode.
              </>,
              <>
                Click Load unpacked and choose the <code className="font-mono text-sm text-gray-950">extension</code>{" "}
                folder inside it.
              </>,
              "Pin Redesign from the puzzle-piece menu.",
            ]}
          />
          <p className="text-sm/6 text-gray-950/55">
            Firefox 128+ and Safari 17+ work too; the{" "}
            <a href={`${repo}/tree/main/extension#install`} target="_blank" rel="noreferrer" className="link">
              README
            </a>{" "}
            has the steps.
          </p>
        </Prose>
      </Section>

      <Section n="05" title="Limits">
        <Prose>
          <List
            marks={["·", "·", "·"]}
            items={[
              "It keeps the content a page has. It never invents any.",
              "Embedded widgets from other sites, like some payment and login boxes, are left out.",
              <>Browser pages, extension stores and PDFs can&rsquo;t be redesigned.</>,
            ]}
          />
        </Prose>
      </Section>

      <Section n="06" title="Questions">
        <Row>
          {questions.map(([q, a], i) => (
            <details
              key={q}
              className={`rise group border-gray-950/5 ${i > 0 ? "border-t" : ""}`}
              style={{ "--i": i + 1 } as React.CSSProperties}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-[0.9375rem]/6 text-gray-950 transition-colors duration-500 ease-in-out hover:bg-fill sm:px-6 [&::-webkit-details-marker]:hidden">
                {q}
                <span className="font-mono text-xs text-gray-950/35 transition-[rotate,color] duration-150 ease-(--ease-out) group-open:rotate-45 group-hover:text-gray-950/70">+</span>
              </summary>
              <p className="px-4 pb-4 text-sm/6 text-pretty text-gray-950/60 sm:px-6">{a}</p>
            </details>
          ))}
        </Row>
      </Section>

    </Page>
  );
}
