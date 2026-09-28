import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Plus, Trash2, Image as ImageIcon, Save, UploadCloud, GripVertical, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { adminUpdateProduct } from "@/lib/admin.functions";
import { RichTextEditor, sanitizeHtml } from "@/components/admin/RichTextEditor";
import { uploadProductImages, isImageFile } from "@/lib/product-images";
import { AiWriteBar } from "@/components/admin/AiWriteBar";


/**
 * Full product editor — image, description, pricing, inventory, metadata.
 * Wired to `adminUpdateProduct` with an in-flight loading toast.
 */

export type EditableProduct = {
  id: string;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  product_details?: string | null;
  terms_conditions?: string | null;
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
  editions?: { name: string; price_cents: number; out_of_stock?: boolean; stock?: number | null }[] | null;
  editions_label?: string | null;


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
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingShots, setUploadingShots] = useState(false);
  const [coverHover, setCoverHover] = useState(false);
  const [shotsHover, setShotsHover] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const shotsInput = useRef<HTMLInputElement>(null);

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

  // ---- Drag & drop image upload / reorder ----


  const pickFiles = (list: FileList | null) =>
    Array.from(list ?? []).filter(isImageFile);

  const uploadCover = async (files: File[]) => {
    if (!files.length) return;
    setUploadingCover(true);
    try {
      const [url] = await uploadProductImages(files.slice(0, 1), "covers");
      if (url) set("cover_image", url);
      toast.success("Cover image uploaded");
    } catch (e) {
      toast.error((e as Error).message || "Upload failed");
    } finally {
      setUploadingCover(false);
    }
  };

  const uploadShots = async (files: File[]) => {
    if (!files.length) return;
    setUploadingShots(true);
    try {
      const urls = await uploadProductImages(files, "screenshots");
      setForm((f) =>
        f ? { ...f, screenshots: [...(f.screenshots ?? []).filter((s) => s.trim()), ...urls] } : f,
      );
      toast.success(`${urls.length} image${urls.length > 1 ? "s" : ""} uploaded`);
    } catch (e) {
      toast.error((e as Error).message || "Upload failed");
    } finally {
      setUploadingShots(false);
    }
  };

  const moveScreenshot = (from: number, to: number) => {
    const next = [...(form.screenshots ?? [])];
    if (from === to || from < 0 || to < 0 || from >= next.length || to >= next.length) return;
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    set("screenshots", next);
  };

  const editions = form.editions ?? [];
  const updateEdition = (i: number, patch: Partial<{ name: string; price_cents: number; out_of_stock?: boolean; stock?: number | null }>) => {
    const next = editions.map((e, idx) => (idx === i ? { ...e, ...patch } : e));
    set("editions", next);
  };
  const removeEdition = (i: number) => {
    const next = [...editions];
    next.splice(i, 1);
    set("editions", next);
  };
  const addEdition = () => set("editions", [...editions, { name: "", price_cents: form.price_cents ?? 0 }]);



  const save = async () => {
    if (!form.title?.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    const patch: Record<string, unknown> = {
      title: form.title.trim(),
      slug: form.slug?.trim() || undefined,
      description: sanitizeHtml(form.description ?? ""),
      product_details: sanitizeHtml(form.product_details ?? ""),
      terms_conditions: sanitizeHtml(form.terms_conditions ?? ""),
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
        .map((e) => {
          const hasStock = e.stock !== null && e.stock !== undefined && Number.isFinite(Number(e.stock));
          const stock = hasStock ? Math.max(0, Math.floor(Number(e.stock))) : null;
          return {
            name: e.name.trim(),
            price_cents: Math.max(0, Math.round(Number(e.price_cents) || 0)),
            out_of_stock: !!e.out_of_stock || stock === 0,
            stock,
          };
        })
        .filter((e) => e.name.length > 0),
      editions_label: (form.editions_label ?? "").trim(),
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
            <div
              onDragOver={(e) => { e.preventDefault(); setCoverHover(true); }}
              onDragLeave={() => setCoverHover(false)}
              onDrop={(e) => { e.preventDefault(); setCoverHover(false); uploadCover(pickFiles(e.dataTransfer.files)); }}
              onClick={() => coverInput.current?.click()}
              className={`relative grid aspect-[3/4] w-full cursor-pointer place-items-center overflow-hidden rounded-md border transition ${
                coverHover ? "border-[#2563EB] bg-[#2563EB]/[0.08]" : "border-white/[0.06] bg-white/[0.02] hover:border-white/20"
              }`}
            >
              {form.cover_image ? (
                <img src={form.cover_image} alt="cover" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-[#52525B]" />
              )}
              {(coverHover || uploadingCover) && (
                <div className="absolute inset-0 grid place-items-center gap-1 bg-black/70 text-[11.5px] text-white">
                  {uploadingCover ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                  <span>{uploadingCover ? "Uploading…" : "Drop image"}</span>
                </div>
              )}
            </div>
            <input
              ref={coverInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { uploadCover(pickFiles(e.target.files)); e.currentTarget.value = ""; }}
            />
            <p className="text-[11px] text-[#71717A]">Drag an image here, or click to browse.</p>
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
              <AiWriteBar
                target="description"
                title={form.title}
                category={form.category}
                hasContent={!!(form.description ?? "").trim()}
                onResult={(html, mode) =>
                  set("description", mode === "append" ? `${form.description ?? ""}${html}` : html)
                }
              />
              <RichTextEditor
                value={form.description ?? ""}
                onChange={(html) => set("description", html)}
                placeholder="Rich, keyword-friendly copy shown on the product page."
              />
            </Field>

            <Field label="Product Details">
              <AiWriteBar
                target="product_details"
                title={form.title}
                category={form.category}
                hasContent={!!(form.product_details ?? "").trim()}
                placeholder="e.g. what's included, delivery time, platform, validity"
                onResult={(html, mode) =>
                  set("product_details", mode === "append" ? `${form.product_details ?? ""}${html}` : html)
                }
              />
              <RichTextEditor
                value={form.product_details ?? ""}
                onChange={(html) => set("product_details", html)}
                placeholder="Shown under 'Product Details' on the product page. Use numbered/bullet lists."
              />
            </Field>

            <Field label="Terms & Conditions">
              <AiWriteBar
                target="terms_conditions"
                title={form.title}
                category={form.category}
                hasContent={!!(form.terms_conditions ?? "").trim()}
                placeholder="e.g. no refunds after delivery, single-account use, 24h support"
                onResult={(html, mode) =>
                  set("terms_conditions", mode === "append" ? `${form.terms_conditions ?? ""}${html}` : html)
                }
              />
              <RichTextEditor
                value={form.terms_conditions ?? ""}
                onChange={(html) => set("terms_conditions", html)}
                placeholder="Shown under 'Terms & Conditions' on the product page."
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
                  <div
                    key={i}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragEnter={() => setOverIndex(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = pickFiles(e.dataTransfer.files);
                      if (files.length) uploadShots(files);
                      else if (dragIndex !== null) moveScreenshot(dragIndex, i);
                      setDragIndex(null); setOverIndex(null);
                    }}
                    onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                    className={`flex items-center gap-2 rounded-md border p-1.5 transition ${
                      overIndex === i && dragIndex !== null && dragIndex !== i
                        ? "border-[#2563EB] bg-[#2563EB]/[0.08]"
                        : "border-transparent"
                    } ${dragIndex === i ? "opacity-50" : ""}`}
                  >
                    <span className="cursor-grab text-[#52525B] active:cursor-grabbing" title="Drag to reorder">
                      <GripVertical className="h-3.5 w-3.5" />
                    </span>
                    {s.trim() ? (
                      <img src={s} alt="" className="h-8 w-8 shrink-0 rounded border border-white/[0.06] object-cover" />
                    ) : (
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded border border-white/[0.06] text-[#52525B]">
                        <ImageIcon className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <Input value={s} onChange={(v) => updateScreenshot(i, v)} placeholder="https://…" />
                    <button onClick={() => removeScreenshot(i)} className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/[0.06] text-[#f87171] hover:bg-[#EF4444]/[0.08]">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                <div
                  onDragOver={(e) => { e.preventDefault(); if (dragIndex === null) setShotsHover(true); }}
                  onDragLeave={() => setShotsHover(false)}
                  onDrop={(e) => {
                    e.preventDefault(); setShotsHover(false);
                    const files = pickFiles(e.dataTransfer.files);
                    if (files.length) uploadShots(files);
                    else if (dragIndex !== null) moveScreenshot(dragIndex, (form.screenshots ?? []).length - 1);
                    setDragIndex(null); setOverIndex(null);
                  }}
                  onClick={() => shotsInput.current?.click()}
                  className={`flex h-20 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed text-[11.5px] transition ${
                    shotsHover ? "border-[#2563EB] bg-[#2563EB]/[0.08] text-white" : "border-white/[0.1] text-[#A1A1AA] hover:border-white/20 hover:text-white"
                  }`}
                >
                  {uploadingShots ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  <span>{uploadingShots ? "Uploading…" : "Drop images here or click to browse"}</span>
                </div>
                <input
                  ref={shotsInput}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => { uploadShots(pickFiles(e.target.files)); e.currentTarget.value = ""; }}
                />
                <button onClick={addScreenshot} className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-white/[0.1] text-[11.5px] text-[#A1A1AA] hover:border-white/20 hover:text-white">
                  <Plus className="h-3 w-3" /> Add image URL
                </button>
              </div>
            </Field>

            {/* Variants — editions with optional per-edition price */}
            <div className="rounded-xl border border-white/[0.08] bg-[#111113] p-4">
              <div className="text-[13px] font-semibold text-white">Variants</div>
              <p className="mt-1 text-[11.5px] text-[#71717A]">
                Optional. Add editions and their prices. The label below is shown above the selector on the product
                page — leave it blank to show “Edition”.
              </p>

              <div className="mt-3 space-y-3">
                <Field label="Selector name">
                  <Input
                    value={form.editions_label ?? ""}
                    onChange={(v) => set("editions_label", v)}
                    placeholder="e.g. Choose your plan"
                  />
                </Field>

                <Field label="Editions (optional)">
                  <div className="space-y-2">
                    {editions.length === 0 && (
                      <p className="text-[11px] text-[#71717A]">
                        No editions defined. Product page will show the base price and no edition selector.
                      </p>
                    )}
                    {editions.map((e, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <Input value={e.name} onChange={(v) => updateEdition(i, { name: v })} placeholder="Edition name (e.g. Standard)" />
                        </div>
                        <div className="w-28 shrink-0">
                          <Input
                            type="number"
                            value={((e.price_cents ?? 0) / 100).toString()}
                            onChange={(v) => updateEdition(i, { price_cents: Math.round((Number(v) || 0) * 100) })}
                            placeholder="Price (₹)"
                          />
                        </div>
                        <div className="w-24 shrink-0">
                          <Input
                            type="number"
                            value={e.stock === null || e.stock === undefined ? "" : String(e.stock)}
                            onChange={(v) =>
                              updateEdition(i, {
                                stock: v.trim() === "" ? null : Math.max(0, Math.floor(Number(v) || 0)),
                              })
                            }
                            placeholder="Stock"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => updateEdition(i, { out_of_stock: !e.out_of_stock })}
                          title="Toggle stock for this edition"
                          className={`h-8 shrink-0 rounded-md border px-2.5 text-[11px] font-medium transition ${e.out_of_stock || e.stock === 0 ? "border-[#EF4444]/40 bg-[#EF4444]/[0.1] text-[#f87171]" : "border-[#22c55e]/30 bg-[#22c55e]/[0.08] text-[#4ade80]"}`}
                        >
                          {e.out_of_stock || e.stock === 0 ? "Out of stock" : "In stock"}
                        </button>
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
