import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-USER-009", () => {
  it("страница магазина содержит SPA-контейнер и не падает", async () => {
    const response = await fetch(toUrl("/shop/test-shop"));
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html).toContain('id="app"');
    expect(html.trim().length).toBeGreaterThan(0);
  });
});
