import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const buildDirectory = resolve("build");
const manifestPath = resolve(buildDirectory, "manifest.webmanifest");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const index = await readFile(resolve(buildDirectory, "index.html"), "utf8");
const serviceWorker = await readFile(resolve(buildDirectory, "service-worker.js"), "utf8");

const failures = [];
if (manifest.name !== "ADAMA HSE") failures.push("Manifest name is not ADAMA HSE.");
if (manifest.display !== "standalone") failures.push("Manifest display mode is not standalone.");
if (!index.includes("manifest.webmanifest")) failures.push("Built index does not link the manifest.");
if (!serviceWorker.includes("adama-hse-shell")) failures.push("Built service worker lacks the ADAMA HSE shell cache.");

for (const requiredSize of ["192x192", "512x512"]) {
  const icon = manifest.icons?.find((entry) => entry.sizes === requiredSize);
  if (!icon) {
    failures.push(`Manifest lacks a ${requiredSize} icon.`);
    continue;
  }
  try {
    await access(resolve(buildDirectory, icon.src.replace(/^\//, "")));
  } catch {
    failures.push(`Built icon ${icon.src} is missing.`);
  }
}

if (failures.length > 0) {
  throw new Error(`PWA verification failed:\n- ${failures.join("\n- ")}`);
}

console.log("PWA verification passed: manifest, install icons, index link, and offline shell are present.");
