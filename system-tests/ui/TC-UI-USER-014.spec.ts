import { describe, expect, it } from "vitest";
import { getFirstShopCode, toUrl } from "./uiUserHelpers";

describe("TC-UI-USER-014", () => {
  it("shop route с query/hash отвечает без 5xx", async () => {
    const shopCode = await getFirstShopCode();
    expect(shopCode).toBeTruthy();
    if (!shopCode) return;

    const response = await fetch(
      toUrl(`/shop/${shopCode}?from=catalog&utm=test#details`),
    );
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html).toContain('id="app"');
  });
});
