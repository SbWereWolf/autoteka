import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-USER-014", () => {
  it("shop route с query/hash отвечает без 5xx", async () => {
    const response = await fetch(
      toUrl("/shop/test-shop?from=catalog&utm=test#details"),
    );
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html).toContain('id="app"');
  });
});
