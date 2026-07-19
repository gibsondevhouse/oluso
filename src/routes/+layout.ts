// ADAMA HSE is deployed as a static local-first PWA with no application server,
// so the index fallback provides client-side routing after the first installed load.
// See: https://svelte.dev/docs/kit/single-page-apps
export const ssr = false;
