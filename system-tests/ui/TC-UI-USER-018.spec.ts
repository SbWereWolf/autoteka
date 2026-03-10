import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-USER-018", () => {
  it("shop route устойчив к encoded path", async () => {
    const response = await fetch(
      toUrl("/shop/test%2Fshop%3Fv%3D1"),
    );
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html).toContain('id="app"');
  });
});

