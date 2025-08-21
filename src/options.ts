type Settings = {
  pat?: string;
  enableUploads?: boolean;
  useShadowDom?: boolean;
  // Plugins & demo parity
  matchDemo?: boolean;
  enableAllPlugins?: boolean;
  enableCodeSyntax?: boolean;
  enableColorSyntax?: boolean;
  enableChart?: boolean;
  enableTableMergedCell?: boolean;
  enableUml?: boolean;
  enableMermaid?: boolean; // custom mermaid support (no official TUI package)
  // Appearance
  defaultFontFamily?: string;
  // Chart options
  chartMinWidth?: number;
  chartMaxWidth?: number;
  chartMinHeight?: number;
  chartMaxHeight?: number;
  // UML
  umlRendererURL?: string;
  // Images
  imgMaxWidth?: number;
  imgQuality?: number;
};

const els = {
  pat: document.getElementById("pat") as HTMLInputElement,
  enableUploads: document.getElementById("enableUploads") as HTMLInputElement,
  useShadowDom: document.getElementById("useShadowDom") as HTMLInputElement,
  matchDemo: document.getElementById("matchDemo") as HTMLInputElement,
  enableAllPlugins: document.getElementById("enableAllPlugins") as HTMLInputElement,
  enableCodeSyntax: document.getElementById("enableCodeSyntax") as HTMLInputElement,
  enableColorSyntax: document.getElementById("enableColorSyntax") as HTMLInputElement,
  enableChart: document.getElementById("enableChart") as HTMLInputElement,
  enableTableMergedCell: document.getElementById("enableTableMergedCell") as HTMLInputElement,
  enableUml: document.getElementById("enableUml") as HTMLInputElement,
  enableMermaid: document.getElementById("enableMermaid") as HTMLInputElement,
  defaultFontFamily: document.getElementById("defaultFontFamily") as HTMLInputElement,
  chartMinWidth: document.getElementById("chartMinWidth") as HTMLInputElement,
  chartMaxWidth: document.getElementById("chartMaxWidth") as HTMLInputElement,
  chartMinHeight: document.getElementById("chartMinHeight") as HTMLInputElement,
  chartMaxHeight: document.getElementById("chartMaxHeight") as HTMLInputElement,
  umlRendererURL: document.getElementById("umlRendererURL") as HTMLInputElement,
  imgMaxWidth: document.getElementById("imgMaxWidth") as HTMLInputElement,
  imgQuality: document.getElementById("imgQuality") as HTMLInputElement,
  save: document.getElementById("save") as HTMLButtonElement,
  status: document.getElementById("status") as HTMLSpanElement
};

async function load() {
  const s = (await chrome.storage.local.get([
    "pat", "enableUploads", "useShadowDom",
    "matchDemo", "enableAllPlugins",
    "enableCodeSyntax", "enableColorSyntax", "enableChart", "enableTableMergedCell", "enableUml", "enableMermaid",
    "defaultFontFamily",
    "chartMinWidth", "chartMaxWidth", "chartMinHeight", "chartMaxHeight",
    "umlRendererURL",
    "imgMaxWidth", "imgQuality"
  ])) as Settings;

  els.pat.value = s.pat || "";
  els.enableUploads.checked = !!s.enableUploads;
  els.useShadowDom.checked = !!s.useShadowDom;
  els.matchDemo.checked = s.matchDemo !== false; // default true
  const all = s.enableAllPlugins !== false; // default true
  els.enableAllPlugins.checked = all;
  els.enableCodeSyntax.checked = s.enableCodeSyntax ?? all ?? true;
  els.enableColorSyntax.checked = s.enableColorSyntax ?? all ?? true;
  els.enableChart.checked = s.enableChart ?? all ?? true;
  els.enableTableMergedCell.checked = s.enableTableMergedCell ?? all ?? true;
  els.enableUml.checked = s.enableUml ?? all ?? true;
  els.enableMermaid.checked = !!s.enableMermaid;
  els.defaultFontFamily.value = s.defaultFontFamily ?? "";
  els.chartMinWidth.value = String(s.chartMinWidth ?? 100);
  els.chartMaxWidth.value = String(s.chartMaxWidth ?? 600);
  els.chartMinHeight.value = String(s.chartMinHeight ?? 100);
  els.chartMaxHeight.value = String(s.chartMaxHeight ?? 300);
  els.umlRendererURL.value = s.umlRendererURL ?? "https://www.plantuml.com/plantuml/png/";
  els.imgMaxWidth.value = String(s.imgMaxWidth ?? 1600);
  els.imgQuality.value = String(s.imgQuality ?? 0.9);
}

async function save() {
  const s: Settings = {
    pat: els.pat.value.trim(),
    enableUploads: els.enableUploads.checked,
    useShadowDom: els.useShadowDom.checked,
    matchDemo: els.matchDemo.checked,
    enableAllPlugins: els.enableAllPlugins.checked,
    enableCodeSyntax: els.enableCodeSyntax.checked,
    enableColorSyntax: els.enableColorSyntax.checked,
    enableChart: els.enableChart.checked,
    enableTableMergedCell: els.enableTableMergedCell.checked,
    enableUml: els.enableUml.checked,
    enableMermaid: els.enableMermaid.checked,
    defaultFontFamily: els.defaultFontFamily.value.trim(),
    chartMinWidth: Number(els.chartMinWidth.value || 100),
    chartMaxWidth: Number(els.chartMaxWidth.value || 600),
    chartMinHeight: Number(els.chartMinHeight.value || 100),
    chartMaxHeight: Number(els.chartMaxHeight.value || 300),
    umlRendererURL: els.umlRendererURL.value.trim() || "https://www.plantuml.com/plantuml/png/",
    imgMaxWidth: Number(els.imgMaxWidth.value || 1600),
    imgQuality: Number(els.imgQuality.value || 0.9)
  };
  await chrome.storage.local.set(s);
  els.status.textContent = "Saved!";
  setTimeout(() => (els.status.textContent = ""), 1500);
}

els.save.addEventListener("click", save);
load();