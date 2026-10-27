import "server-only";
import { readPage, type Page } from "./extract";
import { fetchPage } from "./fetch-page";

const cache = new Map<string, { at: number; page: Page }>();
const TTL_MS = 30 * 60 * 1000;

/** Fetches a page and reads its content for re-rendering. Nothing is rewritten. */
export async function redesign(input: string): Promise<Page> {
  const key = input.trim().toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.page;

  const { url, html } = await fetchPage(input);
  const page = readPage(html, url);
  if (page.sections.length === 0 && !page.lead) {
    throw new Error(
      `${page.host} sent a page with no readable content. Sites that build their pages in the browser with JavaScript can't be redesigned yet.`,
    );
  }

  cache.set(key, { at: Date.now(), page });
  return page;
}
