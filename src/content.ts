import Editor from "@toast-ui/editor";
import editorCss from "@toast-ui/editor/dist/toastui-editor.css";

import codeSyntaxHighlight from "@toast-ui/editor-plugin-code-syntax-highlight";
import prismCss from "prismjs/themes/prism.css";
import codeSyntaxCss from "@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight.css";
import Prism from "prismjs";

import colorSyntax from "@toast-ui/editor-plugin-color-syntax";
import colorPluginCss from "@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css";
import tuiColorPickerCss from "tui-color-picker/dist/tui-color-picker.css";

import chartCss from "@toast-ui/chart/dist/toastui-chart.css";
import chart from "@toast-ui/editor-plugin-chart";

import tableMergedCellCss from "@toast-ui/editor-plugin-table-merged-cell/dist/toastui-editor-plugin-table-merged-cell.css";
import tableMergedCell from "@toast-ui/editor-plugin-table-merged-cell";

import uml from "@toast-ui/editor-plugin-uml";

import TurndownService from "turndown";
import { gfm as turndownGfm } from "turndown-plugin-gfm";
import DOMPurify from "dompurify";
import html2pdf from "html2pdf.js";
import htmlDocx from "html-docx-js/dist/html-docx";
import imageCompression from "browser-image-compression";
import Viewer from "@toast-ui/editor/dist/toastui-editor-viewer";
import mermaid from "mermaid";

import { onBodyReady, onSpaNav, findWikiMarkdownElement, findSaveButton, parseWikiFromUrl } from "./util";

function injectCss(target: Document | ShadowRoot, css: string) {
  const el = document.createElement("style");
  el.textContent = css;
  (target as any).appendChild(el);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c as "&" | "<" | ">"] as string));
}

type Settings = {
  pat?: string;
  enableUploads?: boolean;
  useShadowDom?: boolean;
  matchDemo?: boolean;
  enableAllPlugins?: boolean;
  enableCodeSyntax?: boolean;
  enableColorSyntax?: boolean;
  enableChart?: boolean;
  enableTableMergedCell?: boolean;
  enableUml?: boolean;
  enableMermaid?: boolean; // custom (no official TUI package)
  defaultFontFamily?: string;
  chartMinWidth?: number; chartMaxWidth?: number; chartMinHeight?: number; chartMaxHeight?: number;
  umlRendererURL?: string;
  imgMaxWidth?: number; imgQuality?: number;
};

let mounted = false;
let mermaidId = 0;

async function mountIfWikiEdit() {
  if (mounted) return;
  const src = findWikiMarkdownElement();
  if (!src) return; // not on edit page yet

  const settings = (await chrome.storage.local.get([
    "pat", "enableUploads", "useShadowDom",
    "matchDemo", "enableAllPlugins",
    "enableCodeSyntax", "enableColorSyntax", "enableChart", "enableTableMergedCell", "enableUml", "enableMermaid",
    "defaultFontFamily",
    "chartMinWidth", "chartMaxWidth", "chartMinHeight", "chartMaxHeight",
    "umlRendererURL",
    "imgMaxWidth", "imgQuality"
  ])) as Settings;

  const all = settings.enableAllPlugins !== false; // default true
  const useCode = settings.enableCodeSyntax ?? all;
  const useColor = settings.enableColorSyntax ?? all;
  const useChart = settings.enableChart ?? all;
  const useTableMerge = settings.enableTableMergedCell ?? all;
  const useUml = settings.enableUml ?? all;
  const useMermaid = !!settings.enableMermaid;

  // Host + optional shadow root
  const host = document.createElement("div");
  host.id = "tui-ado-host";
  host.style.margin = "8px 0";
  src.parentElement?.insertBefore(host, src);

  let mountTarget: HTMLElement | ShadowRoot = host;
  if (settings.useShadowDom) {
    const shadow = host.attachShadow({ mode: "open" });
    mountTarget = shadow;
  }

  // Keep original source in DOM for ADO save, but hide it
  (src as HTMLElement).style.display = "none";

  // Inject CSS where we render
  injectCss(mountTarget, editorCss);
  if (useCode) { injectCss(mountTarget, prismCss); injectCss(mountTarget, codeSyntaxCss); }
  if (useColor) { injectCss(mountTarget, colorPluginCss); injectCss(mountTarget, tuiColorPickerCss); }
  if (useChart) { injectCss(mountTarget, chartCss); }
  if (useTableMerge) { injectCss(mountTarget, tableMergedCellCss); }

  // Optional custom toolbar & exports (hidden when matching demo)
  const showCustomBar = settings.matchDemo === false;
  let bar: HTMLDivElement | null = null;
  if (showCustomBar) {
    bar = document.createElement("div");
    bar.style.display = "flex"; bar.style.flexWrap = "wrap"; bar.style.gap = "8px"; bar.style.margin = "6px 0";
    bar.innerHTML = `
      <label>Font:
        <input id="tuiFontFamily" placeholder="e.g. Segoe UI, Arial" style="width:240px">
      </label>
      <label>Color:
        <input id="tuiFontColor" placeholder="e.g. red or #d32f2f" style="width:160px">
      </label>
      <button id="tuiApplyFont">Apply font</button>
      <button id="tuiApplyColor">Apply color</button>
      <button id="tuiExportPDF">Export → PDF</button>
      <button id="tuiExportDOCX">Export → Word (.docx)</button>
    `;
    if (mountTarget instanceof ShadowRoot) mountTarget.appendChild(bar); else host.appendChild(bar);
    (bar.querySelector("#tuiFontFamily") as HTMLInputElement).value = settings.defaultFontFamily || "";
  }

  // Editor container (actual mount point)
  const editorEl = document.createElement("div");
  if (mountTarget instanceof ShadowRoot) mountTarget.appendChild(editorEl); else host.appendChild(editorEl);

  const initialMarkdown = src instanceof HTMLTextAreaElement ? src.value : (src.textContent ?? "");

  const plugins: any[] = [];
  if (useCode) plugins.push([codeSyntaxHighlight, { highlighter: Prism }]);
  if (useColor) plugins.push(colorSyntax);
  if (useChart) plugins.push([chart, {
    minWidth: settings.chartMinWidth ?? 100,
    maxWidth: settings.chartMaxWidth ?? 600,
    minHeight: settings.chartMinHeight ?? 100,
    maxHeight: settings.chartMaxHeight ?? 300,
  }]);
  if (useTableMerge) plugins.push(tableMergedCell);
  if (useUml) plugins.push([uml, { rendererURL: settings.umlRendererURL || "https://www.plantuml.com/plantuml/png/" }]);

  const editor = new Editor({
    el: editorEl,
    initialEditType: settings.matchDemo === false ? "markdown" : "wysiwyg",
    hideModeSwitch: settings.matchDemo === false ? true : false,
    previewStyle: "vertical",
    height: "600px",
    initialValue: initialMarkdown,
    usageStatistics: false,
    plugins,
    customHTMLSanitizer: (html: string) => DOMPurify.sanitize(html, { ADD_TAGS: ["font"], ADD_ATTR: ["color", "face", "style"] })
  });

  // Sync editor -> hidden ADO source
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

  // Ctrl/Cmd+S -> native Save button
  (mountTarget as any).addEventListener?.("keydown", (e: KeyboardEvent) => {
    const meta = e.ctrlKey || e.metaKey;
    if (meta && e.key.toLowerCase() === "s") {
      e.preventDefault();
      syncBack();
      findSaveButton()?.click();
    }
  });

  // Toolbar actions
  if (showCustomBar && bar) {
    const anyEd = editor as any;
    function insertWrapper(open: string, close: string) {
      if (typeof anyEd.replaceSelection === 'function') { anyEd.replaceSelection(`${open}${close}`); return; }
      if (typeof anyEd.insertText === 'function') { anyEd.insertText(`${open}${close}`); return; }
      editor.setMarkdown(editor.getMarkdown() + `
${open}${close}`);
    }
    (bar.querySelector("#tuiApplyFont") as HTMLButtonElement).onclick = () => {
      const family = (bar!.querySelector("#tuiFontFamily") as HTMLInputElement).value.trim(); if (!family) return; insertWrapper(`<font face="${family}">`, `</font>`);
    };
    (bar.querySelector("#tuiApplyColor") as HTMLButtonElement).onclick = () => {
      const color = (bar!.querySelector("#tuiFontColor") as HTMLInputElement).value.trim(); if (!color) return; insertWrapper(`<font color="${color}">`, `</font>`);
    };
  }

  // Smart Paste: HTML → Markdown (preserve tables, map <span style=color> to <font color>)
  const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
  td.use(turndownGfm);
  td.keep(["font"]);
  td.addRule("spanToFont", {
    filter: (node) => (node as any).nodeName === "SPAN" && (node as HTMLElement).style?.color,
    replacement: (content, node: any) => {
      const color = node.style.color; return color ? `<font color="${color}">${content}</font>` : content;
    }
  });

  function handlePaste(e: ClipboardEvent) {
    const html = e.clipboardData?.getData("text/html"); if (!html) return;
    e.preventDefault();
    const md = td.turndown(html);
    const anyEd = editor as any;
    if (typeof anyEd.replaceSelection === 'function') anyEd.replaceSelection(md);
    else if (typeof anyEd.insertText === 'function') anyEd.insertText(md);
    else editor.setMarkdown(editor.getMarkdown() + "\n" + md);
    editor.focus?.();
  }
  (editorEl as HTMLElement).addEventListener("paste", handlePaste, true);

  // Image paste/upload with client-side compression
  if (settings.enableUploads) {
    editor.addHook("addImageBlobHook", async (blob: Blob, callback: (url: string, alt: string) => void) => {
      try {
        if (!settings.pat) { alert("Uploads enabled, but no PAT set in Options."); return; }
        const maxWidth = settings.imgMaxWidth ?? 1600;
        const quality = settings.imgQuality ?? 0.9;
        const compressed = await imageCompression(blob as File, { maxWidthOrHeight: maxWidth, initialQuality: quality, useWebWorker: true });
        const { org, project, wiki } = parseWikiFromUrl(location.href);
        const fileName = (blob as any).name || "image.png";
        const url = `https://dev.azure.com/${org}/${project}/_apis/wiki/wikis/${wiki}/attachments?name=${encodeURIComponent(fileName)}&api-version=7.1`;
        const res = await fetch(url, { method: "PUT", headers: { "Authorization": "Basic " + btoa(":" + settings.pat), "Content-Type": "application/octet-stream" }, body: await compressed.arrayBuffer() });
        if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
        const data = await res.json();
        callback(data.path, fileName);
      } catch (e) { console.error(e); alert("Image upload failed. Check PAT scope, size limits, and network."); }
    });
  }

  // Mermaid (custom) — render ```mermaid fences in preview only
  if (useMermaid) {
    mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });
    const renderMermaid = () => {
      const contents = editorEl.querySelectorAll('.toastui-editor-contents');
      contents.forEach((root) => {
        const blocks = root.querySelectorAll('pre > code[data-language="mermaid"], pre > code.language-mermaid');
        blocks.forEach(async (codeEl) => {
          const pre = codeEl.parentElement as HTMLElement | null; if (!pre) return;
          if ((pre as any)._renderedMermaid) return;
          const code = codeEl.textContent || "";
          const container = document.createElement('div');
          container.className = 'tui-mermaid';
          (pre as any)._renderedMermaid = true;
          pre.replaceWith(container);
          try {
            const id = `m-${Date.now()}-${mermaidId++}`;
            const { svg } = await mermaid.render(id, code);
            container.innerHTML = svg;
          } catch (err: any) {
            container.textContent = `Mermaid error: ${err?.message || err}`;
          }
        });
      });
    };
    // initial + on change
    setTimeout(renderMermaid, 0);
    editor.on('change', () => setTimeout(renderMermaid, 0));
  }

  // Optional exports (only when custom bar is visible)
  if (showCustomBar && bar) {
    function makeViewer(markdown: string) {
      const tmp = document.createElement("div"); tmp.style.padding = "16px";
      new Viewer({ el: tmp, initialValue: markdown, usageStatistics: false, plugins: [] });
      return tmp;
    }
    const pdfBtn = bar.querySelector("#tuiExportPDF") as HTMLButtonElement;
    const docxBtn = bar.querySelector("#tuiExportDOCX") as HTMLButtonElement;
    pdfBtn.onclick = async () => { const md = editor.getMarkdown(); const view = makeViewer(md); await html2pdf().from(view).save(); };
    docxBtn.onclick = async () => {
      const md = editor.getMarkdown(); const view = makeViewer(md);
      const html = `<!doctype html><html><head><meta charset=\"utf-8\"></head><body>${view.innerHTML}</body></html>`;
      const blob = htmlDocx.asBlob(html, null, { table: { row: { cantSplit: true } } });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "wiki.docx"; a.click(); URL.revokeObjectURL(a.href);
    };
  }

  // Observe server-updated content and keep editor in sync
  const obs = new MutationObserver(() => {
    const serverMd = src instanceof HTMLTextAreaElement ? src.value : (src.textContent ?? "");
    if (serverMd !== editor.getMarkdown()) editor.setMarkdown(serverMd, false);
  });
  obs.observe(src, { characterData: true, childList: true, subtree: true, attributes: true });

  mounted = true;
}

onBodyReady(mountIfWikiEdit);
onSpaNav(() => { mounted = false; mountIfWikiEdit(); });