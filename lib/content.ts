// Shared copy for both versions of the site. Placeholder until the real words land.

export const site = {
  name: "New Internet Society",
  tagline:
    "A society for the people building the internet we actually want to live on.",
  intro:
    "We're a small, invite-light community of builders, writers and researchers who think the web is still unfinished. We meet, make things in public, and fund the weird, useful corners nobody else will.",
  stats: [
    { value: "412", label: "members" },
    { value: "38", label: "cities" },
    { value: "$210k", label: "granted" },
  ],
};

export const principles = [
  {
    id: "01",
    title: "Own your corner",
    body: "A home on the web you control: your domain, your words, your rules. Platforms are rented rooms.",
  },
  {
    id: "02",
    title: "Protocols over platforms",
    body: "Build on open standards that outlive any company. If it can't be forked, it can be taken away.",
  },
  {
    id: "03",
    title: "Slow is a feature",
    body: "Fewer notifications, longer thoughts. We optimise for what's still worth reading in ten years.",
  },
  {
    id: "04",
    title: "Make it in public",
    body: "Share the sketch, not just the launch. Half-finished work is how other people find a way in.",
  },
  {
    id: "05",
    title: "Small is beautiful",
    body: "Software for forty people is still software. Not everything needs to scale to matter.",
  },
  {
    id: "06",
    title: "Leave it better",
    body: "Document the path, maintain the commons, and hold the door open for whoever comes next.",
  },
];

export const programs = [
  {
    slug: "fellowship",
    name: "Fellowship",
    kind: "12 weeks",
    tags: ["Cohort", "Remote"],
    body: "Twelve people, twelve weeks, one shipped project each. Weekly crits, a stipend, and a demo night at the end.",
  },
  {
    slug: "salons",
    name: "Salons",
    kind: "Monthly",
    tags: ["In person", "Dinner"],
    body: "A long table, a single question, no slides. Hosted by members in their own cities, open to friends.",
  },
  {
    slug: "grants",
    name: "Small grants",
    kind: "Rolling",
    tags: ["$1k – $10k", "No equity"],
    body: "Fast, no-strings money for tools, archives and experiments the market won't pay for. Decisions in two weeks.",
  },
  {
    slug: "commons",
    name: "The Commons",
    kind: "Always on",
    tags: ["Open source", "Library"],
    body: "A shared shelf of templates, essays and tiny tools members have made. Take what you need, add what you can.",
  },
];

export const events = [
  { date: "Nov 06", city: "London", title: "Salon: What is a homepage for?", type: "Salon" },
  { date: "Nov 14", city: "Online", title: "Fellowship demo night, cohort 04", type: "Demo" },
  { date: "Nov 21", city: "New York", title: "Salon: Feeds without algorithms", type: "Salon" },
  { date: "Dec 03", city: "Bengaluru", title: "Workshop: Your first RSS reader", type: "Workshop" },
  { date: "Dec 12", city: "Berlin", title: "Salon: The small web, revisited", type: "Salon" },
];

export const charter = [
  "We the members of the New Internet Society",
  "agree to build in the open,",
  "to credit the people we learn from,",
  "to keep our corners of the web",
  "readable, linkable and kind,",
  "and to leave every tool, archive",
  "and conversation better than we found it.",
];

export const faqs = [
  {
    q: "Who is this for?",
    a: "Anyone making something for the web that isn't trying to capture attention: engineers, designers, writers, archivists, teachers. No portfolio required.",
  },
  {
    q: "What does it cost?",
    a: "Membership is free. Some in-person events ask for a small contribution towards dinner, and nobody is turned away for not paying.",
  },
  {
    q: "How do I join?",
    a: "Apply with a short note about what you're building or want to build. A member reads every application and replies within two weeks.",
  },
  {
    q: "Can I start a chapter?",
    a: "Yes. Host three salons in your city and we'll give you a chapter page, a small budget and a lot of help.",
  },
];
