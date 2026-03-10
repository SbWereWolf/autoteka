import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-CLERC-DATA-034", () => {
  it("clerc category route с hash не приводит к 5xx", async () => {
    const response = await fetch(
      toUrl("/admin/resource/category-resource#filters"),
    );
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html.trim().length).toBeGreaterThan(0);
  });
});

