import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-ADMIN-USERS-004", () => {
  it("roles list/create routes устойчивы", async () => {
    const urls = [
      "/admin/resource/role-resource",
      "/admin/resource/role-resource/create",
    ];

    for (const url of urls) {
      const response = await fetch(toUrl(url));
      const html = await response.text();
      expect(response.status).toBeLessThan(500);
      expect(html.trim().length).toBeGreaterThan(0);
    }
  });
});

