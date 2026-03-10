import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-USER-004", () => {
  it("несуществующий магазин не приводит к 5xx", async () => {
    const response = await fetch(toUrl("/shop/__not_existing__"));
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html).toContain('id="app"');
    expect(html.trim().length).toBeGreaterThan(0);
  });
});
