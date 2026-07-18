// ADAMA HSE targets a local-first web/PWA deployment with no application server,
// so the SvelteKit app remains a static SPA with an index.html fallback.
// Tauri is a legacy migration source, not the target runtime.
// See: https://svelte.dev/docs/kit/single-page-apps
import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: "index.html",
    }),
  },
};

export default config;
