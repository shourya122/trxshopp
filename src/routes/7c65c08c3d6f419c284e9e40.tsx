import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/260519")({
  head: () => ({
    meta: [
      { title: "TRXSHOP Admin" },
      { name: "description", content: "TRXSHOP admin console." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminShell,
});