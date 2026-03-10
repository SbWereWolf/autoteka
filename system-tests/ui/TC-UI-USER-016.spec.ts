import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-USER-016", () => {
  it("route каталога устойчив к repeated query params", async () => {
    const response = await fetch(
      toUrl("/?city=ekb&city=msk&search=test&search=shop"),
    );
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html).toContain('id="app"');
  });
});

