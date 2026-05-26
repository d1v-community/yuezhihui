import { redirect } from "@remix-run/node";
import favicon32Href from "~/assets/branding/favicon-32x32.png?url";

export async function loader() {
  return redirect(favicon32Href);
}
