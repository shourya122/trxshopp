// Proxies the Cashfree JS SDK through our own origin so that ad/tracker
// blockers (which block sdk.cashfree.com) can't prevent it from loading.
import { createFileRoute } from "@tanstack/react-router";

const SDK_URL = "https://sdk.cashfree.com/js/v3/cashfree.js";

export const Route = createFileRoute("/api/public/cf-sdk")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const upstream = await fetch(SDK_URL, {
            headers: { "user-agent": "trxshop-sdk-proxy" },
          });
          if (!upstream.ok) {
            return new Response(`// Cashfree SDK fetch failed: ${upstream.status}`, {
              status: 502,
              headers: { "content-type": "application/javascript" },
            });
          }
          const body = await upstream.text();
          return new Response(body, {
            status: 200,
            headers: {
              "content-type": "application/javascript; charset=utf-8",
              "cache-control": "public, max-age=3600",
            },
          });
        } catch (e) {
          return new Response(`// Cashfree SDK proxy error: ${(e as Error).message}`, {
            status: 502,
            headers: { "content-type": "application/javascript" },
          });
        }
      },
    },
  },
});
