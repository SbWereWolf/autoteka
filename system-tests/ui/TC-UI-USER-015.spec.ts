import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-USER-015", () => {
  it("повторные запросы user route стабильны и без 5xx", async () => {
    const urls = ["/", "/?city=ekb", "/shop/test-shop"];

    for (const path of urls) {
      const response = await fetch(toUrl(path));
      const html = await response.text();
      expect(response.status).toBeLessThan(500);
      expect(html.trim().length).toBeGreaterThan(0);
    }
  });
});
