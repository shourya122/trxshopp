import { describe, expect, it } from "vitest";
import { isSelectionSoldOut, productInventory } from "./product-availability";

describe("edition inventory", () => {
  const muse = { stock: 0, editions: [
    { stock: 12, out_of_stock: false },
    { stock: 8, out_of_stock: false },
    { stock: 4, out_of_stock: false },
  ] };

  it("makes Muse's stocked editions buyable despite zero general stock", () => {
    expect(productInventory(muse)).toEqual({ stock: 24, soldOut: false });
    for (const edition of muse.editions) expect(isSelectionSoldOut(muse, edition)).toBe(false);
  });

  it("blocks a sold-out selected edition even if another edition is available", () => {
    const soldOut = { stock: 0 };
    expect(isSelectionSoldOut({ ...muse, editions: [soldOut, ...muse.editions] }, soldOut)).toBe(true);
  });

  it("reports sold out when every edition is unavailable", () => {
    expect(productInventory({ stock: 999, editions: [{ stock: 0 }, { stock: 8, outOfStock: true }] })).toEqual({ stock: 0, soldOut: true });
  });

  it("keeps untracked editions available without inventing inventory", () => {
    expect(productInventory({ stock: 0, editions: [{ stock: null }] })).toEqual({ stock: null, soldOut: false });
  });

  it("uses general stock for products without editions", () => {
    expect(isSelectionSoldOut({ stock: 0 })).toBe(true);
    expect(isSelectionSoldOut({ stock: 12 })).toBe(false);
  });
});