import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2, X, PackagePlus, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Card, PageHeader, Badge } from "@/components/admin/ui";
import { Loader } from "@/components/Loader";
import {
  adminSupplierData, adminSaveSupplier, adminDeleteSupplier, adminLinkSupplierItem,
  adminUnlinkSupplierItem, adminLogRestock, adminDeleteRestock, type Supplier,
} from "@/lib/suppliers.functions";

export const Route = createFileRoute("/260519/suppliers")({ component: Suppliers });

const inr = (c: number) => `₹${(c / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const when = (d: string) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
const input = "h-8 w-full rounded-md border border-white/[0.06] bg-[#0B0B0E] px-2.5 text-[12px] text-white outline-none placeholder:text-[#52525B] focus:border-white/20";
const btn = "flex h-8 items-center gap-1.5 rounded-md bg-[#2563EB] px-3 text-[12px] font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50";

type Draft = Omit<Supplier, "id" | "created_at"> & { id: string | null };
const empty: Draft = { id: null, name: "", contact_email: "", contact_discord: "", phone: "", notes: "", active: true };

function Suppliers() {
  const dataFn = useServerFn(adminSupplierData);
  const saveFn = useServerFn(adminSaveSupplier);
  const delFn = useServerFn(adminDeleteSupplier);
  const linkFn = useServerFn(adminLinkSupplierItem);
  const unlinkFn = useServerFn(adminUnlinkSupplierItem);
  const restockFn = useServerFn(adminLogRestock);
  const delRestockFn = useServerFn(adminDeleteRestock);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-suppliers"], queryFn: () => dataFn() });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-suppliers"] }); qc.invalidateQueries({ queryKey: ["admin-products"] }); };

  const [tab, setTab] = useState<"suppliers" | "inventory" | "restocks">("suppliers");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [restock, setRestock] = useState<{ supplier_id: string; product_id: string; edition_name: string; quantity: string; cost: string; notes: string; date: string } | null>(null);
  const [link, setLink] = useState({ product_id: "", edition_name: "", cost: "" });

  const suppliers = data?.suppliers ?? [];
  const products = data?.products ?? [];
  const pMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const sMap = useMemo(() => new Map(suppliers.map((s) => [s.id, s])), [suppliers]);
  const lastRestock = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of data?.restocks ?? []) {
      const k = `${r.product_id}|${r.edition_name}`;
      if (!m.has(k)) m.set(k, r.restocked_at);
    }
    return m;
  }, [data]);
  const current = sel ? sMap.get(sel) : null;
  const currentItems = (data?.items ?? []).filter((i) => i.supplier_id === sel);

  const run = async (p: Promise<unknown>, ok: string) => {
    try { await p; toast.success(ok); refresh(); return true; } catch (e) { toast.error((e as Error).message); return false; }
  };

  const openRestock = (supplier_id: string, product_id = "", edition_name = "") =>
    setRestock({ supplier_id, product_id, edition_name, quantity: "", cost: "", notes: "", date: new Date().toISOString().slice(0, 16) });

  const stockOf = (product_id: string, edition: string) => {
    const p = pMap.get(product_id);
    if (!p) return "—";
    if (!edition) return String(p.stock);
    const e = p.editions.find((x) => x.name === edition);
    if (!e) return "—";
    if (e.out_of_stock || e.stock === 0) return "Sold out";
    return e.stock === null ? "Not tracked" : String(e.stock);
  };

  if (isLoading) return <div className="py-20"><Loader size={40} className="mx-auto" /></div>;

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Manage suppliers, what they supply, and when each variant was restocked."
        actions={<button onClick={() => setDraft({ ...empty })} className={btn}><Plus className="h-3 w-3" /> New supplier</button>}
      />

      <div className="mb-4 flex gap-1">
        {(["suppliers", "inventory", "restocks"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`h-8 rounded-md px-3 text-[12px] capitalize ${tab === t ? "bg-white/[0.08] text-white" : "text-[#A1A1AA] hover:text-white"}`}>
            {t === "restocks" ? "Restock history" : t}
          </button>
        ))}
      </div>

      {tab === "suppliers" && (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Card>
            {suppliers.length === 0 && <p className="p-6 text-center text-[12.5px] text-[#71717A]">No suppliers yet.</p>}
            {suppliers.map((s) => (
              <button key={s.id} onClick={() => setSel(s.id)} className={`flex w-full items-center justify-between border-b border-white/[0.04] px-4 py-3 text-left text-[12.5px] hover:bg-white/[0.02] ${sel === s.id ? "bg-white/[0.04]" : ""}`}>
                <div>
                  <div className="text-white">{s.name}</div>
                  <div className="text-[11px] text-[#71717A]">{s.contact_email || s.contact_discord || s.phone || "No contact"}</div>
                </div>
                <Badge tone={s.active ? "success" : "neutral"}>{s.active ? "active" : "paused"}</Badge>
              </button>
            ))}
          </Card>

          <Card className="p-5">
            {!current ? (
              <p className="py-10 text-center text-[12.5px] text-[#71717A]">Select a supplier to see what they supply.</p>
            ) : (
              <div>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-[16px] font-semibold text-white">{current.name}</h2>
                    <p className="text-[12px] text-[#A1A1AA]">{[current.contact_email, current.contact_discord, current.phone].filter(Boolean).join(" · ") || "No contact details"}</p>
                    {current.notes && <p className="mt-1 text-[12px] text-[#71717A]">{current.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openRestock(current.id)} className={btn}><PackagePlus className="h-3 w-3" /> Log restock</button>
                    <button onClick={() => setDraft({ ...current })} className="h-8 rounded-md border border-white/[0.08] px-3 text-[12px] text-white hover:bg-white/[0.04]">Edit</button>
                    <button onClick={() => { if (confirm(`Delete ${current.name}?`)) run(delFn({ data: { id: current.id } }), "Supplier deleted").then(() => setSel(null)); }} className="grid h-8 w-8 place-items-center rounded-md text-[#f87171] hover:bg-[#EF4444]/10"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>

                <h3 className="mb-2 text-[11px] uppercase tracking-wider text-[#52525B]">Supplied variants</h3>
                <table className="w-full text-[12.5px]">
                  <thead><tr className="text-left text-[11px] text-[#52525B]"><th className="py-2">Product / variant</th><th>Cost</th><th>Live stock</th><th>Last restocked</th><th></th></tr></thead>
                  <tbody>
                    {currentItems.length === 0 && <tr><td colSpan={5} className="py-4 text-[#71717A]">Nothing linked yet — add below.</td></tr>}
                    {currentItems.map((it) => {
                      const last = lastRestock.get(`${it.product_id}|${it.edition_name}`);
                      return (
                        <tr key={it.id} className="border-t border-white/[0.04]">
                          <td className="py-2 text-white">{pMap.get(it.product_id)?.title ?? "Deleted product"}{it.edition_name && <span className="text-[#A1A1AA]"> — {it.edition_name}</span>}</td>
                          <td className="text-[#D4D4D8]">{inr(it.cost_cents)}</td>
                          <td className="text-[#D4D4D8]">{stockOf(it.product_id, it.edition_name)}</td>
                          <td className="text-[#A1A1AA]">{last ? when(last) : "Never"}</td>
                          <td className="text-right">
                            <button onClick={() => openRestock(current.id, it.product_id, it.edition_name)} className="mr-1 rounded px-2 py-1 text-[11.5px] text-[#60a5fa] hover:bg-white/[0.04]">Restock</button>
                            <button onClick={() => run(unlinkFn({ data: { id: it.id } }), "Removed")} className="rounded px-2 py-1 text-[11.5px] text-[#f87171] hover:bg-white/[0.04]">Remove</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-white/[0.06] p-3">
                  <label className="min-w-[200px] flex-1 text-[11px] text-[#71717A]">Product
                    <select value={link.product_id} onChange={(e) => setLink({ ...link, product_id: e.target.value, edition_name: "" })} className={input}>
                      <option value="">Choose…</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </label>
                  <label className="w-44 text-[11px] text-[#71717A]">Variant
                    <select value={link.edition_name} onChange={(e) => setLink({ ...link, edition_name: e.target.value })} className={input}>
                      <option value="">Whole product</option>
                      {pMap.get(link.product_id)?.editions.map((e) => <option key={e.name} value={e.name}>{e.name}</option>)}
                    </select>
                  </label>
                  <label className="w-28 text-[11px] text-[#71717A]">Cost ₹
                    <input value={link.cost} onChange={(e) => setLink({ ...link, cost: e.target.value })} inputMode="decimal" className={input} placeholder="0" />
                  </label>
                  <button disabled={!link.product_id} onClick={() => run(linkFn({ data: { supplier_id: current.id, product_id: link.product_id, edition_name: link.edition_name, cost_cents: Math.round((Number(link.cost) || 0) * 100) } }), "Linked").then((ok) => ok && setLink({ product_id: "", edition_name: "", cost: "" }))} className={btn}><Link2 className="h-3 w-3" /> Link</button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "inventory" && (
        <Card className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead><tr className="border-b border-white/[0.04] text-left text-[11px] uppercase tracking-wider text-[#52525B]"><th className="px-5 py-2.5">Product / variant</th><th>Suppliers</th><th>Live stock</th><th className="px-5">Last restocked</th></tr></thead>
            <tbody>
              {products.flatMap((p) => (p.editions.length ? p.editions.map((e) => ({ p, ed: e.name })) : [{ p, ed: "" }])).map(({ p, ed }) => {
                const sups = (data?.items ?? []).filter((i) => i.product_id === p.id && i.edition_name === ed).map((i) => sMap.get(i.supplier_id)?.name).filter(Boolean);
                const last = lastRestock.get(`${p.id}|${ed}`);
                const st = stockOf(p.id, ed);
                return (
                  <tr key={`${p.id}|${ed}`} className="border-b border-white/[0.04]">
                    <td className="px-5 py-2.5 text-white">{p.title}{ed && <span className="text-[#A1A1AA]"> — {ed}</span>}</td>
                    <td className="text-[#A1A1AA]">{sups.join(", ") || "—"}</td>
                    <td className={st === "Sold out" ? "text-[#f87171]" : "text-[#D4D4D8]"}>{st}</td>
                    <td className="px-5 text-[#A1A1AA]">{last ? when(last) : "Never"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "restocks" && (
        <Card className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead><tr className="border-b border-white/[0.04] text-left text-[11px] uppercase tracking-wider text-[#52525B]"><th className="px-5 py-2.5">When</th><th>Product / variant</th><th>Supplier</th><th>Qty</th><th>Cost</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              {(data?.restocks ?? []).length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-[#71717A]">No restocks logged yet.</td></tr>}
              {(data?.restocks ?? []).map((r) => (
                <tr key={r.id} className="border-b border-white/[0.04]">
                  <td className="px-5 py-2.5 text-[#A1A1AA]">{when(r.restocked_at)}</td>
                  <td className="text-white">{(r.product_id && pMap.get(r.product_id)?.title) || "Deleted product"}{r.edition_name && <span className="text-[#A1A1AA]"> — {r.edition_name}</span>}</td>
                  <td className="text-[#A1A1AA]">{(r.supplier_id && sMap.get(r.supplier_id)?.name) || "—"}</td>
                  <td className="text-[#4ade80]">+{r.quantity}</td>
                  <td className="text-[#D4D4D8]">{inr(r.cost_cents)}</td>
                  <td className="max-w-[220px] truncate text-[#71717A]">{r.notes}</td>
                  <td className="pr-3 text-right"><button onClick={() => { if (confirm("Delete this log entry? Stock won't change.")) run(delRestockFn({ data: { id: r.id } }), "Deleted"); }} className="grid h-7 w-7 place-items-center rounded-md text-[#71717A] hover:text-[#f87171]"><Trash2 className="h-3.5 w-3.5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {draft && (
        <Modal title={draft.id ? "Edit supplier" : "New supplier"} onClose={() => setDraft(null)}>
          {(["name", "contact_email", "contact_discord", "phone"] as const).map((k) => (
            <label key={k} className="mb-2 block text-[11px] capitalize text-[#71717A]">{k.replace("contact_", "").replace("_", " ")}
              <input value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} className={input} />
            </label>
          ))}
          <label className="mb-2 block text-[11px] text-[#71717A]">Notes
            <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={3} className={`${input} h-auto py-2`} />
          </label>
          <label className="mb-4 flex items-center gap-2 text-[12px] text-white"><input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="accent-[#2563EB]" /> Active</label>
          <button disabled={!draft.name.trim()} onClick={() => { const { id, ...values } = draft; run(saveFn({ data: { id, values } }), "Supplier saved").then((ok) => ok && setDraft(null)); }} className={btn}>Save</button>
        </Modal>
      )}

      {restock && (
        <Modal title="Log restock" onClose={() => setRestock(null)}>
          <label className="mb-2 block text-[11px] text-[#71717A]">Supplier
            <select value={restock.supplier_id} onChange={(e) => setRestock({ ...restock, supplier_id: e.target.value })} className={input}>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="mb-2 block text-[11px] text-[#71717A]">Product
            <select value={restock.product_id} onChange={(e) => setRestock({ ...restock, product_id: e.target.value, edition_name: "" })} className={input}>
              <option value="">Choose…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </label>
          <label className="mb-2 block text-[11px] text-[#71717A]">Variant
            <select value={restock.edition_name} onChange={(e) => setRestock({ ...restock, edition_name: e.target.value })} className={input}>
              <option value="">Whole product</option>
              {pMap.get(restock.product_id)?.editions.map((e) => <option key={e.name} value={e.name}>{e.name}</option>)}
            </select>
          </label>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <label className="text-[11px] text-[#71717A]">Quantity added<input value={restock.quantity} onChange={(e) => setRestock({ ...restock, quantity: e.target.value })} inputMode="numeric" className={input} /></label>
            <label className="text-[11px] text-[#71717A]">Total cost ₹<input value={restock.cost} onChange={(e) => setRestock({ ...restock, cost: e.target.value })} inputMode="decimal" className={input} /></label>
          </div>
          <label className="mb-2 block text-[11px] text-[#71717A]">Restocked on<input type="datetime-local" value={restock.date} onChange={(e) => setRestock({ ...restock, date: e.target.value })} className={input} /></label>
          <label className="mb-3 block text-[11px] text-[#71717A]">Notes<input value={restock.notes} onChange={(e) => setRestock({ ...restock, notes: e.target.value })} className={input} /></label>
          <p className="mb-3 text-[11px] text-[#71717A]">The quantity is added to the live stock shown on the product page.</p>
          <button
            disabled={!restock.product_id || !(Number(restock.quantity) > 0)}
            onClick={() => run(restockFn({ data: {
              supplier_id: restock.supplier_id || null, product_id: restock.product_id, edition_name: restock.edition_name,
              quantity: Math.floor(Number(restock.quantity)), cost_cents: Math.round((Number(restock.cost) || 0) * 100),
              notes: restock.notes, restocked_at: restock.date ? new Date(restock.date).toISOString() : undefined, update_stock: true,
            } }), "Restock logged — stock updated").then((ok) => ok && setRestock(null))}
            className={btn}
          >Save restock</button>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#111113] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-[#A1A1AA] hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
