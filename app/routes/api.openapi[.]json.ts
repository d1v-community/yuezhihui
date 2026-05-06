// Generate a minimal OpenAPI-style document by scanning API route modules.
// Convention: any file matching `app/routes/api.*.ts` is treated as an API route.
// - If it exports `loader`, the route supports GET by default.
// - If it exports `action`, the route supports POST by default.
// - Routes may override either via `export const openApi = { ... }`.
// Path mapping: `api.auth.verify-login.ts` -> `/api/auth/verify-login`

export async function loader() {
  // Note: import.meta.glob is resolved at build time by Vite/Remix.
  const modules = import.meta.glob("./api.*.{ts,tsx}", { eager: true }) as Record<
    string,
    {
      loader?: unknown;
      action?: unknown;
      openApi?: {
        loaderMethods?: string[];
        actionMethods?: string[];
      };
    }
  >;

  const paths: Record<string, unknown> = {};

  for (const [file, mod] of Object.entries(modules)) {
    // Skip this file itself and any non-API helpers accidentally matched
    if (file.includes("openapi")) continue;

    // Derive the HTTP methods from exported handlers
    const methods: Record<string, unknown> = {};
    const loaderMethods = mod.openApi?.loaderMethods?.length ? mod.openApi.loaderMethods : ["get"];
    const actionMethods = mod.openApi?.actionMethods?.length ? mod.openApi.actionMethods : ["post"];

    if (mod && typeof mod.loader === "function") {
      for (const method of loaderMethods) {
        methods[method.toLowerCase()] = { summary: method.toUpperCase() };
      }
    }

    if (mod && typeof mod.action === "function") {
      for (const method of actionMethods) {
        methods[method.toLowerCase()] = { summary: method.toUpperCase() };
      }
    }

    if (Object.keys(methods).length === 0) continue;

    // Derive the route path from the file name.
    // e.g.:
    // - "./api.auth.verify-login.ts" -> "/api/auth/verify-login"
    // - "./api.menstrual.daily.$date.ts" -> "/api/menstrual/daily/{date}"
    // - "./api.openapi[.]json.ts" -> "/api/openapi.json" (but we skip openapi below)
    const name = file.replace(/^\.\//, "").replace(/\.tsx?$/, "");
    const parts = name.split(".");
    const routePath =
      "/" +
      parts
        .map((p) => {
          // File routing: `$param` is a dynamic segment.
          if (p.startsWith("$")) return `{${p.slice(1)}}`;
          // Remix escape for dots inside filenames.
          return p.replace(/\[\.\]/g, ".");
        })
        .join("/");

    paths[routePath] = methods;
  }

  const spec = {
    openapi: "3.0.3",
    info: {
      title: "Remix API",
      version: "1.0.0",
      description: "Auto-generated from file-based routes",
    },
    paths,
  };

  return Response.json(spec, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
