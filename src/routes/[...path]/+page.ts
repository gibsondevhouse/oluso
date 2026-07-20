import { redirect } from "@sveltejs/kit";
import { findParentRedirect, findRoute, normalizePath } from "$lib/navigation/route-registry";
import type { PageLoad } from "./$types";

export const load: PageLoad = ({ url }) => {
  const pathname = normalizePath(url.pathname);
  if (pathname === "/hse/chemicals" || pathname.startsWith("/hse/chemicals/")) {
    throw redirect(307, `/master/products${url.search}`);
  }
  const parentRedirect = findParentRedirect(pathname);

  if (parentRedirect) {
    throw redirect(307, `${parentRedirect.redirectTo}${url.search}`);
  }

  const route = findRoute(pathname);

  if (route) {
    return { route };
  }

  throw redirect(307, "/not-found");
};
