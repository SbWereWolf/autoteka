import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-ADMIN-USERS-002", () => {
  it("users list route с query работает без 5xx", async () => {
    const response = await fetch(
      toUrl("/admin/resource/moonshine-user-resource?search=admin"),
    );
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html.trim().length).toBeGreaterThan(0);
  });
});

