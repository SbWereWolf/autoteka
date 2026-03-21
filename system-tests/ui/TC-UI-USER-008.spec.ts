import { describe, expect, it } from "vitest";
import { getFirstShopCode, toUrl } from "./uiUserHelpers";

describe("TC-UI-USER-008", () => {
  it("страница магазина отдает валидный HTML без 5xx", async () => {
    const shopCode = await getFirstShopCode();
    expect(shopCode).toBeTruthy();
    if (!shopCode) return;

    const response = await fetch(toUrl(`/shop/${shopCode}`));
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html).toContain('id="app"');
    expect(html.trim().length).toBeGreaterThan(0);
  });
});
