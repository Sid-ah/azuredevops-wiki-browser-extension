export function onBodyReady(fn: () => void) {
  if (document.body) fn();
  else new MutationObserver((_m, obs) => {
    if (document.body) { obs.disconnect(); fn(); }
  }).observe(document.documentElement, { childList: true, subtree: true });
}

// Detect SPA-ish URL changes in Azure DevOps
export function onSpaNav(fn: () => void) {
  let last = location.href;
  new MutationObserver(() => {
    const href = location.href;
    if (href !== last) { last = href; fn(); }
  }).observe(document, { subtree: true, childList: true, attributes: true });
}

// Heuristic to find the wiki's markdown source element (textarea or CE)
export function findWikiMarkdownElement(): HTMLTextAreaElement | HTMLElement | null {
  // common textareas in edit view
  const t = document.querySelector<HTMLTextAreaElement>('textarea');
  if (t && t.closest('[class*="wiki"],[id*="wiki"],[data-test-id*="wiki"]')) return t;

  // contenteditable in some builds
  const editable = Array.from(document.querySelectorAll<HTMLElement>('[contenteditable="true"]'))
    .find(el => el.closest('[class*="wiki"],[id*="wiki"],[data-test-id*="wiki"]'));
  if (editable) return editable;

  return document.querySelector('[class*="edit"] textarea,[id*="edit"] textarea');
}

// Find a Save/Publish button, prefer explicit labels
export function findSaveButton(): HTMLButtonElement | null {
  const btns = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
  return btns.find(b => {
    const t = (b.innerText || b.getAttribute("aria-label") || "").trim().toLowerCase();
    return ["save", "publish"].some(k => t === k || t.startsWith(k));
  }) || null;
}

// Parse org/project/wikiIdentifier from a Azure DevOps wiki URL
export function parseWikiFromUrl(href: string): { org: string; project: string; wiki: string; pagePath?: string } {
  const u = new URL(href);
  // Expected: /{org}/{project}/_wiki/wikis/{wikiIdentifier}/...
  const parts = u.pathname.split("/").filter(Boolean);
  const wikiIdx = parts.findIndex(p => p === "_wiki");
  if (wikiIdx >= 2 && parts[wikiIdx + 1] === "wikis") {
    const org = parts[0];
    const project = parts[1];
    const wiki = parts[wikiIdx + 2];
    // page path, if present: .../page? or pagePath query param
    const pagePath = u.searchParams.get("pagePath") || undefined;
    return { org, project, wiki, pagePath };
  }
  throw new Error("Could not parse wiki URL");
}
