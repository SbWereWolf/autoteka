import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-CLERC-DATA-033", () => {
  it("clerc create route устойчив к unicode query", async () => {
    const response = await fetch(
      toUrl(
        "/admin/resource/shop-resource/create?name=%D0%A2%D0%B5%D1%81%D1%82",
      ),
    );
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html.trim().length).toBeGreaterThan(0);
  });
});

