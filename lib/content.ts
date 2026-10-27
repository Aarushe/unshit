import type { SiteContent } from "./schema";

// Placeholder copy until the real words land. Both versions render this shape.

export const defaultContent: SiteContent = {
  name: "New Internet Society",
  label: "cohort 05",
  badge: "Cohort 05 applications are open",
  meta: ["est. 2024", "members-only", "free"],
  headline: "The internet is still being written.",
  tagline:
    "A society for the people building the internet we actually want to live on",
  intro:
    "A society for the people building the internet we actually want to live on. We meet, make things in public, and fund the corners nobody else will.",
  highlights: ["personal sites", "open protocols", "community archives"],
  stats: [
    { value: "412", label: "members" },
    { value: "38", label: "cities" },
    { value: "$210k", label: "granted" },
  ],
  spotlight: {
    initials: "AM",
    title: "Ada Moreno",
    subtitle: "Archivist · Lisbon · ada.garden",
    body: "Building a reading list that never ends, and a tiny tool to share it over RSS.",
    tags: ["Fellow ’26", "Salon host", "Grantee"],
    ref: "#0412",
  },
  statement: {
    title: "charter",
    note: "signed by 412",
    lines: [
      "We the members of the New Internet Society",
      "agree to build in the open,",
      "to credit the people we learn from,",
      "to keep our corners of the web",
      "readable, linkable and kind,",
      "and to leave every tool, archive",
      "and conversation better than we found it.",
    ],
  },
  command: 'nis join --site ada.garden --building "a reading list that never ends"',
  sections: {
    principles: {
      eyebrow: "Principles",
      title: "Six things we believe about the web.",
      body: "Not rules, more like defaults. Everything we fund, host and build starts from here.",
    },
    programs: {
      eyebrow: "Programs",
      title: "Ways to take part, from one dinner to twelve weeks.",
      body: "",
    },
    events: {
      eyebrow: "Upcoming",
      title: "Salons, demos and workshops.",
      body: "Most events are hosted by members in their own cities. Anyone can come to their first one.",
    },
  },
  principles: [
    {
      title: "Own your corner",
      body: "A home on the web you control: your domain, your words, your rules. Platforms are rented rooms.",
    },
    {
      title: "Protocols over platforms",
      body: "Build on open standards that outlive any company. If it can't be forked, it can be taken away.",
    },
    {
      title: "Slow is a feature",
      body: "Fewer notifications, longer thoughts. We optimise for what's still worth reading in ten years.",
    },
    {
      title: "Make it in public",
      body: "Share the sketch, not just the launch. Half-finished work is how other people find a way in.",
    },
    {
      title: "Small is beautiful",
      body: "Software for forty people is still software. Not everything needs to scale to matter.",
    },
    {
      title: "Leave it better",
      body: "Document the path, maintain the commons, and hold the door open for whoever comes next.",
    },
  ],
  programs: [
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
  ],
  events: [
    { date: "Nov 06", city: "London", title: "Salon: What is a homepage for?", type: "Salon" },
    { date: "Nov 14", city: "Online", title: "Fellowship demo night, cohort 04", type: "Demo" },
    { date: "Nov 21", city: "New York", title: "Salon: Feeds without algorithms", type: "Salon" },
    { date: "Dec 03", city: "Bengaluru", title: "Workshop: Your first RSS reader", type: "Workshop" },
    { date: "Dec 12", city: "Berlin", title: "Salon: The small web, revisited", type: "Salon" },
  ],
  faqs: [
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
  ],
  cta: {
    title: "Come build the next draft with us.",
    body: "Tell us what you're making. A member reads every application and replies within two weeks.",
    primary: "Apply for membership",
    secondary: "Get the monthly letter",
  },
};

/** /1 keeps its own, more editorial copy on top of the same content. */
export const defaultContentV1: SiteContent = {
  ...defaultContent,
  headline:
    "A society for the people building the internet we actually want to live on",
  intro:
    "Builders, writers and researchers who think the web is unfinished. We meet, make things in public, and fund the quieter corners with fellowships, salons and small grants.",
  sections: {
    ...defaultContent.sections,
    principles: {
      ...defaultContent.sections.principles,
      title: "Six things we believe about the web",
    },
    programs: {
      ...defaultContent.sections.programs,
      title: "Ways to take part, from one dinner to twelve weeks",
    },
    events: { ...defaultContent.sections.events, eyebrow: "Gatherings", title: "Salons, demos and workshops" },
  },
  cta: { ...defaultContent.cta, title: "Come build the next draft with us" },
};
