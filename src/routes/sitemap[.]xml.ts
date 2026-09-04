import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { listProducts } from "@/lib/products";

const BASE_URL = "https://trxshop.xyz";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/games", changefreq: "daily", priority: "0.9" },
          { path: "/contactus", changefreq: "yearly", priority: "0.4" },
          { path: "/terms-and-conditions", changefreq: "yearly", priority: "0.3" },
          { path: "/refund-and-cancellation", changefreq: "yearly", priority: "0.3" },
        ];

        try {
          const products = await listProducts({ activeOnly: true });
          for (const p of products) {
            entries.push({
              path: `/products/${p.slug || p.id}`,
              lastmod: new Date(p.updatedAt || p.createdAt || Date.now()).toISOString(),
              changefreq: "weekly",
              priority: "0.8",
            });
          }
        } catch (e) {
          console.error("[sitemap] failed to list products", e);
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
