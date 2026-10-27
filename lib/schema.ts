import { z } from "zod";

// The shape both designs render. Anything a redesign produces must fit this.

const sectionHead = z.object({
  eyebrow: z.string().describe("1–2 word section label, e.g. 'Principles'"),
  title: z.string().describe("Section heading, a short sentence"),
  body: z.string().describe("One supporting sentence, or empty string"),
});

export const siteContentSchema = z.object({
  name: z.string().describe("Site or organisation name"),
  label: z
    .string()
    .describe("Tiny lowercase tag shown next to the name, ≤3 words, e.g. 'cohort 05'"),
  badge: z
    .string()
    .describe("Short status line above the headline, e.g. 'Applications are open'"),
  meta: z
    .array(z.string())
    .describe("2–3 tiny lowercase facts, e.g. 'est. 2024', 'open source'"),
  headline: z.string().describe("Punchy hero headline, ≤9 words"),
  tagline: z
    .string()
    .describe("One sentence on what this is and who it is for, no trailing period"),
  intro: z.string().describe("2–3 sentence description"),
  highlights: z
    .array(z.string())
    .describe("Exactly 3 short noun phrases the site is about, lowercase"),
  stats: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .describe("0–3 real numbers from the page; empty if none are stated"),
  spotlight: z
    .object({
      initials: z.string().describe("2 letters"),
      title: z.string(),
      subtitle: z.string(),
      body: z.string(),
      tags: z.array(z.string()),
      ref: z.string().describe("Short id like '#0412' or a year"),
    })
    .describe("One featured person, product, plan or testimonial from the page"),
  statement: z.object({
    title: z.string().describe("One lowercase word, e.g. 'charter', 'mission', 'about'"),
    lines: z
      .array(z.string())
      .describe("The site's mission or about text split into 4–8 short lines"),
    note: z.string().describe("Tiny caption, e.g. 'signed by 412' or 'since 2019'"),
  }),
  command: z
    .string()
    .describe("Optional one-line shell-style command that fits the site, or empty"),
  sections: z.object({
    principles: sectionHead,
    programs: sectionHead,
    events: sectionHead,
  }),
  principles: z
    .array(z.object({ title: z.string(), body: z.string() }))
    .describe("Exactly 3 or 6 values, features or reasons, each body ≤25 words"),
  programs: z
    .array(
      z.object({
        slug: z.string().describe("kebab-case id"),
        name: z.string(),
        kind: z.string().describe("Short qualifier, e.g. 'Monthly', '$12/mo', 'Beta'"),
        tags: z.array(z.string()).describe("1–2 short tags"),
        body: z.string().describe("≤30 words"),
      }),
    )
    .describe("2 or 4 products, services, plans or programmes"),
  events: z
    .array(
      z.object({
        date: z.string().describe("Short, e.g. 'Nov 06', 'v2.1', '2024'"),
        city: z.string().describe("Place, category or secondary detail"),
        title: z.string(),
        type: z.string().describe("One word"),
      }),
    )
    .describe("0–6 dated items: events, posts, releases, case studies"),
  faqs: z
    .array(z.object({ q: z.string(), a: z.string() }))
    .describe("0–4 questions and answers grounded in the page"),
  cta: z.object({
    title: z.string().describe("Closing heading, ≤8 words"),
    body: z.string().describe("One sentence"),
    primary: z.string().describe("Main button label, 2–4 words"),
    secondary: z.string().describe("Second button / input placeholder, 2–5 words"),
  }),
});

export type SiteContent = z.infer<typeof siteContentSchema>;

/** Links each design needs that aren't content. */
export type SiteLinks = {
  /** Where the other design version of this content lives. */
  alternate: string;
  /** Primary CTA target. */
  action: string;
  /** Set when rendering a redesign: the page we started from. */
  source?: string;
};
