import { redirect } from "@remix-run/node";
import faviconIcoHref from "~/assets/branding/favicon.ico?url";

export async function loader() {
  return redirect(faviconIcoHref);
}
