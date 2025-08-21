(() => {
  // src/options.ts
  var els = {
    pat: document.getElementById("pat"),
    enableUploads: document.getElementById("enableUploads"),
    useShadowDom: document.getElementById("useShadowDom"),
    matchDemo: document.getElementById("matchDemo"),
    enableAllPlugins: document.getElementById("enableAllPlugins"),
    enableCodeSyntax: document.getElementById("enableCodeSyntax"),
    enableColorSyntax: document.getElementById("enableColorSyntax"),
    enableChart: document.getElementById("enableChart"),
    enableTableMergedCell: document.getElementById("enableTableMergedCell"),
    enableUml: document.getElementById("enableUml"),
    enableMermaid: document.getElementById("enableMermaid"),
    defaultFontFamily: document.getElementById("defaultFontFamily"),
    chartMinWidth: document.getElementById("chartMinWidth"),
    chartMaxWidth: document.getElementById("chartMaxWidth"),
    chartMinHeight: document.getElementById("chartMinHeight"),
    chartMaxHeight: document.getElementById("chartMaxHeight"),
    umlRendererURL: document.getElementById("umlRendererURL"),
    imgMaxWidth: document.getElementById("imgMaxWidth"),
    imgQuality: document.getElementById("imgQuality"),
    save: document.getElementById("save"),
    status: document.getElementById("status")
  };
  async function load() {
    const s = await chrome.storage.local.get([
      "pat",
      "enableUploads",
      "useShadowDom",
      "matchDemo",
      "enableAllPlugins",
      "enableCodeSyntax",
      "enableColorSyntax",
      "enableChart",
      "enableTableMergedCell",
      "enableUml",
      "enableMermaid",
      "defaultFontFamily",
      "chartMinWidth",
      "chartMaxWidth",
      "chartMinHeight",
      "chartMaxHeight",
      "umlRendererURL",
      "imgMaxWidth",
      "imgQuality"
    ]);
    els.pat.value = s.pat || "";
    els.enableUploads.checked = !!s.enableUploads;
    els.useShadowDom.checked = !!s.useShadowDom;
    els.matchDemo.checked = s.matchDemo !== false;
    const all = s.enableAllPlugins !== false;
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
    const s = {
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
    setTimeout(() => els.status.textContent = "", 1500);
  }
  els.save.addEventListener("click", save);
  load();
})();
