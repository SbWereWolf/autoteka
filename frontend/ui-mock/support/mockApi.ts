import type { Page, Route } from "@playwright/test";

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
  description: string;
  workHours: string;
  siteUrl: string;
  galleryImages: string[];
};

const cities: RawCity[] = [
  { code: "barnaul", title: "Барнаул", sort: 1 },
  { code: "nizhny", title: "Нижний Новгород", sort: 2 },
];

const categories: RawCategory[] = [
  { id: "sedan", title: "Седаны", sort: 1 },
  { id: "suv", title: "Кроссоверы", sort: 2 },
];

const features: RawFeature[] = [
  { id: "credit", title: "Кредит", sort: 1 },
  { id: "tradein", title: "Trade-in", sort: 2 },
];

const shopsByCity: Record<string, RawCityCatalogItem[]> = {
  barnaul: [
    {
      code: "barnaul-01",
      cityId: "barnaul",
      title: "Автосалон Барнаул 1",
      thumbUrl: "/generated/gen-1x1-x1_0-v1-512x512.png",
      categoryIds: ["sedan"],
      featureIds: ["credit"],
    },
    {
      code: "barnaul-02",
      cityId: "barnaul",
      title: "Автосалон Барнаул 2",
      thumbUrl: "/generated/gen-1x1-x1_0-v2-512x512.png",
      categoryIds: ["suv"],
      featureIds: ["tradein"],
    },
  ],
  nizhny: [
    {
      code: "nizhny-01",
      cityId: "nizhny",
      title: "Автосалон Нижний 1",
      thumbUrl: "/generated/gen-1x1-x1_0-v3-512x512.png",
      categoryIds: ["sedan"],
      featureIds: ["credit"],
    },
    {
      code: "nizhny-02",
      cityId: "nizhny",
      title: "Автосалон Нижний 2",
      thumbUrl: "/generated/gen-1x1-x1_25-v1-640x640.png",
      categoryIds: ["suv"],
      featureIds: ["tradein"],
    },
    {
      code: "nizhny-03",
      cityId: "nizhny",
      title: "Автосалон Нижний 3",
      thumbUrl: "/generated/gen-1x1-x1_25-v2-640x640.png",
      categoryIds: ["suv"],
      featureIds: ["credit"],
    },
  ],
};

const shops: Record<string, RawShop> = Object.fromEntries(
  Object.values(shopsByCity)
    .flat()
    .map((item) => [
      item.code,
      {
        ...item,
        description: `Описание для ${item.title}`,
        workHours: "Пн-Пт 09:00-19:00",
        siteUrl: "https://example.com",
        galleryImages: [item.thumbUrl ?? ""].filter(Boolean),
      },
    ]),
);

const contactsByShop: Record<string, Record<string, string[]>> = {
  "barnaul-01": {
    phone: ["+7 (3852) 000-001"],
    email: ["barnaul-01@example.com"],
  },
  "barnaul-02": {
    phone: ["+7 (3852) 000-002"],
  },
  "nizhny-01": {
    phone: ["+7 (831) 000-001"],
    email: ["nizhny-01@example.com"],
  },
  "nizhny-02": {
    phone: ["+7 (831) 000-002"],
  },
  "nizhny-03": {
    phone: ["+7 (831) 000-003"],
  },
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

export async function installApiMocks(page: Page) {
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
      const shop = shops[shopCode];
      if (!shop) {
        return notFound(route, "Shop Not Found");
      }
      return json(route, shop);
    }

    const contactsMatch = path.match(
      /\/api\/v1\/shop\/([^/]+)\/acceptable-contact-types$/,
    );
    if (method === "POST" && contactsMatch) {
      const shopCode = decodeURIComponent(contactsMatch[1]);
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
