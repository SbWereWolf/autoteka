import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-USER-011", () => {
  it("user route с hash отвечает без 5xx", async () => {
    const response = await fetch(toUrl("/#catalog"));
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html).toContain('id="app"');
  });
});
