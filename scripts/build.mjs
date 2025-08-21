import esbuild from "esbuild";
import { promises as fs } from "fs";
import path from "path";


const watch = process.argv.includes("--watch");


const opts = {
entryPoints: ["src/content.ts", "src/options.ts"],
outdir: "dist",
bundle: true,
format: "iife",
target: "chrome110",
platform: "browser",
loader: { ".css": "text" },
sourcemap: watch,
define: { "process.env.NODE_ENV": JSON.stringify(watch ? "development" : "production") }
};


async function copyStatic() {
await fs.mkdir("dist", { recursive: true });
// Copy options.html
await fs.copyFile(path.join("static", "options.html"), path.join("dist", "options.html")).catch(() => {});
// Copy manifest.json
await fs.copyFile("manifest.json", path.join("dist", "manifest.json"));
}


if (watch) {
const ctx = await esbuild.context(opts);
await copyStatic();
await ctx.watch();
console.log("👀 Watching for changes… (Ctrl+C to stop)");
} else {
await esbuild.build(opts);
await copyStatic();
console.log("✅ Build complete");
}