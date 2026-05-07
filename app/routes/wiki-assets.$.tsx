import fs from "node:fs/promises";
import path from "node:path";
import type { LoaderFunctionArgs } from "@remix-run/node";

const wikiPagesRoot = path.resolve(process.cwd(), "app/content/wiki/pages");

function getContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    case ".avif":
      return "image/avif";
    case ".ico":
      return "image/x-icon";
    default:
      return "application/octet-stream";
  }
}

function resolveSafeAssetPath(rawPath: string) {
  if (rawPath.includes("\0")) throw new Response("Bad Request", { status: 400 });

  const normalized = path.posix.normalize(rawPath).replace(/^\/+/, "");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.some((part) => part === "." || part === "..")) {
    throw new Response("Bad Request", { status: 400 });
  }

  return path.join(wikiPagesRoot, ...parts);
}

export async function loader({ params }: LoaderFunctionArgs) {
  const assetPath = params["*"] ?? "";
  if (!assetPath) throw new Response("Not Found", { status: 404 });

  const filePath = resolveSafeAssetPath(assetPath);

  try {
    const body = await fs.readFile(filePath);
    return new Response(body, {
      headers: {
        "Content-Type": getContentType(filePath),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    throw new Response("Not Found", { status: 404 });
  }
}
