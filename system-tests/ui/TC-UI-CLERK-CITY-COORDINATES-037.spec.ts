import { afterAll, beforeAll, describe, expect, it } from "vitest";

const rawBaseUrl =
  process.env.TEST_BASE_URL ??
  process.env.BASE_URL ??
  "http://127.0.0.1:8081";
const baseUrl =
  rawBaseUrl === "/" ? "http://127.0.0.1:8081/" : rawBaseUrl;
const headed = process.env.TEST_UI_HEADED === "1";
const adminEmail =
  process.env.MOONSHINE_ADMIN_EMAIL ?? "admin@example.com";
const adminPassword =
  process.env.MOONSHINE_ADMIN_PASSWORD ?? "admin12345";

let browser: import("playwright").Browser | undefined;

const loginToAdmin = async (page: import("playwright").Page) => {
  await page.goto(new URL("/admin/login", baseUrl).toString(), {
    waitUntil: "domcontentloaded",
  });

  const username = page.locator('input[name="username"]');
  if ((await username.count()) === 0) {
    return;
  }

  await username.fill(adminEmail);
  await page.locator('input[name="password"]').fill(adminPassword);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(
    (url) => !url.pathname.endsWith("/admin/login"),
    { timeout: 10_000 },
  );
};

describe("TC-UI-CLERK-CITY-COORDINATES-037", () => {
  beforeAll(async () => {
    const { firefox } = await import("playwright");
    browser = await firefox.launch({ headless: !headed });
  });

  afterAll(async () => {
    await browser?.close();
  });

  it("редактирует координаты города и читает сохранённые значения из формы", async () => {
    const context = await browser!.newContext();
    const page = await context.newPage();
    let editUrl: string | null = null;
    let originalLatitude = "";
    let originalLongitude = "";
    let coordinatesMayHaveChanged = false;

    try {
      await loginToAdmin(page);

      await page.goto(
        new URL(
          "/admin/resource/city-resource/index-page",
          baseUrl,
        ).toString(),
        { waitUntil: "domcontentloaded" },
      );

      const indexHtml = await page.content();
      expect(indexHtml).not.toContain("Широта");
      expect(indexHtml).not.toContain("Долгота");

      const editUrls = await page
        .locator(
          'a[href*="/admin/resource/city-resource/dictionary-form-page/"]',
        )
        .evaluateAll((links) =>
          links
            .map((link) => link.getAttribute("href"))
            .filter((href): href is string => href !== null),
        );
      if (editUrls.length === 0) {
        throw new Error(
          "В списке городов не найдена ссылка на редактирование.",
        );
      }

      for (const candidateUrl of editUrls) {
        await page.goto(candidateUrl, {
          waitUntil: "domcontentloaded",
        });
        const candidateLatitude = await page
          .locator('input[name="latitude"]')
          .inputValue();
        const candidateLongitude = await page
          .locator('input[name="longitude"]')
          .inputValue();

        if (candidateLatitude !== "" && candidateLongitude !== "") {
          editUrl = candidateUrl;
          originalLatitude = candidateLatitude;
          originalLongitude = candidateLongitude;
          break;
        }
      }

      if (editUrl === null) {
        throw new Error(
          "Для безопасного UI-теста нужен город с исходными координатами, которые можно восстановить.",
        );
      }

      const latitude = page.locator('input[name="latitude"]');
      const longitude = page.locator('input[name="longitude"]');

      expect(await latitude.getAttribute("type")).toBe("number");
      expect(await latitude.getAttribute("min")).toBe("-90");
      expect(await latitude.getAttribute("max")).toBe("90");
      expect(await latitude.getAttribute("step")).toBe("0.001");
      expect(await latitude.getAttribute("required")).not.toBeNull();
      expect(await longitude.getAttribute("type")).toBe("number");
      expect(await longitude.getAttribute("min")).toBe("-180");
      expect(await longitude.getAttribute("max")).toBe("180");
      expect(await longitude.getAttribute("step")).toBe("0.001");
      expect(await longitude.getAttribute("required")).not.toBeNull();

      const currentLatitude = Number.parseFloat(originalLatitude);
      const pair =
        Math.abs(currentLatitude - 53.347) < 0.000001
          ? { latitude: "56.327", longitude: "44.006" }
          : { latitude: "53.347", longitude: "83.778" };

      await latitude.fill(pair.latitude);
      await longitude.fill(pair.longitude);

      const form = page.locator(
        'form[action*="/admin/resource/city-resource/crud/"]',
      );
      coordinatesMayHaveChanged = true;
      await form.locator('button[type="submit"]').click();
      await page.waitForURL(
        /\/admin\/resource\/city-resource(?:\/.*)?$/,
        { timeout: 10_000 },
      );

      await page.goto(editUrl, { waitUntil: "domcontentloaded" });

      expect(
        Number.parseFloat(
          await page.locator('input[name="latitude"]').inputValue(),
        ),
      ).toBeCloseTo(Number.parseFloat(pair.latitude), 6);
      expect(
        Number.parseFloat(
          await page.locator('input[name="longitude"]').inputValue(),
        ),
      ).toBeCloseTo(Number.parseFloat(pair.longitude), 6);
    } finally {
      try {
        if (
          coordinatesMayHaveChanged &&
          editUrl !== null &&
          originalLatitude !== "" &&
          originalLongitude !== ""
        ) {
          await page.goto(editUrl, { waitUntil: "domcontentloaded" });
          await page
            .locator('input[name="latitude"]')
            .fill(originalLatitude);
          await page
            .locator('input[name="longitude"]')
            .fill(originalLongitude);
          await page
            .locator(
              'form[action*="/admin/resource/city-resource/crud/"] button[type="submit"]',
            )
            .click();
          await page.waitForURL(
            /\/admin\/resource\/city-resource(?:\/.*)?$/,
            { timeout: 10_000 },
          );
          await page.goto(editUrl, { waitUntil: "domcontentloaded" });
          expect(
            Number.parseFloat(
              await page.locator('input[name="latitude"]').inputValue(),
            ),
          ).toBeCloseTo(Number.parseFloat(originalLatitude), 6);
          expect(
            Number.parseFloat(
              await page
                .locator('input[name="longitude"]')
                .inputValue(),
            ),
          ).toBeCloseTo(Number.parseFloat(originalLongitude), 6);
        }
      } finally {
        await context.close();
      }
    }
  });
});
