const routeMap = new Map([
  ["/", "home"],
  ["/index.html", "home"],
  ["/index", "home"],
  ["/studio", "studio"],
  ["/studio.html", "studio"],
  ["/nosotros", "nosotros"],
  ["/nosotros.html", "nosotros"],
]);

const routeLoaders = {
  home: () => import("./pages/home.js"),
  studio: () => import("./pages/studio.js"),
  nosotros: () => import("./pages/nosotros.js"),
};

const normalizePath = (pathname = "/") => {
  if (!pathname) return "/";
  const clean = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  return clean || "/";
};

export const resolveRouteName = (pathname) => {
  const cleanPath = normalizePath(pathname);
  return routeMap.get(cleanPath) || "home";
};

export const loadRoute = async (pathname) => {
  const routeName = resolveRouteName(pathname);
  const module = await routeLoaders[routeName]();
  return { routeName, module };
};
