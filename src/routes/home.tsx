import { createFileRoute } from "@tanstack/react-router";
import { Route as IndexRoute } from "./index";

const IndexComponent = IndexRoute.options.component as any;

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Main" },
      { name: "description", content: "PC, PlayStation & Xbox games — instant digital delivery, lowest prices, official keys guaranteed." },
      { property: "og:title", content: "Main" },
      { property: "og:description", content: "Instant key delivery, best prices, official keys for every platform." },
      { property: "og:image", content: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg" },
    ],
  }),
  component: IndexComponent,
});
