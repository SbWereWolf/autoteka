import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-CLERK-DATA-032", () => {
  it("clerc list route устойчив к repeated query", async () => {
    const response = await fetch(
      toUrl(
        "/admin/resource/shop-resource?page=1&page=2&search=abc&search=def",
      ),
    );
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html.trim().length).toBeGreaterThan(0);
  });
});

