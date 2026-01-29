import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getUserFromRequest } from "~/utils/auth.server";
import { getEnvWarningMessage } from "~/utils/env.server";
import { getWikiNav, getWikiContent } from "~/utils/wiki.server";
import { WikiShell } from "~/components/wiki/WikiShell";
import { WikiLayout } from "~/components/wiki/WikiLayout";
import { APP_TITLE } from "~/constants/app";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const title = data?.page?.title ? `${data.page.title} - ${APP_TITLE}` : `Wiki - ${APP_TITLE}`;
  return [{ title }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUserFromRequest(request);
  const envWarning = getEnvWarningMessage();

  const nav = await getWikiNav();
  const page = await getWikiContent("");
  if (!page) throw new Response("Not Found", { status: 404 });

  return json({ user, envWarning, nav: nav.nav, page, routePath: "" });
}

export default function WikiIndexRoute() {
  const { user, envWarning, nav, page, routePath } = useLoaderData<typeof loader>();

  return (
    <WikiShell user={user} envWarning={envWarning}>
      <WikiLayout nav={nav} routePath={routePath} title={page.title} html={page.html} />
    </WikiShell>
  );
}
