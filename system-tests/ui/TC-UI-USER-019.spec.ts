import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-USER-019", () => {
  it("root route устойчив к cache-control заголовкам", async () => {
    const response = await fetch(toUrl("/"), {
      headers: {
        "cache-control": "no-cache",
        pragma: "no-cache",
      },
    });
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html.trim().length).toBeGreaterThan(0);
  });
});

