// Clicking the toolbar icon turns the redesign on or off for the current site.
// Once on, it is registered as a content script for that host, so every page,
// form submission and redirect on the site loads already redesigned.
//
// Runs as a service worker in Chrome, Edge, Brave, Opera and Arc, and as an
// event page in Firefox and Safari; `chrome.*` is available in all of them.

const KEY = "hosts";
const idFor = (host) => `nis:${host}`;
const patternFor = (host) => `*://${host}/*`;

function hostOf(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.hostname : null;
  } catch {
    return null;
  }
}

async function hosts() {
  const { [KEY]: list = [] } = await chrome.storage.local.get(KEY);
  return Array.isArray(list) ? list : [];
}

async function register(host) {
  const id = idFor(host);
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
  if (existing.length) return;
  const script = {
    id,
    matches: [patternFor(host)],
    js: ["content.js"],
    css: ["redesign.css"],
    runAt: "document_start",
    allFrames: true,
    persistAcrossSessions: true,
  };
  try {
    // Also redesign the site's about:blank / srcdoc frames (Chrome 119+).
    await chrome.scripting.registerContentScripts([{ ...script, matchOriginAsFallback: true }]);
  } catch {
    try {
      await chrome.scripting.registerContentScripts([script]);
    } catch (err) {
      // Already registered by a concurrent sync, or an unsupported option.
      if (!(await chrome.scripting.getRegisteredContentScripts({ ids: [id] })).length) throw err;
    }
  }
}

async function unregister(host) {
  const id = idFor(host);
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
  if (existing.length) await chrome.scripting.unregisterContentScripts({ ids: [id] });
}

async function badge(tabId, url) {
  try {
    const host = hostOf(url ?? "");
    const on = host ? (await hosts()).includes(host) : false;
    await chrome.action.setBadgeText({ tabId, text: on ? "on" : "" });
    await chrome.action.setTitle({
      tabId,
      title: !host ? "Can't redesign this page" : on ? "Turn off redesign for this site" : "Redesign this site",
    });
  } catch {
    // The tab closed in the meantime.
  }
}

chrome.action.setBadgeBackgroundColor({ color: "#030712" });
chrome.action.setBadgeTextColor?.({ color: "#ffffff" });

async function tabsOn(host) {
  try {
    return (await chrome.tabs.query({ url: patternFor(host) })).filter((t) => hostOf(t.url ?? "") === host);
  } catch {
    return [];
  }
}

async function apply(tabId) {
  try {
    await chrome.scripting.insertCSS({ target: { tabId, allFrames: true }, files: ["redesign.css"] });
    await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, files: ["content.js"] });
  } catch (err) {
    console.warn("Redesign could not be applied to this tab:", err);
  }
}

async function toggle(tab, granted = Promise.resolve(true)) {
  const host = hostOf(tab.url ?? "");
  if (!host || tab.id === undefined) return;
  const list = await hosts();

  if (list.includes(host)) {
    await chrome.storage.local.set({ [KEY]: list.filter((h) => h !== host) });
    await unregister(host);
    // Restyling rewrites the live page; a reload restores the original exactly.
    const open = await tabsOn(host);
    if (!open.some((t) => t.id === tab.id)) open.push(tab);
    await Promise.all(open.map((t) => chrome.tabs.reload(t.id).catch(() => {})));
  } else {
    // Firefox and Safari let people withhold site access; without it there's nothing to do.
    if (!(await granted)) return;
    await chrome.storage.local.set({ [KEY]: [...list, host] });
    await register(host);
    // Apply to the site's pages that are already open, without a reload.
    const open = await tabsOn(host);
    if (!open.some((t) => t.id === tab.id)) open.push(tab);
    await Promise.all(open.map((t) => apply(t.id)));
    await Promise.all(open.map((t) => badge(t.id, t.url)));
  }
  await badge(tab.id, tab.url);
}

// One toggle at a time, so quick double-clicks can't interleave storage writes.
let queue = Promise.resolve();
function onClicked(tab) {
  // Asking for site access must happen synchronously in the click (Firefox
  // drops the user gesture after the first await). It resolves at once,
  // without a prompt, when access is already granted.
  const host = hostOf(tab.url ?? "");
  let granted = Promise.resolve(true);
  if (host && chrome.permissions?.request) {
    try {
      granted = chrome.permissions.request({ origins: [patternFor(host)] }).catch(() => true);
    } catch {
      granted = Promise.resolve(true);
    }
  }
  queue = queue.then(() => toggle(tab, granted)).catch((err) => console.warn("Redesign toggle failed:", err));
  return queue;
}

chrome.action.onClicked.addListener(onClicked);
// Exposed for automated checks that drive the extension like a click would.
self.nisToggle = (tab) => onClicked(tab);

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === "loading" || info.url) badge(tabId, tab.url);
});
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    badge(tabId, tab.url);
  } catch {
    // Closed already.
  }
});

// Keep registrations in step with storage (e.g. after an update or a browser
// that doesn't keep registered scripts across restarts).
async function sync() {
  for (const host of await hosts()) {
    try {
      await register(host);
    } catch (err) {
      console.warn(`Couldn't register the redesign for ${host}:`, err);
    }
  }
}
chrome.runtime.onInstalled.addListener(sync);
chrome.runtime.onStartup.addListener(sync);
