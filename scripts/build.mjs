// scripts/build.mjs
import esbuild from "esbuild";
import { promises as fs } from "fs";
import path from "path";
import url from "url";

const watch = process.argv.includes("--watch");

// Common build options
const opts = {
  entryPoints: ["src/content.ts", "src/options.ts"],
  outdir: "dist",
  bundle: true,
  format: "iife",
  target: "chrome110",
  loader: { ".css": "text" }, // inline CSS so MV3 doesn't fetch externals
  sourcemap: watch,
  define: { "process.env.NODE_ENV": JSON.stringify(watch ? "development" : "production") }
};

// Tiny helper to copy static files (Options page) into dist
async function copyStatic() {
  const src = path.resolve("static");
  const dest = path.resolve("dist");
  await fs.mkdir(dest, { recursive: true });
  try {
    await fs.copyFile(path.join(src, "options.html"), path.join(dest, "options.html"));
  } catch (e) {
    // ok if file doesn't exist yet
  }
  
  // Copy manifest.json to dist folder
  try {
    await fs.copyFile("manifest.json", path.join(dest, "manifest.json"));
  } catch (e) {
    console.warn("Could not copy manifest.json:", e.message);
  }
}

if (watch) {
  const ctx = await esbuild.context(opts);
  await copyStatic();
  await ctx.watch();              // 👈 replaces build({ watch })
  console.log("👀 Watching for changes… (Ctrl+C to stop)");
} else {
  await esbuild.build(opts);
  await copyStatic();
  console.log("✅ Build complete");
}
