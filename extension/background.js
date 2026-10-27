// Clicking the toolbar icon turns the redesign on or off for the current site.
// Once on, it is registered as a content script for that host, so every page,
// form submission and redirect on the site loads already redesigned.

const KEY = "hosts";
const idFor = (host) => `nis:${host}`;

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
  return list;
}

async function register(host) {
  const id = idFor(host);
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
  if (existing.length) return;
  await chrome.scripting.registerContentScripts([
    {
      id,
      matches: [`*://${host}/*`],
      js: ["content.js"],
      css: ["redesign.css"],
      runAt: "document_start",
      allFrames: true,
      persistAcrossSessions: true,
    },
  ]);
}

async function unregister(host) {
  const id = idFor(host);
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
  if (existing.length) await chrome.scripting.unregisterContentScripts({ ids: [id] });
}

async function badge(tabId, url) {
  const host = hostOf(url ?? "");
  const on = host ? (await hosts()).includes(host) : false;
  await chrome.action.setBadgeText({ tabId, text: on ? "on" : "" });
  await chrome.action.setTitle({
    tabId,
    title: !host ? "Can't redesign this page" : on ? "Turn off redesign for this site" : "Redesign this site",
  });
}

chrome.action.setBadgeBackgroundColor({ color: "#030712" });
chrome.action.setBadgeTextColor?.({ color: "#ffffff" });

async function toggle(tab) {
  const host = hostOf(tab.url ?? "");
  if (!host || tab.id === undefined) return;
  const list = await hosts();

  if (list.includes(host)) {
    await chrome.storage.local.set({ [KEY]: list.filter((h) => h !== host) });
    await unregister(host);
    // Restyling rewrites the live page; a reload restores the original exactly.
    await chrome.tabs.reload(tab.id);
  } else {
    await chrome.storage.local.set({ [KEY]: [...list, host] });
    await register(host);
    // Apply to the page that's already open, without a reload.
    try {
      await chrome.scripting.insertCSS({ target: { tabId: tab.id, allFrames: true }, files: ["redesign.css"] });
      await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ["content.js"] });
    } catch (err) {
      console.warn("Redesign could not be applied to this tab:", err);
    }
  }
  await badge(tab.id, tab.url);
}

chrome.action.onClicked.addListener(toggle);
// Exposed for automated checks that drive the extension like a click would.
self.nisToggle = toggle;

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === "loading" || info.url) badge(tabId, tab.url);
});
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  badge(tabId, tab.url);
});

// Keep registrations in step with storage (e.g. after an update).
async function sync() {
  for (const host of await hosts()) await register(host);
}
chrome.runtime.onInstalled.addListener(sync);
chrome.runtime.onStartup.addListener(sync);
