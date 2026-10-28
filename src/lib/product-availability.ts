type StockEdition = {
  stock?: number | null;
  outOfStock?: boolean;
  out_of_stock?: boolean;
};

export function isEditionSoldOut(edition: StockEdition): boolean {
  return edition.outOfStock === true || edition.out_of_stock === true ||
    (typeof edition.stock === "number" && edition.stock <= 0);
}

/** Edition inventory replaces, rather than supplements, general product stock. */
export function productInventory(product: { stock?: number | null; editions?: StockEdition[] | null }) {
  const editions = product.editions ?? [];
  if (!editions.length) {
    const stock = product.stock ?? 0;
    return { stock, soldOut: stock <= 0 };
  }
  const available = editions.filter((edition) => !isEditionSoldOut(edition));
  const stock = available.some((edition) => edition.stock == null)
    ? null
    : available.reduce((sum, edition) => sum + (edition.stock ?? 0), 0);
  return { stock, soldOut: available.length === 0 };
}

export function isSelectionSoldOut(
  product: { stock?: number | null; editions?: StockEdition[] | null },
  edition?: StockEdition | null,
) {
  return product.editions?.length
    ? !edition || isEditionSoldOut(edition)
    : productInventory(product).soldOut;
}