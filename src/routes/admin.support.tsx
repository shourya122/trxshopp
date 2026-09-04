import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, PageHeader, Badge } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/support")({ component: Support });

type Ticket = {
  id: string; subject: string; customer: string;
  priority: "high" | "med" | "low"; status: "open" | "waiting" | "closed"; updated: string;
};

const seed: Ticket[] = [
  { id: "TKT-1429", subject: "Steam key invalid", customer: "Maya Chen", priority: "high" as const, status: "open" as const, updated: "8m" },
  { id: "TKT-1428", subject: "Refund for duplicate order", customer: "Jordan Reyes", priority: "med" as const, status: "open" as const, updated: "22m" },
  { id: "TKT-1427", subject: "Can't redeem Xbox code", customer: "Sara Lindqvist", priority: "med" as const, status: "waiting" as const, updated: "1h" },
  { id: "TKT-1426", subject: "Invoice request", customer: "Anika Patel", priority: "low" as const, status: "open" as const, updated: "3h" },
  { id: "TKT-1425", subject: "Login issue on iOS", customer: "Léo Dubois", priority: "low" as const, status: "closed" as const, updated: "1d" },
];

function Support() {
  const [tickets, setTickets] = useState<Ticket[]>(seed);
  const [tab, setTab] = useState<"all" | "open" | "waiting" | "closed">("all");
  const list = tab === "all" ? tickets : tickets.filter((t) => t.status === tab);

  const closeOne = (id: string) => {
    setTickets((t) => t.map((x) => (x.id === id ? { ...x, status: "closed" } : x)));
    toast.success(`#${id} closed`);
  };

  return (
    <div>
      <PageHeader
        title="Support"
        description="Customer tickets and conversations."
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-[#18181B] p-0.5">
            {(["all", "open", "waiting", "closed"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-2.5 py-1 text-[11.5px] capitalize ${
                  tab === t ? "bg-white/[0.07] text-white" : "text-[#A1A1AA] hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        }
      />
      <Card>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04] text-left text-[11px] uppercase tracking-wider text-[#52525B]">
              <th className="px-5 py-2.5 font-medium">Ticket</th>
              <th className="px-3 py-2.5 font-medium">Subject</th>
              <th className="px-3 py-2.5 font-medium">Customer</th>
              <th className="px-3 py-2.5 font-medium">Priority</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Updated</th>
              <th className="px-5 py-2.5 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id} className="border-b border-white/[0.04] text-[12.5px] hover:bg-white/[0.02]">
                <td className="px-5 py-3 font-mono text-white">#{t.id}</td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => toast(t.subject, { description: `#${t.id} · ${t.customer}` })}
                    className="text-left text-white hover:underline"
                  >
                    {t.subject}
                  </button>
                </td>
                <td className="px-3 py-3 text-[#A1A1AA]">{t.customer}</td>
                <td className="px-3 py-3">
                  <Badge tone={t.priority === "high" ? "danger" : t.priority === "med" ? "warning" : "neutral"}>
                    {t.priority}
                  </Badge>
                </td>
                <td className="px-3 py-3">
                  <Badge tone={t.status === "open" ? "info" : t.status === "waiting" ? "warning" : "success"}>
                    {t.status}
                  </Badge>
                </td>
                <td className="px-3 py-3 tabular-nums text-[#A1A1AA]">{t.updated}</td>
                <td className="px-5 py-3 text-right">
                  {t.status !== "closed" ? (
                    <button
                      onClick={() => closeOne(t.id)}
                      className="rounded-md border border-white/[0.06] bg-[#0B0B0E] px-2.5 py-1 text-[11px] text-[#A1A1AA] hover:text-white"
                    >
                      Close
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#52525B]">—</span>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-[12.5px] text-[#71717A]">
                  No tickets in this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}