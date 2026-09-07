export type Platform = "pc" | "ps" | "xbox";

export interface Edition {
  name: string;
  priceCents: number;
}

/** Optional per-product choice selector (Shopify-style variant options). */
export interface OptionGroup {
  name: string;
  values: string[];
}



export interface Product {
  id: string;                  // Supabase product UUID
  shopifyHandle: string;       // alias of slug (kept for back-compat with UI)
  variantId: string;           // alias of id (kept for back-compat with cart)
  slug: string;
  title: string;
  description: string;
  genre: string;
  developer: string;
  publisher: string;
  releaseDate: string;
  languages: string;
  platforms: Platform[];
  coverImage: string;
  screenshots: string[];
  priceCents: number;
  oldPriceCents: number;
  stock: number;
  active: boolean;
  featured: boolean;
  badge: "" | "hot" | "disc" | "new";
  editions: Edition[];
  optionGroups: OptionGroup[];

  rating: number;
  votes: string;
  createdAt: number;
  updatedAt: number;
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  pc: "PC (Steam)",
  ps: "PlayStation 5",
  xbox: "Xbox Series X",
};

export const ACTIVATION: Record<Platform, string> = {
  pc: "Steam / GOG",
  ps: "PlayStation Store",
  xbox: "Microsoft Store",
};

export function formatPrice(cents: number): string {
  return "₹" + (cents / 100).toFixed(2);
}
