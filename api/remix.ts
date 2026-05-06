import { once } from "node:events";
import { Readable } from "node:stream";
import { createReadableStreamFromReadable, createRequestHandler } from "@remix-run/node";
import type { IncomingMessage, ServerResponse } from "node:http";

// @ts-ignore -- generated at build time by `remix vite:build`
import * as build from "../build/server/index.js";

function fromNodeHeaders(nodeHeaders: IncomingMessage["headers"]) {
  const headers = new Headers();

  for (const [key, values] of Object.entries(nodeHeaders)) {
    if (!values) continue;

    if (Array.isArray(values)) {
      for (const value of values) headers.append(key, value);
    } else {
      headers.set(key, values);
    }
  }

  return headers;
}

function toWebRequest(req: IncomingMessage, res: ServerResponse) {
  const host = req.headers.host ?? "localhost";
  const originHeader = req.headers.origin;
  const origin = originHeader && originHeader !== "null" ? originHeader : `https://${host}`;
  const requestUrl = new URL(req.url ?? "/", origin);
  const controller = new AbortController();

  const init: RequestInit & { duplex?: "half" } = {
    headers: fromNodeHeaders(req.headers),
    method: req.method,
    signal: controller.signal,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = createReadableStreamFromReadable(req);
    init.duplex = "half";
  }

  res.on("finish", () => controller.abort());
  res.on("close", () => controller.abort());

  return new Request(requestUrl.href, init);
}

async function sendNodeResponse(webResponse: Response, res: ServerResponse) {
  res.statusCode = webResponse.status;
  res.statusMessage = webResponse.statusText;

  const setCookies: string[] = [];

  for (const [key, value] of webResponse.headers.entries()) {
    if (key.toLowerCase() === "set-cookie") {
      setCookies.push(value);
    } else {
      res.setHeader(key, value);
    }
  }

  if (setCookies.length > 0) {
    res.setHeader("set-cookie", setCookies);
  }

  if (!webResponse.body) {
    res.end();
    return;
  }

  const body = Readable.fromWeb(webResponse.body as any);
  body.pipe(res);
  await once(body, "end");
}

const handleRequest = createRequestHandler(build as any, process.env.NODE_ENV);

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const request = toWebRequest(req, res);
  const response = await handleRequest(request);
  await sendNodeResponse(response, res);
}
