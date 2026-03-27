import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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
const repoRoot = path.resolve(process.cwd(), "..");
const sourceGalleryDir = path.join(
  repoRoot,
  "backend",
  "storage",
  "app",
  "public",
  "shops",
  "gallery",
);

type BrowserLike = {
  newContext: () => Promise<BrowserContextLike>;
  close: () => Promise<void>;
};

type BrowserContextLike = {
  newPage: () => Promise<PageLike>;
  close: () => Promise<void>;
};

type PageLike = {
  goto: (
    url: string,
    opts?: { waitUntil?: "domcontentloaded" },
  ) => Promise<unknown>;
  locator: (selector: string) => {
    click: () => Promise<void>;
    count: () => Promise<number>;
    evaluate?: <T>(
      pageFunction: (element: Element) => T,
    ) => Promise<T>;
    fill: (value: string) => Promise<void>;
    nth?: (index: number) => {
      setInputFiles?: (files: string | string[]) => Promise<void>;
    };
    setInputFiles?: (files: string | string[]) => Promise<void>;
  };
  waitForURL: (
    url: RegExp,
    opts?: { timeout?: number },
  ) => Promise<void>;
  content: () => Promise<string>;
  reload: (opts?: { waitUntil?: "domcontentloaded" }) => Promise<unknown>;
  url: () => string;
};

type PromotionDraft = {
  editUrl: string;
  code: string;
};

type ScenarioConfig = {
  addImages: boolean;
  prefix: string;
};

type PromotionUpdate = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  published: boolean;
  galleryFiles: string[];
};

let browser: BrowserLike | undefined;
const createdFiles = new Set<string>();

const closeWithTimeout = async (
  close: () => Promise<void>,
  ms: number,
) => {
  await Promise.race([
    close(),
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    }),
  ]);
};

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const dateOffset = (days: number): string => {
  const value = new Date();
  value.setDate(value.getDate() + days);

  return value.toISOString().slice(0, 10);
};

const ensureCopiedImage = (prefix: string, index: number): string => {
  const source = fs
    .readdirSync(sourceGalleryDir)
    .filter((name) => name.startsWith("gen-3x2-x"))
    .sort()[index];

  if (!source) {
    throw new Error("Не найден исходный файл gen-3x2-x* для e2e.");
  }

  const extension = path.extname(source);
  const targetName = `${prefix}-${Date.now()}-${index}${extension}`;
  const sourcePath = path.join(sourceGalleryDir, source);
  const targetPath = path.join(os.tmpdir(), targetName);

  fs.copyFileSync(sourcePath, targetPath);
  createdFiles.add(targetPath);

  return targetPath;
};

const waitForHtmlIncludes = async (
  page: Pick<PageLike, "content">,
  expected: string[],
  timeoutMs = 15000,
): Promise<string> => {
  const deadline = Date.now() + timeoutMs;
  let html = "";

  while (Date.now() < deadline) {
    html = await page.content();

    if (expected.every((value) => html.includes(value))) {
      return html;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });
  }

  return html;
};

const extractPromotionCode = (
  html: string,
  titleSlug: string,
): string => {
  const regex = new RegExp(
    `([a-z0-9-]+-${escapeRegex(titleSlug)}(?:-\\d+)?)`,
  );
  const match = html.match(regex);

  if (!match) {
    throw new Error(`Не удалось извлечь code для slug ${titleSlug}.`);
  }

  return match[1];
};

const deriveShopCode = (
  promotionCode: string,
  titleSlug: string,
): string => {
  const suffix = `-${titleSlug}`;

  if (!promotionCode.endsWith(suffix)) {
    throw new Error(
      `Не удалось вывести shop.code из promotion code ${promotionCode}.`,
    );
  }

  return promotionCode.slice(0, -suffix.length);
};

const loginToAdmin = async (page: PageLike) => {
  await page.goto(new URL("/admin/login", baseUrl).toString(), {
    waitUntil: "domcontentloaded",
  });

  const usernameSelector =
    (await page.locator('input[name="username"]').count()) > 0
      ? 'input[name="username"]'
      : (await page.locator('input[name="email"]').count()) > 0
        ? 'input[name="email"]'
        : null;
  const hasLoginForm =
    usernameSelector !== null &&
    (await page.locator('input[name="password"]').count()) > 0 &&
    (await page.locator('button[type="submit"]').count()) > 0;

  if (!hasLoginForm) {
    return;
  }

  await page.locator(usernameSelector!).fill(adminEmail);
  await page.locator('input[name="password"]').fill(adminPassword);
  await page.locator('button[type="submit"]').click();

  try {
    await page.waitForURL(/\/admin(\/.*)?$/, { timeout: 5000 });
  } catch {
    // dev-стенд может отвечать медленно; продолжим прямой навигацией
  }

  if (page.url().includes("/admin/login")) {
    throw new Error("Логин в MoonShine не выполнен: страница login осталась открытой.");
  }
};

const createDraftFromShopPage = async (
  page: PageLike,
  shopDetailUrl: string,
): Promise<string> => {
  await page.goto(shopDetailUrl, { waitUntil: "domcontentloaded" });
  const html = await page.content();

  expect(html).toContain("Создание рекламной акции");
  expect(html).toContain("Добавить рекламную акцию");

  await page
    .locator('form[action*="/promotions/create-draft"] button[type="submit"]')
    .click();
  await page.waitForURL(/\/admin\/resource\/promotion-resource\/crud\/\d+\/edit$/, {
    timeout: 10000,
  });

  return page.url();
};

const savePromotionThroughUi = async (
  page: PageLike,
  editUrl: string,
  payload: PromotionUpdate,
): Promise<PromotionDraft> => {
  await page.goto(editUrl, { waitUntil: "domcontentloaded" });

  await page.locator('input[name="title"]').fill(payload.title);
  await page
    .locator('textarea[name="description"]')
    .fill(payload.description);
  await page
    .locator('input[name="start_date"]')
    .fill(payload.startDate);
  await page
    .locator('input[name="end_date"]')
    .fill(payload.endDate);

  if (payload.published) {
    await page
      .locator(
        'div[data-field-selector="is_published"] label.form-switcher',
      )
      .click();

    const publishToggle = page.locator(
      'input[type="checkbox"][name="is_published"]',
    );

    const checkedInputs = await publishToggle.count();
    if (checkedInputs < 1) {
      throw new Error("Не найден checkbox публикации после клика по switcher.");
    }
  }

  for (const [index, file] of payload.galleryFiles.entries()) {
    await page
      .locator(
        'div[data-show-when-field^="gallery_entries"] a.btn.w-full',
      )
      .click();

    const fileInput = page.locator(
      'input[type="file"][name^="gallery_entries["][name$="[file_path]"]',
    );
    const indexedInput = fileInput.nth ? fileInput.nth(index) : fileInput;

    if (!indexedInput.setInputFiles) {
      throw new Error("Текущий PageLike не поддерживает setInputFiles.");
    }

    await indexedInput.setInputFiles(file);
    await new Promise((resolve) => {
      setTimeout(resolve, 800);
    });
  }

  const promotionForm = page.locator(
    'form[action*="/admin/resource/promotion-resource/crud/"]',
  );

  if (!promotionForm.evaluate) {
    throw new Error("Текущий PageLike не поддерживает evaluate для submit.");
  }

  await promotionForm.evaluate((element) => {
    (element as HTMLFormElement).submit();
  });
  await page.waitForURL(
    /\/admin\/resource\/promotion-resource\/(?:crud\/\d+|detail-page\/\d+)$/,
    {
      timeout: 10000,
    },
  );

  const updatedHtml = await page.content();
  const titleSlug = slugify(payload.title);
  const code = extractPromotionCode(updatedHtml, titleSlug);

  return {
    editUrl: page.url(),
    code,
  };
};

const runScenario = async (
  page: PageLike,
  config: ScenarioConfig,
) => {
  const scenarioId = `${config.prefix}-${Date.now()}`;
  const shopDetailUrl = new URL(
    "/admin/resource/shop-resource/crud/1",
    baseUrl,
  ).toString();

  const activeOneTitle = `${scenarioId}-active-one`;
  const activeTwoTitle = `${scenarioId}-active-two`;
  const futureTitle = `${scenarioId}-future`;
  const hiddenTitle = `${scenarioId}-hidden`;
  const expiredTitle = `${scenarioId}-expired`;

  const firstEditUrl = await createDraftFromShopPage(page, shopDetailUrl);
  const firstGallery = config.addImages
    ? [ensureCopiedImage(`${scenarioId}-first`, 0)]
    : [];
  const firstPromotion = await savePromotionThroughUi(page, firstEditUrl, {
    title: activeOneTitle,
    description: `${activeOneTitle} description`,
    startDate: dateOffset(0),
    endDate: dateOffset(0),
    published: true,
    galleryFiles: firstGallery,
  });
  const shopCode = deriveShopCode(
    firstPromotion.code,
    slugify(activeOneTitle),
  );

  const secondEditUrl = await createDraftFromShopPage(page, shopDetailUrl);
  const secondGallery = config.addImages
    ? [
        ensureCopiedImage(`${scenarioId}-second`, 0),
        ensureCopiedImage(`${scenarioId}-second`, 1),
      ]
    : [];
  await savePromotionThroughUi(page, secondEditUrl, {
    title: activeTwoTitle,
    description: `${activeTwoTitle} description`,
    startDate: dateOffset(0),
    endDate: dateOffset(0),
    published: true,
    galleryFiles: secondGallery,
  });

  const futureEditUrl = await createDraftFromShopPage(page, shopDetailUrl);
  await savePromotionThroughUi(page, futureEditUrl, {
    title: futureTitle,
    description: `${futureTitle} description`,
    startDate: dateOffset(7),
    endDate: dateOffset(7),
    published: true,
    galleryFiles: [],
  });

  const hiddenEditUrl = await createDraftFromShopPage(page, shopDetailUrl);
  await savePromotionThroughUi(page, hiddenEditUrl, {
    title: hiddenTitle,
    description: `${hiddenTitle} description`,
    startDate: dateOffset(0),
    endDate: dateOffset(0),
    published: false,
    galleryFiles: [],
  });

  const expiredEditUrl = await createDraftFromShopPage(page, shopDetailUrl);
  await savePromotionThroughUi(page, expiredEditUrl, {
    title: expiredTitle,
    description: `${expiredTitle} description`,
    startDate: dateOffset(-3),
    endDate: dateOffset(-1),
    published: true,
    galleryFiles: [],
  });

  await page.goto(new URL(`/shop/${shopCode}`, baseUrl).toString(), {
    waitUntil: "domcontentloaded",
  });

  const publicHtml = await waitForHtmlIncludes(page, [
    activeOneTitle,
    activeTwoTitle,
  ]);
  expect(publicHtml).toContain(activeOneTitle);
  expect(publicHtml).toContain(activeTwoTitle);
  expect(publicHtml).not.toContain(futureTitle);
  expect(publicHtml).not.toContain(hiddenTitle);
  expect(publicHtml).not.toContain(expiredTitle);

  if (config.addImages) {
    expect(
      await page.locator(`img[alt="${activeOneTitle}"]`).count(),
    ).toBe(1);
    expect(
      await page.locator(`img[alt="${activeTwoTitle}"]`).count(),
    ).toBe(2);
  } else {
    expect(
      await page.locator(`img[alt="${activeOneTitle}"]`).count(),
    ).toBe(0);
    expect(
      await page.locator(`img[alt="${activeTwoTitle}"]`).count(),
    ).toBe(0);
  }
};

describe("TC-UI-CLERK-PROMOTION-021", () => {
  beforeAll(async () => {
    const { firefox } = await import("playwright");
    browser = await firefox.launch({ headless: !headed });
  });

  afterAll(async () => {
    for (const file of createdFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }

    if (!browser) return;
    await closeWithTimeout(() => browser!.close(), 5000);
  });

  it("admin immediate-create promotion flow works with images", async () => {
    const context = await browser!.newContext();

    try {
      const page = await context.newPage();
      await loginToAdmin(page);
      await runScenario(page, {
        addImages: true,
        prefix: "with-images",
      });
    } finally {
      await closeWithTimeout(() => context.close(), 5000);
    }
  });

  it("admin immediate-create promotion flow works without images", async () => {
    const context = await browser!.newContext();

    try {
      const page = await context.newPage();
      await loginToAdmin(page);
      await runScenario(page, {
        addImages: false,
        prefix: "without-images",
      });
    } finally {
      await closeWithTimeout(() => context.close(), 5000);
    }
  });
});
