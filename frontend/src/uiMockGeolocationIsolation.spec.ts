import type { Page } from "@playwright/test";
import { describe, expect, it, vi } from "vitest";
import { installApiMocks } from "../ui-mock/support/mockApi";

function createPageDouble() {
  const addInitScript = vi.fn(async () => undefined);
  const route = vi.fn(async () => undefined);

  return {
    addInitScript,
    page: {
      addInitScript,
      route,
    } as unknown as Page,
    route,
  };
}

describe("installApiMocks geolocation isolation", () => {
  it("устанавливает default geolocation для обычных UI-mock тестов", async () => {
    const { addInitScript, page } = createPageDouble();

    await installApiMocks(page);

    expect(addInitScript).toHaveBeenCalledTimes(1);
  });

  it("не устанавливает default geolocation для явного GPS-сценария", async () => {
    const { addInitScript, page, route } = createPageDouble();

    await installApiMocks(
      page,
      {},
      {
        installDefaultGeolocation: false,
      },
    );

    expect(addInitScript).not.toHaveBeenCalled();
    expect(route).toHaveBeenCalled();
  });
});
