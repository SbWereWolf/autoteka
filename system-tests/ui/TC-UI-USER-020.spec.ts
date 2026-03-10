import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-USER-020", () => {
  it("unknown nested user route не приводит к 5xx", async () => {
    const response = await fetch(
      toUrl("/unknown/section/deep-link?source=e2e"),
    );
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html).toContain('id="app"');
  });
});

