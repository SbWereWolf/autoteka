import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-USER-017", () => {
  it("route каталога устойчив к unicode query", async () => {
    const response = await fetch(
      toUrl("/?city=%D0%95%D0%BA%D0%B1&search=%D0%BC%D0%B0%D0%B3%D0%B0%D0%B7%D0%B8%D0%BD"),
    );
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html.trim().length).toBeGreaterThan(0);
  });
});

