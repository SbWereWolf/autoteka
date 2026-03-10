import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-ADMIN-USERS-005", () => {
  it("permissions list/create routes устойчивы", async () => {
    const urls = [
      "/admin/resource/permission-resource",
      "/admin/resource/permission-resource/create",
    ];

    for (const url of urls) {
      const response = await fetch(toUrl(url));
      const html = await response.text();
      expect(response.status).toBeLessThan(500);
      expect(html.trim().length).toBeGreaterThan(0);
    }
  });
});
