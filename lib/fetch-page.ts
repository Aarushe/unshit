import "server-only";
import { lookup } from "node:dns/promises";
import { isIP, type LookupFunction } from "node:net";
import http, { type IncomingMessage } from "node:http";
import https from "node:https";
import zlib from "node:zlib";

// Fetches a public web page for redesign. Refuses anything that resolves to a
// private/loopback address so the server can't be used to probe its own network.

const MAX_BYTES = 3_000_000;
const TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 5;

export class FetchPageError extends Error {}

export function normaliseUrl(input: string): URL {
  const trimmed = input.trim();
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new FetchPageError("That doesn't look like a URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new FetchPageError("Only http and https links can be redesigned.");
  }
  return url;
}

function isPrivate(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivate(v6.slice(7));
  return (
    v6 === "::" ||
    v6 === "::1" ||
    v6.startsWith("fc") ||
    v6.startsWith("fd") ||
    v6.startsWith("fe80")
  );
}

async function assertPublic(url: URL) {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) {
    throw new FetchPageError("Local addresses can't be redesigned.");
  }
  const addresses = isIP(host)
    ? [{ address: host }]
    : await lookup(host, { all: true }).catch(() => {
        throw new FetchPageError(`Couldn't find ${host}.`);
      });
  if (addresses.some((a) => isPrivate(a.address))) {
    throw new FetchPageError("Private network addresses can't be redesigned.");
  }
}

/**
 * Resolves the host once, refuses private addresses, and hands the socket a
 * vetted IPv4-first address. Pinning the address closes the gap between the
 * check and the connect (DNS rebinding), and IPv4-first avoids long stalls on
 * networks without IPv6.
 */
const safeLookup: LookupFunction = (hostname, options, callback) => {
  lookup(hostname, { all: true })
    .then((found) => {
      if (found.length === 0 || found.some((a) => isPrivate(a.address))) {
        throw new FetchPageError("Private network addresses can't be redesigned.");
      }
      const ordered = [...found].sort((a, b) => a.family - b.family);
      // A single address means no dual-stack race to time out.
      if (options.all) callback(null, [ordered[0]]);
      else callback(null, ordered[0].address, ordered[0].family);
    })
    .catch((err: Error) => callback(err as NodeJS.ErrnoException, ""));
};

function get(url: URL): Promise<IncomingMessage> {
  const client = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.get(
      url,
      {
        lookup: safeLookup,
        timeout: TIMEOUT_MS,
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; NewInternetSocietyRedesign/1.0; +https://example.com)",
          accept: "text/html,application/xhtml+xml",
          "accept-encoding": "gzip, deflate, br",
        },
      },
      resolve,
    );
    req.on("timeout", () => req.destroy(new FetchPageError(`Fetching ${url.host} timed out.`)));
    req.on("error", (err) =>
      reject(err instanceof FetchPageError ? err : new FetchPageError(`Fetching ${url.host} failed.`)),
    );
  });
}

function decoded(res: IncomingMessage): NodeJS.ReadableStream {
  switch (res.headers["content-encoding"]) {
    case "gzip":
      return res.pipe(zlib.createGunzip());
    case "deflate":
      return res.pipe(zlib.createInflate());
    case "br":
      return res.pipe(zlib.createBrotliDecompress());
    default:
      return res;
  }
}

/**
 * Decodes the page in its own character set (Shift_JIS, GBK, Windows-1251…), as
 * a browser would: byte-order mark, then the HTTP header, then <meta charset>
 * in the first 4 KB, then UTF-8.
 */
function decode(bytes: Buffer, contentType: string): string {
  const head = bytes.subarray(0, 4096).toString("latin1");
  const label =
    (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf && "utf-8") ||
    (bytes[0] === 0xff && bytes[1] === 0xfe && "utf-16le") ||
    (bytes[0] === 0xfe && bytes[1] === 0xff && "utf-16be") ||
    /charset\s*=\s*["']?([\w.:-]+)/i.exec(contentType)?.[1] ||
    /<meta[^>]+charset\s*=\s*["']?([\w.:-]+)/i.exec(head)?.[1] ||
    "utf-8";
  try {
    // A page that claims UTF-16 in a <meta> is really ASCII-compatible (as browsers assume).
    const fromMeta = /^utf-?16/i.test(label) && bytes[0] !== 0xff && bytes[0] !== 0xfe;
    return new TextDecoder(fromMeta ? "utf-8" : label).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

export async function fetchPage(input: string): Promise<{ url: URL; html: string }> {
  let url = normaliseUrl(input);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublic(url);
    const res = await get(url);
    const status = res.statusCode ?? 0;

    if (status >= 300 && status < 400 && res.headers.location) {
      res.resume();
      url = new URL(res.headers.location, url);
      continue;
    }
    if (status < 200 || status >= 300) {
      res.resume();
      throw new FetchPageError(`${url.host} answered with ${status}.`);
    }
    if (!(res.headers["content-type"] ?? "").includes("html")) {
      res.resume();
      throw new FetchPageError("That link isn't an HTML page.");
    }

    // Read up to MAX_BYTES and stop; enough for any real page's content.
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of decoded(res)) {
      const buf = Buffer.from(chunk);
      chunks.push(buf);
      size += buf.byteLength;
      if (size >= MAX_BYTES) break;
    }
    res.destroy();
    return { url, html: decode(Buffer.concat(chunks), res.headers["content-type"] ?? "") };
  }

  throw new FetchPageError("Too many redirects.");
}
