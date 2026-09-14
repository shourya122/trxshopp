// Serves product images stored in the private `product-images` bucket over a
// public, cacheable URL: /api/public/product-image/<path-in-bucket>
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/product-image/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = decodeURIComponent(String((params as { _splat?: string })._splat ?? "")).replace(/^\/+/, "");
        if (!path || path.includes("..")) return new Response("Not found", { status: 404 });
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin.storage.from("product-images").download(path);
          if (error || !data) return new Response("Not found", { status: 404 });
          return new Response(await data.arrayBuffer(), {
            status: 200,
            headers: {
              "content-type": data.type || "application/octet-stream",
              "cache-control": "public, max-age=31536000, immutable",
            },
          });
        } catch (e) {
          return new Response(`Image proxy error: ${(e as Error).message}`, { status: 502 });
        }
      },
    },
  },
});
