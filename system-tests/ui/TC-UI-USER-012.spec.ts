import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-USER-012", () => {
  it("user route с длинным query отвечает без 5xx", async () => {
    const longValue = "x".repeat(2048);
    const response = await fetch(toUrl(`/?q=${longValue}&city=ekb`));
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html.trim().length).toBeGreaterThan(0);
  });
});
