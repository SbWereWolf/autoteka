import { describe, expect, it } from "vitest";
import { getFirstShopCode, toUrl } from "./uiUserHelpers";

describe("TC-UI-USER-015", () => {
  it("повторные запросы user route стабильны и без 5xx", async () => {
    const shopCode = await getFirstShopCode();
    expect(shopCode).toBeTruthy();
    if (!shopCode) return;

    const urls = ["/", "/?city=ekb", `/shop/${shopCode}`];

    for (const path of urls) {
      const response = await fetch(toUrl(path));
      const html = await response.text();
      expect(response.status).toBeLessThan(500);
      expect(html.trim().length).toBeGreaterThan(0);
    }
  });
});
