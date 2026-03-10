import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-ADMIN-USERS-003", () => {
  it("users create route отвечает без 5xx", async () => {
    const response = await fetch(
      toUrl("/admin/resource/moonshine-user-resource/create"),
    );
    const html = await response.text();

    expect(response.status).toBeLessThan(500);
    expect(html.trim().length).toBeGreaterThan(0);
  });
});

