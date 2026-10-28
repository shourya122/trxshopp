import { describe, expect, it } from "vitest";
import { ADMIN_PRODUCT_COLUMNS } from "./admin-product-columns";

describe("admin product editor columns", () => {
  it("loads the saved Buy or Enquire setting", () => {
    expect(ADMIN_PRODUCT_COLUMNS.split(", ")).toContain("purchase_mode");
  });
});