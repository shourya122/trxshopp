import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Card, PageHeader, Badge } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/reviews")({ component: Reviews });

const reviews = [
  { name: "Maya Chen", rating: 5, product: "Steam Gift Card", body: "Instant delivery, no fuss. Bought 3 already.", time: "1h", color: "#2563EB" },
  { name: "Jordan Reyes", rating: 5, product: "Adobe Creative Cloud", body: "Cheapest legit Adobe sub I've found. Support replied in 4 minutes.", time: "3h", color: "#22C55E" },
  { name: "Léo Dubois", rating: 4, product: "ChatGPT Plus", body: "Worked great. Wish there were more billing options.", time: "8h", color: "#EF4444" },
  { name: "Sara Lindqvist", rating: 5, product: "Xbox Game Pass", body: "Activated in seconds. Will buy again.", time: "1d", color: "#8b5cf6" },
];

function Reviews() {
  const [filter, setFilter] = useState<0 | 4 | 5>(0);
  const list = filter === 0 ? reviews : reviews.filter((r) => r.rating === filter);
  return (
    <div>
      <PageHeader
        title="Reviews"
        description="Recent customer feedback across products."
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-[#18181B] p-0.5">
            {([0, 5, 4] as const).map((n) => (
              <button
                key={n}
                onClick={() => setFilter(n)}
                className={`rounded-md px-2.5 py-1 text-[11.5px] transition ${
                  filter === n ? "bg-white/[0.07] text-white" : "text-[#A1A1AA] hover:text-white"
                }`}
              >
                {n === 0 ? "All" : `${n} stars`}
              </button>
            ))}
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {list.map((r) => (
          <Card key={r.name} className="p-5">
            <div className="flex items-start gap-3">
              <div
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
                style={{ background: `linear-gradient(135deg, ${r.color}, #18181B)` }}
              >
                {r.name.split(" ").map((w) => w[0]).join("")}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] text-white">{r.name}</div>
                    <div className="text-[11.5px] text-[#71717A]">on {r.product}</div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-white/15"}`} />
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-[#D4D4D8]">{r.body}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge tone="success">verified buyer</Badge>
                  <span className="text-[11px] text-[#71717A]">{r.time} ago</span>
                  <button
                    onClick={() => toast.success(`Replied to ${r.name}`, { description: "They'll see it in their inbox." })}
                    className="ml-auto rounded-md border border-white/[0.06] bg-[#0B0B0E] px-2.5 py-1 text-[11px] text-[#A1A1AA] hover:text-white"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {list.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/[0.06] p-12 text-center text-[12.5px] text-[#71717A]">
            No reviews match this filter.
          </div>
        )}
      </div>
    </div>
  );
}