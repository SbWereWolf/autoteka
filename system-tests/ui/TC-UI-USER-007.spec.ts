import { describe, expect, it } from "vitest";
import { toUrl } from "./uiUserHelpers";

describe("TC-UI-USER-007", () => {
  it("user routes с query параметрами устойчивы", async () => {
    const urls = [
      "/?city=ekb&q=test",
      "/?city=%D0%B5%D0%BA%D0%B1&search=%25%5F",
      "/shop/__not_existing__?from=catalog&debug=1",
    ];

    for (const url of urls) {
      const response = await fetch(toUrl(url));
      const html = await response.text();
      expect(response.status).toBeLessThan(500);
      expect(html.trim().length).toBeGreaterThan(0);
    }
  });
});
