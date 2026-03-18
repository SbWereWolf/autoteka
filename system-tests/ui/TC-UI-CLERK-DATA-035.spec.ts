import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-CLERK-DATA-035", () => {
  it("clerc feature create route с длинным query не падает", async () => {
    const longValue = "x".repeat(1024);
    const response = await fetch(
      toUrl(`/admin/resource/feature-resource/create?seed=${longValue}`),
    );
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html.trim().length).toBeGreaterThan(0);
  });
});

