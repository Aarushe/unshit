import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { digest, heuristicContent, outline, type PageDigest } from "./extract";
import { fetchPage } from "./fetch-page";
import { siteContentSchema, type SiteContent } from "./schema";

export type Redesign = {
  url: string;
  host: string;
  content: SiteContent;
  /** "claude" when the model restructured the page, "heuristic" otherwise. */
  source: "claude" | "heuristic";
  /** Why Claude wasn't used, when it wasn't. */
  note?: string;
};

const SYSTEM = `You restructure the content of an existing website so it can be re-rendered in a new design system.

You receive a text outline of one web page. Fill every field of the output schema using that page's real content.

Rules:
- Ground everything in the page. Never invent facts, numbers, people, prices, dates or quotes. If the page has no stats, events or FAQs, return empty arrays for them.
- Rewrite for clarity and brevity in the site's own voice; you may tighten wording but not change meaning.
- Headline: the page's core promise in at most 9 words. Tagline: one plain sentence.
- principles: the page's key values, features or reasons to care (3 or 6). programs: its concrete products, services, plans or offerings (2 or 4).
- events: dated items only (posts, releases, events).
- statement.lines: the mission/about text broken into 4–8 short lines that read well in a monospace editor.
- spotlight: one real testimonial, person, product or plan from the page.
- command: a short, plausible shell-style one-liner that fits the site (e.g. "npm i <pkg>", "open https://<host>"), or empty.
- Use plain ASCII punctuation in tags and slugs.`;

const cache = new Map<string, { at: number; value: Redesign }>();
const TTL_MS = 30 * 60 * 1000;

function hasCredentials() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

async function withClaude(d: PageDigest): Promise<SiteContent> {
  const client = new Anthropic();
  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(siteContentSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: outline(d) }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Claude declined to restructure this page.");
  }
  if (response.stop_reason === "max_tokens" || !response.parsed_output) {
    throw new Error("Claude's response was incomplete.");
  }
  return response.parsed_output;
}

function describeError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "The Anthropic API key was rejected.";
  if (err instanceof Anthropic.RateLimitError) return "Claude is rate limited right now.";
  if (err instanceof Anthropic.APIError) return `Claude API error ${err.status ?? ""}`.trim() + ".";
  return err instanceof Error ? err.message : "Claude was unavailable.";
}

export async function redesign(input: string): Promise<Redesign> {
  const key = input.trim().toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

  const { url, html } = await fetchPage(input);
  const d = digest(html, url);
  if (d.blocks.length < 3) {
    throw new Error(
      `${d.host} returned almost no readable text. It may render everything with JavaScript.`,
    );
  }

  let value: Redesign;
  if (!hasCredentials()) {
    value = {
      url: d.url,
      host: d.host,
      content: heuristicContent(d),
      source: "heuristic",
      note: "No ANTHROPIC_API_KEY set, so content was mapped with heuristics.",
    };
  } else {
    try {
      value = { url: d.url, host: d.host, content: await withClaude(d), source: "claude" };
    } catch (err) {
      console.error("[redesign] Claude failed, using heuristics:", err);
      value = {
        url: d.url,
        host: d.host,
        content: heuristicContent(d),
        source: "heuristic",
        note: describeError(err),
      };
    }
  }

  cache.set(key, { at: Date.now(), value });
  return value;
}
