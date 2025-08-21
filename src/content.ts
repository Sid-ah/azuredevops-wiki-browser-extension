import Editor from "@toast-ui/editor";
import editorCss from "@toast-ui/editor/dist/toastui-editor.css";

import codeSyntaxHighlight from "@toast-ui/editor-plugin-code-syntax-highlight";
import prismCss from "prismjs/themes/prism.css";
import codeSyntaxCss from "@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight.css";
import Prism from "prismjs";

import colorSyntax from "@toast-ui/editor-plugin-color-syntax";
import colorPluginCss from "@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css";
import tuiColorPickerCss from "tui-color-picker/dist/tui-color-picker.css";

import { onBodyReady, onSpaNav, findWikiMarkdownElement, findSaveButton, parseWikiFromUrl } from "./util";

/** Inject CSS (to document or shadow root) */
function injectCss(target: Document | ShadowRoot, css: string) {
  const el = document.createElement("style");
  el.textContent = css;
  (target as any).appendChild(el);
}

type Settings = {
  pat?: string;
  enableUploads?: boolean;
  useShadowDom?: boolean;
  enableCodeSyntax?: boolean;
  enableColorSyntax?: boolean;
};

let mounted = false;

async function mountIfWikiEdit() {
  if (mounted) return;
  const src = findWikiMarkdownElement();
  if (!src) return; // not on edit page yet

  const settings = (await chrome.storage.local.get([
    "pat", "enableUploads", "useShadowDom", "enableCodeSyntax", "enableColorSyntax"
  ])) as Settings;

  // container + optional shadow
  const host = document.createElement("div");
  host.id = "tui-ado-host";
  host.style.margin = "8px 0";
  src.parentElement?.insertBefore(host, src);

  let mountTarget: HTMLElement | ShadowRoot = host;
  if (settings.useShadowDom) {
    const shadow = host.attachShadow({ mode: "open" });
    mountTarget = shadow;
  }

  // Hide original but keep in DOM so ADO can save normally
  (src as HTMLElement).style.display = "none";

  // Inject CSS where we mounted
  injectCss(mountTarget, editorCss);
  if (settings.enableCodeSyntax) {
    injectCss(mountTarget, prismCss);
    injectCss(mountTarget, codeSyntaxCss);
  }
  if (settings.enableColorSyntax) {
    injectCss(mountTarget, colorPluginCss);
    injectCss(mountTarget, tuiColorPickerCss);
  }

  // Editor wrapper (must be a real element, not ShadowRoot)
  const editorEl = document.createElement("div");
  if (mountTarget instanceof ShadowRoot) mountTarget.appendChild(editorEl);
  else host.appendChild(editorEl);

  const initialMarkdown =
    src instanceof HTMLTextAreaElement ? src.value : (src.textContent ?? "");

  const plugins: any[] = [];
  if (settings.enableCodeSyntax) plugins.push([codeSyntaxHighlight, { highlighter: Prism }]);
  if (settings.enableColorSyntax) plugins.push(colorSyntax);

  const editor = new Editor({
    el: editorEl,
    initialEditType: "wysiwyg",
    previewStyle: "vertical",
    height: "600px",
    initialValue: initialMarkdown,
    usageStatistics: false, // disable GA ping in Toast UI Editor
    plugins
  });

  // Sync changes back to native source
  const syncBack = () => {
    const md = editor.getMarkdown();
    if (src instanceof HTMLTextAreaElement) {
      if (src.value !== md) {
        src.value = md;
        src.dispatchEvent(new Event("input", { bubbles: true }));
        src.dispatchEvent(new Event("change", { bubbles: true }));
      }
    } else {
      if (src.textContent !== md) src.textContent = md;
    }
  };
  editor.on("change", syncBack);

  // Ctrl/Cmd+S -> native Save
  (mountTarget as any).addEventListener?.("keydown", (e: KeyboardEvent) => {
    const meta = e.ctrlKey || e.metaKey;
    if (meta && e.key.toLowerCase() === "s") {
      e.preventDefault();
      syncBack();
      findSaveButton()?.click();
    }
  });

  // Optional: image paste -> Wiki Attachments API
  if (settings.enableUploads) {
    editor.addHook("addImageBlobHook", async (blob: Blob, callback: (url: string, alt: string) => void) => {
      try {
        if (!settings.pat) {
          alert("Image upload is enabled, but no PAT is set in Options.");
          return;
        }
        const { org, project, wiki } = parseWikiFromUrl(location.href);
        const fileName = (blob as any).name || "image.png";

        // API: PUT /_apis/wiki/wikis/{wikiIdentifier}/attachments?name={name}&api-version=7.1
        const url = `https://dev.azure.com/${org}/${project}/_apis/wiki/wikis/${wiki}/attachments?name=${encodeURIComponent(fileName)}&api-version=7.1`;

        const res = await fetch(url, {
          method: "PUT",
          headers: {
            "Authorization": "Basic " + btoa(":" + settings.pat),
            "Content-Type": "application/octet-stream"
          },
          body: await blob.arrayBuffer()
        });

        if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
        const data = await res.json(); // { name, path: "/.attachments/..." }

        // The wiki will resolve attachment paths in Markdown: ![alt](/.attachments/file.png)
        callback(data.path, fileName);
      } catch (e) {
        console.error(e);
        alert("Image upload failed. Check PAT scope and network.");
      }
    });
  }

  // If the page updates the source (server-side event), keep editor in sync
  const obs = new MutationObserver(() => {
    const serverMd = src instanceof HTMLTextAreaElement ? src.value : (src.textContent ?? "");
    if (serverMd !== editor.getMarkdown()) editor.setMarkdown(serverMd, false);
  });
  obs.observe(src, { characterData: true, childList: true, subtree: true, attributes: true });

  mounted = true;
}

onBodyReady(mountIfWikiEdit);
onSpaNav(() => { mounted = false; mountIfWikiEdit(); });
