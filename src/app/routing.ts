import type { AppRoute, MainView, ModuleId } from "./appTypes";
import { getModule, memoryViewPaths } from "./modules";

export function routeFromLocation(): AppRoute {
  return routeFromPath(window.location.pathname);
}

export function routeFromPath(pathname: string): AppRoute {
  const pathnameWithoutSlash = pathname.replace(/\/+$/, "") || "/";

  if (pathnameWithoutSlash.startsWith("/ipo")) {
    return { module: "ipo", memoryView: "dashboard" };
  }

  if (pathnameWithoutSlash.startsWith("/watchlist")) {
    return { module: "watchlist", memoryView: "dashboard" };
  }

  if (pathnameWithoutSlash.startsWith("/memory")) {
    const memoryView =
      (Object.entries(memoryViewPaths).find(([, path]) => path === pathnameWithoutSlash)?.[0] as MainView | undefined) ?? "dashboard";
    return { module: "memory", memoryView };
  }

  return { module: "home", memoryView: "dashboard" };
}

export function navigateToModule(moduleId: ModuleId, setRoute: (route: AppRoute) => void) {
  const module = getModule(moduleId);
  const nextRoute = routeFromPath(module.path);
  window.history.pushState(null, "", module.path);
  setRoute(nextRoute);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function navigateToMemoryView(view: MainView, setRoute: (route: AppRoute) => void) {
  const path = memoryViewPaths[view];
  const nextRoute = routeFromPath(path);
  window.history.pushState(null, "", path);
  setRoute(nextRoute);
  window.scrollTo({ top: 0, behavior: "smooth" });
}
