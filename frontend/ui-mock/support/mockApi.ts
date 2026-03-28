import type { Page, Route } from "@playwright/test";

const TRANSPARENT_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

type RawCity = {
  code: string;
  title: string;
  sort: number;
};

type RawCategory = {
  id: string;
  title: string;
  sort: number;
};

type RawFeature = {
  id: string;
  title: string;
  sort: number;
};

type RawCityCatalogItem = {
  code: string;
  cityId: string;
  title: string;
  thumbUrl?: string;
  categoryIds: string[];
  featureIds: string[];
};

type RawShop = RawCityCatalogItem & {
  slogan: string;
  description: string;
  scheduleNote: string;
  siteUrl: string;
  latitude: string | null;
  longitude: string | null;
  galleryImages: string[];
  galleryItems: Array<
    | {
        id: string;
        type: "image";
        src: string;
        sort: number;
      }
    | {
        id: string;
        type: "video";
        src: string;
        poster: string;
        mime: string;
        sort: number;
      }
  >;
};

type RawPromotionImage = {
  filePath: string;
  sort: number;
  isPublished: boolean;
};

type RawPromotion = {
  id: string;
  code: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  galleryImages: RawPromotionImage[];
  galleryItems: Array<
    | {
        id: string;
        type: "image";
        src: string;
        sort: number;
      }
    | {
        id: string;
        type: "video";
        src: string;
        poster: string;
        mime: string;
        sort: number;
      }
  >;
};

const cities: RawCity[] = [
  { code: "barnaul", title: "Барнаул", sort: 1 },
  { code: "nizhny", title: "Нижний Новгород", sort: 2 },
];

const categories: RawCategory[] = [
  { id: "domestic", title: "Отечественные запчасти", sort: 1 },
  { id: "korean", title: "Корейские запчасти", sort: 2 },
  { id: "japanese", title: "Японские запчасти", sort: 3 },
  { id: "european", title: "Европейские запчасти", sort: 4 },
];

const features: RawFeature[] = [
  { id: "promo", title: "Акции", sort: 1 },
  { id: "pickup", title: "Самовывоз", sort: 2 },
];

const shopsByCity: Record<string, RawCityCatalogItem[]> = {
  barnaul: [
    {
      code: "barnaul-01",
      cityId: "barnaul",
      title: "CarsHelps",
      thumbUrl: "/generated/gen-1x1-x1_0-v1-512x512.png",
      categoryIds: ["domestic", "korean"],
      featureIds: ["promo"],
    },
    {
      code: "barnaul-02",
      cityId: "barnaul",
      title: "Orange Parts",
      categoryIds: ["japanese"],
      featureIds: ["pickup"],
    },
  ],
  nizhny: [
    {
      code: "nizhny-01",
      cityId: "nizhny",
      title: "Dark Green Motors",
      thumbUrl: "/generated/gen-1x1-x1_25-v1-640x640.png",
      categoryIds: ["european"],
      featureIds: ["promo"],
    },
  ],
};

const shops: Record<string, RawShop> = Object.fromEntries(
  Object.values(shopsByCity)
    .flat()
    .map((item, index) => [
      item.code,
      {
        ...item,
        slogan:
          index === 0
            ? "Запчасти рядом, когда они нужны"
            : "Детали без лишних поисков",
        description:
          index === 0
            ? "27 лет помогаем автовладельцам находить нужные запчасти."
            : `Описание магазина ${item.title} по новому макету.`,
        scheduleNote:
          index === 0 ? "Время работы\n09:00 - 20:00" : "",
        siteUrl:
          index === 0 ? "carshelps.ru" : "https://orange.example",
        latitude: "53.3474",
        longitude: "83.7784",
        galleryImages: [
          item.thumbUrl ?? "",
          "/generated/gen-1x1-x1_25-v2-640x640.png",
        ].filter(Boolean),
        galleryItems: [
          {
            id: `${item.code}-image-1`,
            type: "image",
            src: item.thumbUrl ?? "/generated/gen-1x1-x1_0-v1-512x512.png",
            sort: 10,
          },
          {
            id: `${item.code}-video-1`,
            type: "video",
            src: "/generated/shop-gallery-video.mp4",
            poster: "/generated/shop-gallery-video-poster.webp",
            mime: "video/mp4",
            sort: 20,
          },
        ],
      },
    ]),
);

const contactsByShop: Record<string, Record<string, string[]>> = {
  "barnaul-01": {
    phone: ["+7 (3852) 000-001", "+7 (3852) 000-002"],
    address: ["Барнаул, Павловский тракт, 41"],
    whatsapp: ["https://wa.me/73852000001"],
  },
  "barnaul-02": {
    phone: ["+7 (3852) 100-200"],
    address: ["Барнаул, ул. Попова, 70"],
  },
  "nizhny-01": {
    phone: ["+7 (831) 000-001"],
    address: ["Нижний Новгород, Московское шоссе, 12"],
  },
};

const promotionsByShop: Record<string, RawPromotion[]> = {
  "barnaul-01": [
    {
      id: "promo-1",
      code: "barnaul-01-summer-sale",
      title: "Летняя распродажа",
      description: "Скидки на расходники и аккумуляторы до конца месяца.",
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      galleryImages: [
        {
          filePath: "/generated/promo-summer-1.webp",
          sort: 1,
          isPublished: true,
        },
        {
          filePath: "/generated/promo-summer-2.webp",
          sort: 2,
          isPublished: true,
        },
      ],
      galleryItems: [
        {
          id: "promo-1-image-1",
          type: "image",
          src: "/generated/promo-summer-1.webp",
          sort: 1,
        },
        {
          id: "promo-1-video-1",
          type: "video",
          src: "/generated/promo-summer-clip.mp4",
          poster: "/generated/promo-summer-clip-poster.webp",
          mime: "video/mp4",
          sort: 2,
        },
      ],
    },
    {
      id: "promo-2",
      code: "barnaul-01-text-only",
      title: "Текстовая акция",
      description: "Диагностика бесплатно при заказе ремонта.",
      startDate: "2026-03-05",
      endDate: "2026-03-28",
      galleryImages: [],
      galleryItems: [],
    },
  ],
  "nizhny-01": [],
};

function json(route: Route, payload: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(payload),
  });
}

function notFound(route: Route, message: string) {
  return json(route, { message }, 404);
}

type ErrorScenario = {
  cityCatalogByCode?: Record<string, 404 | 422 | 500>;
  shopByCode?: Record<string, 404 | 422 | 500>;
  promotionsByCode?: Record<string, 404 | 422 | 500>;
  contactsByCode?: Record<string, 404 | 422 | 500>;
  delaysMs?: {
    promotionByCode?: Record<string, number>;
    shopByCode?: Record<string, number>;
  };
};

function errorPayload(status: number, message: string) {
  if (status === 422) {
    return {
      message,
      errors: {
        code: [message],
      },
    };
  }

  return { message };
}

function byStatus(
  route: Route,
  status: 404 | 422 | 500,
  message: string,
) {
  return json(route, errorPayload(status, message), status);
}

export async function installApiMocks(
  page: Page,
  scenario: ErrorScenario = {},
) {
  await page.route("**/generated/**", async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname.toLowerCase();

    if (pathname.endsWith(".mp4")) {
      return route.fulfill({
        status: 204,
        contentType: "video/mp4",
        body: "",
      });
    }

    return route.fulfill({
      status: 200,
      contentType: "image/png",
      body: Buffer.from(TRANSPARENT_PNG_BASE64, "base64"),
    });
  });

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method().toUpperCase();

    if (method === "GET" && path.endsWith("/api/v1/city-list")) {
      return json(route, cities);
    }

    if (method === "GET" && path.endsWith("/api/v1/category-list")) {
      return json(route, categories);
    }

    if (method === "GET" && path.endsWith("/api/v1/feature-list")) {
      return json(route, features);
    }

    const cityMatch = path.match(/\/api\/v1\/city\/([^/]+)$/);
    if (method === "GET" && cityMatch) {
      const cityCode = decodeURIComponent(cityMatch[1]);
      const forcedStatus = scenario.cityCatalogByCode?.[cityCode];
      if (forcedStatus) {
        return byStatus(
          route,
          forcedStatus,
          forcedStatus === 500
            ? "Temporary backend failure"
            : "City Not Found",
        );
      }

      const city = cities.find((item) => item.code === cityCode);
      if (!city) {
        return notFound(route, "City Not Found");
      }

      return json(route, {
        city,
        items: shopsByCity[cityCode] ?? [],
      });
    }

    const shopMatch = path.match(/\/api\/v1\/shop\/([^/]+)$/);
    if (method === "GET" && shopMatch) {
      const shopCode = decodeURIComponent(shopMatch[1]);
      const forcedStatus = scenario.shopByCode?.[shopCode];
      if (forcedStatus) {
        return byStatus(
          route,
          forcedStatus,
          forcedStatus === 500
            ? "Temporary backend failure"
            : "Shop Not Found",
        );
      }

      const shop = shops[shopCode];
      if (!shop) {
        return notFound(route, "Shop Not Found");
      }

      const delayMs = scenario.delaysMs?.shopByCode?.[shopCode];
      if (typeof delayMs === "number" && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      return json(route, shop);
    }

    const promotionMatch = path.match(
      /\/api\/v1\/shop\/([^/]+)\/promotion$/,
    );
    if (method === "GET" && promotionMatch) {
      const shopCode = decodeURIComponent(promotionMatch[1]);
      const forcedStatus = scenario.promotionsByCode?.[shopCode];
      if (forcedStatus) {
        return byStatus(
          route,
          forcedStatus,
          forcedStatus === 500
            ? "Temporary backend failure"
            : "Shop Not Found",
        );
      }

      const shop = shops[shopCode];
      if (!shop) {
        return notFound(route, "Shop Not Found");
      }

      const delayMs = scenario.delaysMs?.promotionByCode?.[shopCode];
      if (typeof delayMs === "number" && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      return json(route, promotionsByShop[shopCode] ?? []);
    }

    const contactsMatch = path.match(
      /\/api\/v1\/shop\/([^/]+)\/acceptable-contact-types$/,
    );
    if (method === "POST" && contactsMatch) {
      const shopCode = decodeURIComponent(contactsMatch[1]);
      const forcedStatus = scenario.contactsByCode?.[shopCode];
      if (forcedStatus) {
        return byStatus(
          route,
          forcedStatus,
          forcedStatus === 500
            ? "Temporary backend failure"
            : "Shop Not Found",
        );
      }

      if (!shops[shopCode]) {
        return notFound(route, "Shop Not Found");
      }

      const requestedTypes =
        (request.postDataJSON() as string[]) ?? [];
      const available = contactsByShop[shopCode] ?? {};
      const response: Record<string, string[]> = {};

      for (const type of requestedTypes) {
        if (available[type]) {
          response[type] = available[type];
        }
      }

      return json(route, response);
    }

    return notFound(route, "Not Found");
  });
}
