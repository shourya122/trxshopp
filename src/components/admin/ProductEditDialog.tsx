import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Plus, Trash2, Image as ImageIcon, Save } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { adminUpdateProduct } from "@/lib/admin.functions";

/**
 * Full product editor — image, description, pricing, inventory, metadata.
 * Wired to `adminUpdateProduct` with an in-flight loading toast.
 */

export type EditableProduct = {
  id: string;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  category?: string | null;
  genre?: string | null;
  developer?: string | null;
  publisher?: string | null;
  release_date?: string | null;
  languages?: string | null;
  platforms?: string[] | null;
  cover_image?: string | null;
  screenshots?: string[] | null;
  price_cents?: number | null;
  old_price_cents?: number | null;
  stock?: number | null;
  active?: boolean | null;
  featured?: boolean | null;
  badge?: string | null;
  editions?: { name: string; price_cents: number }[] | null;
  option_groups?: { name: string; values: string[] }[] | null;

};

type Props = {
  product: EditableProduct | null;
  onClose: () => void;
};

const PLATFORMS = ["pc", "ps", "xbox"] as const;

export function ProductEditDialog({ product, onClose }: Props) {
  const updateFn = useServerFn(adminUpdateProduct);
  const qc = useQueryClient();
  const [form, setForm] = useState<EditableProduct | null>(product);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(product); }, [product]);

  if (!form) return null;

  const set = <K extends keyof EditableProduct>(k: K, v: EditableProduct[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const togglePlatform = (p: string) => {
    const cur = new Set(form.platforms ?? []);
    cur.has(p) ? cur.delete(p) : cur.add(p);
    set("platforms", Array.from(cur));
  };

  const updateScreenshot = (i: number, v: string) => {
    const next = [...(form.screenshots ?? [])];
    next[i] = v;
    set("screenshots", next);
  };
  const removeScreenshot = (i: number) => {
    const next = [...(form.screenshots ?? [])];
    next.splice(i, 1);
    set("screenshots", next);
  };
  const addScreenshot = () => set("screenshots", [...(form.screenshots ?? []), ""]);

  const editions = form.editions ?? [];
  const updateEdition = (i: number, patch: Partial<{ name: string; price_cents: number }>) => {
    const next = editions.map((e, idx) => (idx === i ? { ...e, ...patch } : e));
    set("editions", next);
  };
  const removeEdition = (i: number) => {
    const next = [...editions];
    next.splice(i, 1);
    set("editions", next);
  };
  const addEdition = () => set("editions", [...editions, { name: "", price_cents: form.price_cents ?? 0 }]);

  // Variant options (Shopify-style) — optional, per product.
  const optionGroups = form.option_groups ?? [];
  const setGroups = (next: { name: string; values: string[] }[]) => set("option_groups", next);
  const updateGroup = (i: number, patch: Partial<{ name: string; values: string[] }>) =>
    setGroups(optionGroups.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));
  const removeGroup = (i: number) => setGroups(optionGroups.filter((_, idx) => idx !== i));
  const addGroup = () => setGroups([...optionGroups, { name: "", values: [""] }]);
  const setValue = (gi: number, vi: number, v: string) =>
    updateGroup(gi, { values: (optionGroups[gi]?.values ?? []).map((x, i) => (i === vi ? v : x)) });
  const addValue = (gi: number) =>
    updateGroup(gi, { values: [...(optionGroups[gi]?.values ?? []), ""] });
  const removeValue = (gi: number, vi: number) =>
    updateGroup(gi, { values: (optionGroups[gi]?.values ?? []).filter((_, i) => i !== vi) });


  const save = async () => {
    if (!form.title?.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    const patch: Record<string, unknown> = {
      title: form.title.trim(),
      slug: form.slug?.trim() || undefined,
      description: form.description ?? "",
      category: form.category ?? "",
      genre: form.genre ?? "",
      developer: form.developer ?? "",
      publisher: form.publisher ?? "",
      release_date: form.release_date ?? "",
      languages: form.languages ?? "",
      platforms: form.platforms ?? [],
      cover_image: form.cover_image ?? "",
      screenshots: (form.screenshots ?? []).filter((s) => s.trim().length > 0),
      price_cents: form.price_cents ?? 0,
      old_price_cents: form.old_price_cents ?? 0,
      stock: form.stock ?? 0,
      active: !!form.active,
      featured: !!form.featured,
      badge: form.badge ?? "",
      editions: editions
        .map((e) => ({ name: e.name.trim(), price_cents: Math.max(0, Math.round(Number(e.price_cents) || 0)) }))
        .filter((e) => e.name.length > 0),
      option_groups: optionGroups
        .map((g) => ({
          name: g.name.trim(),
          values: (g.values ?? []).map((v) => v.trim()).filter((v) => v.length > 0),
        }))
        .filter((g) => g.name.length > 0 && g.values.length > 0),
    };

    try {
      const p = updateFn({ data: { id: form.id, patch } });
      toast.promise(p, {
        loading: "Saving product…",
        success: "Product saved",
        error: (e) => (e as Error).message,
      });
      await p;
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      onClose();
    } catch { /* error already toasted */ }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[92vh] w-[min(92vw,860px)] max-w-none flex-col overflow-hidden border-white/[0.08] bg-[#0B0B0E] p-0 text-white">
        <VisuallyHidden>
          <DialogTitle>Edit product</DialogTitle>
          <DialogDescription>Edit the details, image, and inventory for this product.</DialogDescription>
        </VisuallyHidden>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold">Edit product</div>
            <div className="truncate font-mono text-[11px] text-[#71717A]">{form.slug || form.id}</div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-[#A1A1AA] hover:bg-white/[0.06] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto p-5 lg:grid-cols-[220px_1fr]">
          {/* Cover */}
          <div className="space-y-3">
            <Label>Cover image</Label>
            <div className="grid aspect-[3/4] w-full place-items-center overflow-hidden rounded-md border border-white/[0.06] bg-white/[0.02]">
              {form.cover_image ? (
                <img src={form.cover_image} alt="cover" className="h-full w-full object-contain p-2" />
              ) : (
                <ImageIcon className="h-6 w-6 text-[#52525B]" />
              )}
            </div>
            <Input value={form.cover_image ?? ""} onChange={(v) => set("cover_image", v)} placeholder="https://…" />

            <div className="flex items-center gap-2 pt-2">
              <Check label="Active" value={!!form.active} onChange={(v) => set("active", v)} />
              <Check label="Featured" value={!!form.featured} onChange={(v) => set("featured", v)} />
            </div>

            <Field label="Badge">
              <select value={form.badge ?? ""} onChange={(e) => set("badge", e.target.value)} className="h-8 w-full rounded-md border border-white/[0.06] bg-[#111113] px-2 text-[12px] text-white">
                <option value="">None</option>
                <option value="hot">Hot</option>
                <option value="new">New</option>
                <option value="disc">Discount</option>
              </select>
            </Field>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Title"><Input value={form.title ?? ""} onChange={(v) => set("title", v)} /></Field>
              <Field label="Slug"><Input value={form.slug ?? ""} onChange={(v) => set("slug", v)} mono /></Field>
            </div>

            <Field label="Description">
              <textarea
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
                rows={5}
                placeholder="Rich, keyword-friendly copy shown on the product page."
                className="w-full resize-y rounded-md border border-white/[0.06] bg-[#111113] px-3 py-2 text-[12.5px] leading-[1.55] text-white outline-none placeholder:text-[#52525B] focus:border-white/15"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Price (₹)"><Input type="number" value={((form.price_cents ?? 0) / 100).toString()} onChange={(v) => set("price_cents", Math.round((Number(v) || 0) * 100))} /></Field>
              <Field label="Compare at (₹)"><Input type="number" value={((form.old_price_cents ?? 0) / 100).toString()} onChange={(v) => set("old_price_cents", Math.round((Number(v) || 0) * 100))} /></Field>
              <Field label="Stock"><Input type="number" value={(form.stock ?? 0).toString()} onChange={(v) => set("stock", Math.max(0, Math.floor(Number(v) || 0)))} /></Field>
              <Field label="Category">
                <>
                  <input
                    list="trx-category-options"
                    value={form.category ?? ""}
                    onChange={(e) => set("category", e.target.value)}
                    placeholder="Select or type…"
                    className="h-8 w-full rounded-md border border-white/[0.06] bg-[#111113] px-2.5 text-[12.5px] text-white outline-none placeholder:text-[#52525B] focus:border-white/15"
                  />
                  <datalist id="trx-category-options">
                    <option value="Games" />
                    <option value="Digital Products" />
                    <option value="Music" />
                    <option value="Streaming" />
                  </datalist>
                </>
              </Field>
            </div>

            <Field label="Platforms">
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => {
                  const on = (form.platforms ?? []).includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => togglePlatform(p)}
                      className={`h-7 rounded-md border px-2.5 text-[11.5px] uppercase tracking-wide transition ${
                        on ? "border-[#22C55E]/40 bg-[#22C55E]/10 text-[#4ADE80]" : "border-white/[0.08] bg-transparent text-[#A1A1AA] hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Genre"><Input value={form.genre ?? ""} onChange={(v) => set("genre", v)} /></Field>
              <Field label="Release date"><Input value={form.release_date ?? ""} onChange={(v) => set("release_date", v)} placeholder="e.g. Sep 17, 2024" /></Field>
              <Field label="Developer"><Input value={form.developer ?? ""} onChange={(v) => set("developer", v)} /></Field>
              <Field label="Publisher"><Input value={form.publisher ?? ""} onChange={(v) => set("publisher", v)} /></Field>
              <Field label="Languages"><Input value={form.languages ?? ""} onChange={(v) => set("languages", v)} placeholder="English, French, German…" /></Field>
            </div>

            <Field label="Screenshots">
              <div className="space-y-2">
                {(form.screenshots ?? []).map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={s} onChange={(v) => updateScreenshot(i, v)} placeholder="https://…" />
                    <button onClick={() => removeScreenshot(i)} className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/[0.06] text-[#f87171] hover:bg-[#EF4444]/[0.08]">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <button onClick={addScreenshot} className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-white/[0.1] text-[11.5px] text-[#A1A1AA] hover:border-white/20 hover:text-white">
                  <Plus className="h-3 w-3" /> Add screenshot
                </button>
              </div>
            </Field>

            <Field label="Editions (optional)">
              <div className="space-y-2">
                {editions.length === 0 && (
                  <p className="text-[11px] text-[#71717A]">
                    No editions defined. Product page will show the base price and no edition selector.
                  </p>
                )}
                {editions.map((e, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input value={e.name} onChange={(v) => updateEdition(i, { name: v })} placeholder="Edition name (e.g. Standard)" />
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        value={((e.price_cents ?? 0) / 100).toString()}
                        onChange={(v) => updateEdition(i, { price_cents: Math.round((Number(v) || 0) * 100) })}
                        placeholder="Price (₹)"
                      />
                    </div>
                    <button onClick={() => removeEdition(i)} className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/[0.06] text-[#f87171] hover:bg-[#EF4444]/[0.08]">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <button onClick={addEdition} className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-white/[0.1] text-[11.5px] text-[#A1A1AA] hover:border-white/20 hover:text-white">
                  <Plus className="h-3 w-3" /> Add edition
                </button>
              </div>
            </Field>

            {/* Variants — Shopify-style option selector, opt-in per product */}
            <div className="rounded-xl border border-white/[0.08] bg-[#111113] p-4">
              <div className="text-[13px] font-semibold text-white">Variants</div>
              <p className="mt-1 text-[11.5px] text-[#71717A]">
                Optional. Add choices like size, colour, or content features. Customers pick them above “Add to cart”.
              </p>

              <div className="mt-3 space-y-3">
                {optionGroups.map((g, gi) => (
                  <div key={gi} className="rounded-lg border border-white/[0.06] bg-[#0B0B0E] p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          value={g.name}
                          onChange={(v) => updateGroup(gi, { name: v })}
                          placeholder="Option name (e.g. Video game content features)"
                        />
                      </div>
                      <button
                        onClick={() => removeGroup(gi)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/[0.06] text-[#f87171] hover:bg-[#EF4444]/[0.08]"
                        title="Remove option"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {(g.values ?? []).map((v, vi) => (
                        <div key={vi} className="flex items-center gap-2">
                          <div className="flex-1">
                            <Input
                              value={v}
                              onChange={(nv) => setValue(gi, vi, nv)}
                              placeholder={vi === 0 ? "Value (e.g. Downloadable content (DLC))" : "Value (e.g. Early access)"}
                            />
                          </div>
                          <button
                            onClick={() => removeValue(gi, vi)}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/[0.06] text-[#a1a1aa] hover:bg-white/[0.05] hover:text-white"
                            title="Remove value"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addValue(gi)}
                        className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-white/[0.1] text-[11.5px] text-[#A1A1AA] hover:border-white/20 hover:text-white"
                      >
                        <Plus className="h-3 w-3" /> Add value
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addGroup}
                  className="flex items-center gap-2 text-[12.5px] text-[#D4D4D8] transition hover:text-white"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full border border-white/25 text-[12px] leading-none">+</span>
                  Add options like size or color
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-white/[0.06] bg-[#0B0B0E] px-5 py-3">
          <button onClick={onClose} className="h-8 rounded-md border border-white/[0.06] px-3 text-[12px] text-[#D4D4D8] hover:bg-white/[0.04]">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="flex h-8 items-center gap-1.5 rounded-md bg-[#2563EB] px-3 text-[12px] font-medium text-white transition hover:bg-[#1d4ed8] disabled:opacity-60">
            <Save className="h-3 w-3" /> {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------ small internal atoms ------------ */

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-[#71717A]">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function Input({
  value, onChange, type = "text", placeholder, mono, step, min,
}: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string; mono?: boolean; step?: string; min?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      step={step ?? (type === "number" ? "any" : undefined)}
      min={min}
      inputMode={type === "number" ? "decimal" : undefined}
      className={`h-8 w-full rounded-md border border-white/[0.06] bg-[#111113] px-2.5 text-[12.5px] text-white outline-none placeholder:text-[#52525B] focus:border-white/15 ${mono ? "font-mono text-[11.5px]" : ""}`}
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
