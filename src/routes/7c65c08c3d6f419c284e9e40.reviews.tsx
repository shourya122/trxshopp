import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Star, Plus, Trash2, Loader2, Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";
import { Card, PageHeader, Badge } from "@/components/admin/ui";
import { adminListReviews, adminSaveReview, adminDeleteReview, type AdminReview } from "@/lib/admin.functions";

export const Route = createFileRoute("/7c65c08c3d6f419c284e9e40/reviews")({ component: Reviews });

type Draft = {
  id: string | null;
  author_name: string;
  rating: number;
  body: string;
  product_title: string;
  time_label: string;
  verified: boolean;
  published: boolean;
  sort_order: number;
};

const emptyDraft = (): Draft => ({
  id: null,
  author_name: "",
  rating: 5,
  body: "",
  product_title: "",
  time_label: "",
  verified: true,
  published: true,
  sort_order: 0,
});

const toDraft = (r: AdminReview): Draft => ({
  id: r.id,
  author_name: r.author_name,
  rating: r.rating,
  body: r.body,
  product_title: r.product_title ?? "",
  time_label: r.time_label ?? "",
  verified: r.verified,
  published: r.published,
  sort_order: r.sort_order ?? 0,
});

function Reviews() {
  const listFn = useServerFn(adminListReviews);
  const saveFn = useServerFn(adminSaveReview);
  const deleteFn = useServerFn(adminDeleteReview);
  const qc = useQueryClient();

  const [filter, setFilter] = useState<0 | 4 | 5>(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["admin-reviews"], queryFn: () => listFn() });
  const reviews = data ?? [];
  const list = filter === 0 ? reviews : reviews.filter((r) => r.rating === filter);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-reviews"] });

  const save = async () => {
    if (!draft) return;
    if (!draft.author_name.trim()) { toast.error("Name is required"); return; }
    if (!draft.body.trim()) { toast.error("Review text is required"); return; }
    setSaving(true);
    try {
      await saveFn({
        data: {
          id: draft.id,
          values: {
            author_name: draft.author_name.trim(),
            rating: draft.rating,
            body: draft.body.trim(),
            product_title: draft.product_title.trim(),
            time_label: draft.time_label.trim(),
            verified: draft.verified,
            published: draft.published,
            sort_order: Math.max(0, Math.floor(Number(draft.sort_order) || 0)),
          },
        },
      });
      toast.success(draft.id ? "Review updated" : "Review added");
      setDraft(null);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (r: AdminReview) => {
    try {
      await saveFn({
        data: {
          id: r.id,
          values: {
            author_name: r.author_name,
            rating: r.rating,
            body: r.body,
            product_title: r.product_title ?? "",
            time_label: r.time_label ?? "",
            verified: r.verified,
            published: !r.published,
            sort_order: r.sort_order ?? 0,
          },
        },
      });
      toast.success(r.published ? "Hidden from site" : "Now visible on site");
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async (r: AdminReview) => {
    try {
      await deleteFn({ data: { id: r.id } });
      toast.success("Review deleted");
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Reviews"
        description="Customer feedback shown on product pages. Add, edit, hide or delete."
        actions={
          <div className="flex items-center gap-2">
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
            <button
              onClick={() => setDraft(emptyDraft())}
              className="flex h-8 items-center gap-1.5 rounded-md bg-[#2563EB] px-3 text-[12px] font-medium text-white hover:bg-[#1d4ed8]"
            >
              <Plus className="h-3.5 w-3.5" /> Add review
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] p-12 text-[12.5px] text-[#71717A]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading reviews…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {list.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#18181B] text-[11px] font-semibold text-white">
                  {r.author_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] text-white">{r.author_name}</div>
                      <div className="truncate text-[11.5px] text-[#71717A]">
                        {r.product_title ? `on ${r.product_title}` : "store review"}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-white/15"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-[#D4D4D8]">{r.body}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {r.verified && <Badge tone="success">verified buyer</Badge>}
                    <Badge tone={r.published ? "success" : "neutral"}>{r.published ? "live" : "hidden"}</Badge>
                    {r.time_label && <span className="text-[11px] text-[#71717A]">{r.time_label}</span>}
                    <div className="ml-auto flex items-center gap-1.5">
                      <button
                        onClick={() => togglePublished(r)}
                        title={r.published ? "Hide from site" : "Show on site"}
                        className="grid h-7 w-7 place-items-center rounded-md border border-white/[0.06] bg-[#0B0B0E] text-[#A1A1AA] hover:text-white"
                      >
                        {r.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => setDraft(toDraft(r))}
                        className="rounded-md border border-white/[0.06] bg-[#0B0B0E] px-2.5 py-1 text-[11px] text-[#A1A1AA] hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(r)}
                        title="Delete review"
                        className="grid h-7 w-7 place-items-center rounded-md border border-white/[0.06] bg-[#0B0B0E] text-[#f87171] hover:bg-[#EF4444]/[0.08]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
      )}

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setDraft(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[min(92vw,560px)] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0B0B0E] text-white"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
              <div className="text-[13px] font-semibold">{draft.id ? "Edit review" : "Add review"}</div>
              <button onClick={() => setDraft(null)} className="grid h-8 w-8 place-items-center rounded-md text-[#A1A1AA] hover:bg-white/[0.06] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <Input value={draft.author_name} onChange={(v) => setDraft({ ...draft, author_name: v })} />
                </Field>
                <Field label="Product (optional)">
                  <Input value={draft.product_title} onChange={(v) => setDraft({ ...draft, product_title: v })} placeholder="e.g. Prime Video" />
                </Field>
              </div>

              <Field label="Rating">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setDraft({ ...draft, rating: n })} className="p-1">
                      <Star className={`h-5 w-5 ${n <= draft.rating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-white/20"}`} />
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Review text">
                <textarea
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  rows={4}
                  className="w-full rounded-md border border-white/[0.06] bg-[#111113] px-2.5 py-2 text-[12.5px] text-white outline-none placeholder:text-[#52525B] focus:border-white/15"
                  placeholder="What the customer said…"
                />
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Time label">
                  <Input value={draft.time_label} onChange={(v) => setDraft({ ...draft, time_label: v })} placeholder="e.g. 3 days ago" />
                </Field>
                <Field label="Order (lower shows first)">
                  <Input
                    type="number"
                    value={String(draft.sort_order)}
                    onChange={(v) => setDraft({ ...draft, sort_order: Math.max(0, Math.floor(Number(v) || 0)) })}
                  />
                </Field>
              </div>

              <div className="flex items-center gap-2">
                <Check label="Verified buyer" value={draft.verified} onChange={(v) => setDraft({ ...draft, verified: v })} />
                <Check label="Show on site" value={draft.published} onChange={(v) => setDraft({ ...draft, published: v })} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-5 py-3">
              <button onClick={() => setDraft(null)} className="h-8 rounded-md border border-white/[0.06] px-3 text-[12px] text-[#D4D4D8] hover:bg-white/[0.04]">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="h-8 rounded-md bg-[#2563EB] px-3 text-[12px] font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-[#71717A]">{label}</div>
      {children}
    </div>
  );
}

function Input({
  value, onChange, type = "text", placeholder,
}: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-8 w-full rounded-md border border-white/[0.06] bg-[#111113] px-2.5 text-[12.5px] text-white outline-none placeholder:text-[#52525B] focus:border-white/15"
    />
  );
}

function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-white/[0.06] bg-[#111113] px-2.5 py-1.5 text-[12px] text-[#D4D4D8]">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="h-3.5 w-3.5 accent-[#2563EB]" />
      {label}
    </label>
  );
}
