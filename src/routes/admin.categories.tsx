import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Loader } from "@/components/Loader";
import { PageHeader, Badge } from "@/components/admin/ui";
import { adminListCategories } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/categories")({ component: Categories });

const palette = ["#2563EB", "#22C55E", "#F59E0B", "#8b5cf6", "#EF4444", "#0ea5e9"];

function Categories() {
  const listFn = useServerFn(adminListCategories);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => listFn(),
    refetchOnWindowFocus: false,
  });

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Auto-tagged collections built from your product catalog."
      />
      {isLoading && (
        <div className="grid place-items-center py-12"><Loader size={40} /></div>
      )}
      {!isLoading && rows.length === 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-8 text-center text-[12.5px] text-[#71717A]">
          No categories yet — add a category to a product to see it here.
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((c, i) => {
          const color = palette[i % palette.length];
          return (
            <div key={c.name} className="rounded-xl border border-white/[0.06] bg-[#111113] p-5 text-left transition hover:border-white/10">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg" style={{ background: `linear-gradient(135deg, ${color}, #18181B)` }} />
                <Badge tone="neutral">{c.count} product{c.count === 1 ? "" : "s"}</Badge>
              </div>
              <h3 className="mt-4 text-[14px] font-medium text-white">{c.name}</h3>
              <p className="mt-1 text-[11.5px] text-[#A1A1AA]">Auto-tagged from catalog</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
