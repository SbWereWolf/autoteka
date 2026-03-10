import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-USER-013", () => {
  it("неизвестный front route отвечает без 5xx", async () => {
    const response = await fetch(
      toUrl("/__user_unknown_route__?source=smoke"),
    );
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html).toContain('id="app"');
  });
});
