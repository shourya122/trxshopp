import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

// Security headers applied to every response coming out of the worker.
// These MUST be real HTTP headers (browsers ignore them in <meta http-equiv>).
const SECURITY_HEADERS: Record<string, string> = {
  // Disable powerful browser APIs the app does not use. Reduces attack surface
  // and limits what malicious third-party iframes/scripts could ever request.
  "Permissions-Policy": [
    "accelerometer=()",
    "autoplay=(self)",
    "camera=()",
    "display-capture=()",
    "encrypted-media=()",
    "fullscreen=(self)",
    "gamepad=()",
    "geolocation=()",
    "gyroscope=()",
    "hid=()",
    "idle-detection=()",
    "magnetometer=()",
    "microphone=()",
    "midi=()",
    "payment=(self)",
    "picture-in-picture=()",
    "publickey-credentials-get=(self)",
    "screen-wake-lock=()",
    "serial=()",
    "sync-xhr=()",
    "usb=()",
    "web-share=(self)",
    "xr-spatial-tracking=()",
  ].join(", "),
  // Cross-Origin-Opener-Policy isolates this browsing context from other
  // windows (Spectre / tab-nabbing protection). "same-origin-allow-popups"
  // keeps Firebase Google sign-in popups working.
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  // Defense-in-depth alongside the meta-tag CSP.
  // NOTE: X-Frame-Options removed; framing is controlled via CSP frame-ancestors
  // in __root.tsx so the Lovable editor preview iframe can embed the site.
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // HSTS — only honored over HTTPS, ignored on http/localhost. Safe to send always.
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  // NOTE: Cross-Origin-Embedder-Policy intentionally NOT set — it would break
  // cross-origin images (Google Storage) and the Firebase auth popup.
};

function applySecurityHeaders(response: Response): Response {
  // Avoid mutating immutable response objects (e.g. fetch from Worker assets).
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(k)) headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function brandedErrorResponse(): Response {
  return applySecurityHeaders(
    new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
  );
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return applySecurityHeaders(await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
