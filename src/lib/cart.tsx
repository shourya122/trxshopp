// Local cart backed by localStorage. No Shopify dependency.
// Checkout navigates to /checkout.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Platform } from "./types";

const STORAGE_KEY = "trxshop_cart_v2";

export interface CartItem {
  id: number;
  variantId: string;     // Supabase product UUID
  lineId: string | null; // unused; kept for type compat
  productId?: string;
  name: string;
  platform: Platform;
  price: number;
  old?: number;
  steamId: number;
  image?: string;
  qty: number;
  edition?: { name: string; priceCents: number };
}

export interface AddCartInput {
  variantId: string;
  productId?: string;
  name: string;
  platform: Platform;
  price: number;
  old?: number;
  image?: string;
  steamId?: number;
  id?: number;
  edition?: { name: string; priceCents: number };
}


interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  hydrated: boolean;
  isLoading: boolean;
  checkoutUrl: string | null;
  add: (item: AddCartInput, qty?: number) => Promise<string | null>;
  remove: (id: number) => Promise<void>;
  setQty: (id: number, qty: number) => Promise<void>;
  clear: () => void;
  openCheckout: () => boolean;
  syncCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

function hashNumericId(variantId: string, editionName?: string): number {
  const key = editionName ? `${variantId}::${editionName}` : variantId;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function readStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStorage(items);
  }, [items, hydrated]);

  const clear = useCallback(() => setItems([]), []);

  const add = useCallback(
    async (input: AddCartInput, qty: number = 1): Promise<string | null> => {
      if (!input.variantId) return null;
      const editionName = input.edition?.name;
      // Line identity must always be edition-aware and derived from the full
      // variantId — never a caller-supplied id, which can collide across
      // products/editions and cause shared remove/qty mutations.
      const numericId = hashNumericId(input.variantId, editionName);
      const matches = (i: CartItem) =>
        i.variantId === input.variantId && (i.edition?.name ?? null) === (editionName ?? null);
      setItems((cur) => {
        const existing = cur.find(matches);
        if (existing) {
          return cur.map((i) => (matches(i) ? { ...i, qty: i.qty + qty } : i));
        }
        return [
          ...cur,
          {
            id: numericId,
            variantId: input.variantId,
            lineId: null,
            productId: input.productId,
            name: input.name,
            platform: input.platform,
            price: input.price,
            old: input.old,
            steamId: input.steamId ?? numericId,
            image: input.image,
            qty,
            edition: input.edition,
          },
        ];
      });
      return "/checkout";
    },
    [],
  );

  const setQty = useCallback(async (id: number, qty: number) => {
    setItems((cur) =>
      qty <= 0 ? cur.filter((i) => i.id !== id) : cur.map((i) => (i.id === id ? { ...i, qty } : i)),
    );
  }, []);

  const remove = useCallback(async (id: number) => setQty(id, 0), [setQty]);

  const openCheckout = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    window.location.assign("/checkout");
    return true;
  }, []);

  const syncCart = useCallback(async () => {
    /* no-op for local cart */
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((a, i) => a + i.qty, 0);
    const total = items.reduce((a, i) => a + i.qty * i.price, 0);
    return {
      items,
      count,
      total,
      hydrated,
      isLoading: false,
      checkoutUrl: items.length ? "/checkout" : null,
      add,
      remove,
      setQty,
      clear,
      openCheckout,
      syncCart,
    };
  }, [items, hydrated, add, remove, setQty, clear, openCheckout, syncCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
