(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // src/options.ts
  var require_options = __commonJS({
    "src/options.ts"() {
      var els = {
        pat: document.getElementById("pat"),
        enableUploads: document.getElementById("enableUploads"),
        useShadowDom: document.getElementById("useShadowDom"),
        enableCodeSyntax: document.getElementById("enableCodeSyntax"),
        enableColorSyntax: document.getElementById("enableColorSyntax"),
        save: document.getElementById("save"),
        status: document.getElementById("status")
      };
      var els2 = {
        defaultFontFamily: document.getElementById("defaultFontFamily"),
        enableMermaid: document.getElementById("enableMermaid"),
        imgMaxWidth: document.getElementById("imgMaxWidth"),
        imgQuality: document.getElementById("imgQuality"),
        exportPDF: document.getElementById("exportPDF"),
        exportDOCX: document.getElementById("exportDOCX")
      };
      async function load() {
        const s = await chrome.storage.local.get([
          "pat",
          "enableUploads",
          "useShadowDom",
          "enableCodeSyntax",
          "enableColorSyntax",
          "defaultFontFamily",
          "enableMermaid",
          "imgMaxWidth",
          "imgQuality"
        ]);
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
        const s = {
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
        setTimeout(() => els.status.textContent = "", 1500);
      }
      els.save.addEventListener("click", save);
      load();
    }
  });
  require_options();
})();
