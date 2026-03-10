import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-USER-001", () => {
  it("GET / отвечает без 5xx и отдает SPA-контейнер", async () => {
    const response = await fetch(toUrl("/"));
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html).toContain('id="app"');
    expect(
      html.includes("/src/main.ts") ||
        /\/assets\/index-[^"' ]+\.js/.test(html),
    ).toBe(true);
  });
});
