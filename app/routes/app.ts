import { redirect, type LoaderFunctionArgs } from "@remix-run/node";

// Product UI lives in the Taro H5 SPA under `public/app`.
// This route exists only to make in-app Remix navigations to `/app`
// perform a full handoff to the static SPA entry.
export async function loader(_args: LoaderFunctionArgs) {
  throw redirect("/app/index.html");
}

