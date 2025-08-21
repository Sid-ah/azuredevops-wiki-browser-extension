type Settings = {
  pat?: string;
  enableUploads?: boolean;
  useShadowDom?: boolean;
  enableCodeSyntax?: boolean;
  enableColorSyntax?: boolean;
  defaultFontFamily?: string;
  enableMermaid?: boolean;
  imgMaxWidth?: number;
  imgQuality?: number;
};

const els = {
  pat: document.getElementById("pat") as HTMLInputElement,
  enableUploads: document.getElementById("enableUploads") as HTMLInputElement,
  useShadowDom: document.getElementById("useShadowDom") as HTMLInputElement,
  enableCodeSyntax: document.getElementById("enableCodeSyntax") as HTMLInputElement,
  enableColorSyntax: document.getElementById("enableColorSyntax") as HTMLInputElement,
  save: document.getElementById("save") as HTMLButtonElement,
  status: document.getElementById("status") as HTMLSpanElement,
};

const els2 = {
  defaultFontFamily: document.getElementById("defaultFontFamily") as HTMLInputElement,
  enableMermaid: document.getElementById("enableMermaid") as HTMLInputElement,
  imgMaxWidth: document.getElementById("imgMaxWidth") as HTMLInputElement,
  imgQuality: document.getElementById("imgQuality") as HTMLInputElement,
  exportPDF: document.getElementById("exportPDF") as HTMLButtonElement,
  exportDOCX: document.getElementById("exportDOCX") as HTMLButtonElement
};

async function load() {
    const s = (await chrome.storage.local.get([
    "pat","enableUploads","useShadowDom","enableCodeSyntax","enableColorSyntax",
    "defaultFontFamily","enableMermaid","imgMaxWidth","imgQuality"
  ])) as Settings;
  els.pat.value = s.pat || "";
  els.enableUploads.checked = !!s.enableUploads;
  els.useShadowDom.checked = !!s.useShadowDom;
  els.enableCodeSyntax.checked = s.enableCodeSyntax !== false;
  els.enableColorSyntax.checked = !!s.enableColorSyntax;
  els2.defaultFontFamily.value = s.defaultFontFamily ?? "";
  els2.enableMermaid.checked = s.enableMermaid !== false;
  els2.imgMaxWidth.value = String(s.imgMaxWidth ?? 1600);
  els2.imgQuality.value = String(s.imgQuality ?? 0.9);
}
async function save() {
  const s: Settings = {
    pat: els.pat.value.trim(),
    enableUploads: els.enableUploads.checked,
    useShadowDom: els.useShadowDom.checked,
    enableCodeSyntax: els.enableCodeSyntax.checked,
    enableColorSyntax: els.enableColorSyntax.checked,
    defaultFontFamily: els2.defaultFontFamily.value.trim(),
    enableMermaid: els2.enableMermaid.checked,
    imgMaxWidth: Number(els2.imgMaxWidth.value || 1600),
    imgQuality: Number(els2.imgQuality.value || 0.9)
  };
  await chrome.storage.local.set(s);
  els.status.textContent = "Saved!";
  setTimeout(() => (els.status.textContent = ""), 1500);
}

els.save.addEventListener("click", save);
load();
