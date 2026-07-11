import { redirect } from "@sveltejs/kit";
import { findParentRedirect, findRoute, normalizePath } from "$lib/navigation/route-registry";
import type { PageLoad } from "./$types";

export const load: PageLoad = ({ url }) => {
  const pathname = normalizePath(url.pathname);
  const parentRedirect = findParentRedirect(pathname);

  if (parentRedirect) {
    throw redirect(307, parentRedirect.redirectTo);
  }

  const route = findRoute(pathname);

  if (route) {
    return { route };
  }

  throw redirect(307, "/not-found");
};
