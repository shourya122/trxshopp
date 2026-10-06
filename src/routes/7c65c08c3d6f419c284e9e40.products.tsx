import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Plus, Search, SlidersHorizontal, Loader2, Pencil } from "lucide-react";
import { Loader } from "@/components/Loader";
import { toast } from "sonner";
import { toastPromise } from "@/lib/toast-utils";
import { Card, PageHeader, Badge } from "@/components/admin/ui";
import { adminListProducts, adminUpdateProduct, adminDeleteProduct, adminCreateProduct } from "@/lib/admin.functions";
import { ProductEditDialog, type EditableProduct } from "@/components/admin/ProductEditDialog";

export const Route = createFileRoute("/7c65c08c3d6f419c284e9e40/products")({ component: Products });

const inr = (cents: number) => `₹${(cents / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function Products() {
  const listFn = useServerFn(adminListProducts);
  const updateFn = useServerFn(adminUpdateProduct);
  const deleteFn = useServerFn(adminDeleteProduct);
  const createFn = useServerFn(adminCreateProduct);
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => listFn(),
    refetchOnWindowFocus: false,
  });

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<EditableProduct | null>(null);

  const categories = useMemo(() => {
    const presets = ["Games", "Digital Products", "Music", "Streaming"];
    const s = new Set<string>(presets);
    rows.forEach((p) => { if (p.category) s.add(p.category as string); });
    return Array.from(s);
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((p) => {
      const activeStatus = p.active ? "active" : "draft";
      const stockStatus = (p.stock ?? 0) <= 0 ? "out" : activeStatus;
      return (cat === "all" || p.category === cat) &&
        (status === "all" || status === stockStatus) &&
        (!q || (p.title as string).toLowerCase().includes(q) || (p.slug as string).toLowerCase().includes(q));
    });
  }, [rows, query, cat, status]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
  };

  const addProduct = async () => {
    const title = window.prompt("Product title?");
    if (!title) return;
    const priceStr = window.prompt("Price in ₹?", "999");
    const price = Math.round((Number(priceStr) || 0) * 100);
    const category = window.prompt(
      "Category? (Games, Digital Products, Music, Streaming, or custom)",
      "Games",
    ) || "Games";
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    toastPromise(
      createFn({ data: { title, slug, price_cents: price, category } }).then(invalidate),
      {
        loading: `Creating "${title}"…`,
        success: "Product created (draft)",
        error: (e) => (e as Error).message,
      },
    );
  };

  const toggleActive = async (id: string, active: boolean) => {
    toastPromise(
      updateFn({ data: { id, patch: { active: !active } } }).then(invalidate),
      {
        loading: active ? "Moving to draft…" : "Publishing…",
        success: active ? "Set to draft" : "Set to active",
        error: (e) => (e as Error).message,
      },
    );
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    if (!confirm(`Delete ${ids.length} product${ids.length > 1 ? "s" : ""}?`)) return;
    toastPromise(
      (async () => {
        for (const id of ids) {
          try { await deleteFn({ data: { id } }); } catch { /* ignore */ }
        }
        setSelected(new Set());
        invalidate();
      })(),
      {
        loading: `Deleting ${ids.length} product${ids.length > 1 ? "s" : ""}…`,
        success: `Deleted ${ids.length}`,
        error: (e) => (e as Error).message,
      },
    );
  };

  const bulkStock = async (inStock: boolean) => {
    const targets = rows.filter((p) => selected.has(p.id as string));
    if (!targets.length) return;
    toastPromise(
      (async () => {
        for (const p of targets) {
          const editions = Array.isArray(p.editions) ? (p.editions as { name: string; price_cents: number; out_of_stock?: boolean; stock?: number | null }[]) : [];
          const patch: Record<string, unknown> = editions.length
            ? {
                editions: editions.map((e) => ({
                  ...e,
                  out_of_stock: !inStock,
                  stock: inStock ? (e.stock && e.stock > 0 ? e.stock : 999) : 0,
                })),
              }
            : { stock: inStock ? 999 : 0 };
          try { await updateFn({ data: { id: p.id as string, patch } }); } catch { /* ignore */ }
        }
        setSelected(new Set());
        invalidate();
      })(),
      {
        loading: inStock ? `Marking ${targets.length} in stock…` : `Marking ${targets.length} sold out…`,
        success: inStock ? "Marked in stock" : "Marked sold out",
        error: (e) => (e as Error).message,
      },
    );
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id as string));
  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id as string)));
    }
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage your digital catalog."
        actions={
          <button onClick={addProduct} className="flex h-8 items-center gap-1.5 rounded-md bg-[#2563EB] px-3 text-[12px] font-medium text-white hover:bg-[#1d4ed8]">
            <Plus className="h-3 w-3" /> New product
          </button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <div className="flex h-8 w-full max-w-xs items-center gap-2 rounded-md border border-white/[0.06] bg-[#0B0B0E] px-2.5 sm:w-72">
            <Search className="h-3.5 w-3.5 text-[#71717A]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" className="w-full bg-transparent text-[12px] text-white outline-none placeholder:text-[#52525B]" />
          </div>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="h-8 rounded-md border border-white/[0.06] bg-[#111113] px-2 text-[11.5px] text-[#A1A1AA]">
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-8 rounded-md border border-white/[0.06] bg-[#111113] px-2 text-[11.5px] text-[#A1A1AA]">
            <option value="all">Any status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="out">Out of stock</option>
          </select>
          <span className="ml-auto text-[11.5px] text-[#71717A]"><SlidersHorizontal className="mr-1 inline h-3 w-3" />{filtered.length} of {rows.length}</span>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] bg-[#2563EB]/[0.07] px-5 py-2 text-[12px]">
            <span className="text-white">{selected.size} selected</span>
            <button onClick={() => bulkStock(true)} className="rounded-md px-2 py-1 text-[#4ade80] hover:bg-[#22C55E]/[0.1]">Mark in stock</button>
            <button onClick={() => bulkStock(false)} className="rounded-md px-2 py-1 text-[#fbbf24] hover:bg-[#F59E0B]/[0.1]">Mark sold out</button>
            <button onClick={bulkDelete} className="rounded-md px-2 py-1 text-[#f87171] hover:bg-[#EF4444]/[0.1]">Delete</button>
            <button onClick={() => setSelected(new Set())} className="ml-auto rounded-md px-2 py-1 text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white">Clear</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04] text-left text-[11px] uppercase tracking-wider text-[#52525B]">
                <th className="w-10 px-5 py-2.5">
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} title="Select all" className="h-3.5 w-3.5 cursor-pointer rounded border-white/20 bg-transparent accent-[#2563EB]" />
                </th>
                <th className="px-3 py-2.5 font-medium">Product</th>
                <th className="px-3 py-2.5 font-medium">Category</th>
                <th className="px-3 py-2.5 font-medium">Price</th>
                <th className="px-3 py-2.5 font-medium">Stock</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="w-10 px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="px-5 py-12 text-center"><Loader size={40} className="mx-auto" /></td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-[12.5px] text-[#71717A]">No products match.</td></tr>
              )}
              {filtered.map((p, i) => {
                const stock = (p.stock as number) ?? 0;
                const isActive = p.active as boolean;
                return (
                  <motion.tr
                    key={p.id as string}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.02 * i }}
                    className="border-b border-white/[0.04] text-[12.5px] transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3">
                      <input type="checkbox" checked={selected.has(p.id as string)} onChange={() => toggle(p.id as string)} className="h-3.5 w-3.5 cursor-pointer rounded border-white/20 bg-transparent accent-[#2563EB]" />
                    </td>
                    <td className="cursor-pointer px-3 py-3" onClick={() => setEditing(p as EditableProduct)}>
                      <div className="flex items-center gap-3">
                        {p.cover_image ? (
                          <img src={p.cover_image as string} alt="" className="h-9 w-9 shrink-0 rounded-md border border-white/[0.06] object-cover" />
                        ) : (
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/[0.06] bg-white/[0.04] text-[10px] font-bold text-[#71717A]">
                            {(p.title as string).slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col leading-tight">
                          <span className="text-white hover:underline">{p.title as string}</span>
                          <span className="font-mono text-[10.5px] text-[#71717A]">{p.slug as string}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={(p.category as string) || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "__custom__") {
                            const custom = window.prompt("New category name?", (p.category as string) || "");
                            if (!custom) return;
                            toastPromise(
                              updateFn({ data: { id: p.id as string, patch: { category: custom } } }).then(invalidate),
                              { loading: "Updating…", success: `Moved to "${custom}"`, error: (er) => (er as Error).message },
                            );
                            return;
                          }
                          toastPromise(
                            updateFn({ data: { id: p.id as string, patch: { category: value || null } } }).then(invalidate),
                            { loading: "Updating…", success: "Category updated", error: (er) => (er as Error).message },
                          );
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-7 max-w-[160px] rounded-md border border-white/[0.06] bg-[#111113] px-2 text-[11.5px] text-[#D4D4D8] outline-none hover:border-white/15 focus:border-white/20"
                      >
                        <option value="">— Uncategorised</option>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        <option value="__custom__">+ Custom…</option>
                      </select>
                    </td>
                    <td className="px-3 py-3 tabular-nums text-white">{inr(p.price_cents as number)}</td>
                    <td className="px-3 py-3 tabular-nums">
                      <span className={stock === 0 ? "text-[#f87171]" : stock < 100 ? "text-[#fbbf24]" : "text-[#D4D4D8]"}>{stock.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => toggleActive(p.id as string, isActive)} className="transition hover:opacity-80" title="Toggle status">
                        <Badge tone={stock === 0 ? "danger" : isActive ? "success" : "neutral"}>
                          {stock === 0 ? "out of stock" : isActive ? "active" : "draft"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => setEditing(p as EditableProduct)}
                        className="grid h-7 w-7 place-items-center rounded-md text-[#A1A1AA] transition hover:bg-white/[0.04] hover:text-white"
                        title="Edit product"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <ProductEditDialog product={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
