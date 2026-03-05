import { describe, expect, it } from "vitest";
import { MockApiClient } from "./MockApiClient";

describe("MockApiClient", () => {
  const client = new MockApiClient();

  it("UT-04: acceptable-contact-types фильтрует и группирует контакты", async () => {
    const response = await client.postAcceptableContactTypes(
      "barnaul-04",
      ["phone", "email"],
    );
    expect(Object.keys(response).sort()).toEqual(["phone"]);
    expect(response.phone.length).toBeGreaterThan(0);
  });

  it("UT-05: пагинация getCityShops возвращает корректный срез", async () => {
    const page1 = await client.getCityShops("barnaul", {
      page: 1,
      perPage: 10,
    });
    const page2 = await client.getCityShops("barnaul", {
      page: 2,
      perPage: 10,
    });

    expect(page1.items.length).toBe(10);
    expect(page2.items.length).toBe(7);
    expect(page1.total).toBe(17);
    expect(page2.total).toBe(17);
    expect(page2.page).toBe(2);
  });

  it("UT-06: поиск getCityShops работает как case-insensitive substring", async () => {
    const response = await client.getCityShops("barnaul", {
      q: "авто",
      page: 1,
      perPage: 100,
    });
    expect(response.items.length).toBeGreaterThan(0);
    expect(
      response.items.every((item) =>
        item.name.toLocaleLowerCase("ru").includes("авто"),
      ),
    ).toBe(true);
  });
});
