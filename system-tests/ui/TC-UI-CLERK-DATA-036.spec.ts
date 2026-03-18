import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-CLERK-DATA-036", () => {
  it("clerc unknown resource route не приводит к 5xx", async () => {
    const response = await fetch(
      toUrl("/admin/resource/unknown-clerc-resource"),
    );
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html.trim().length).toBeGreaterThan(0);
  });
});

