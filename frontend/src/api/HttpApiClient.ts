import type {
  Category,
  City,
  CityShopsResponse,
  ContactsResponse,
  Feature,
  PromotionPublic,
  ShopPublic,
} from "../types";
import type { ApiClient, CityShopsQuery } from "./ApiClient";
import { ApiError } from "./ApiClient";

type RawCity = {
  code: string;
  title: string;
  sort: number;
};

type RawCategory = {
  id: number | string;
  title: string;
  sort: number;
};

type RawFeature = {
  id: number | string;
  title: string;
  sort: number;
};

type RawShop = {
  code: string;
  cityId: number | string;
  title: string;
  slogan?: string | null;
  description: string;
  scheduleNote?: string | null;
  schedule_note?: string | null;
  siteUrl: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  thumbUrl?: string | null;
  galleryImages?: string[];
  categoryIds: Array<number | string>;
  featureIds: Array<number | string>;
};

type RawPromotionImage =
  | string
  | {
      filePath?: string | null;
      url?: string | null;
      sort?: number | string | null;
      isPublished?: boolean;
    };

type RawPromotion = {
  id: number | string;
  code: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  galleryImages?: RawPromotionImage[];
};

type RawCityShopsResponse = {
  city: RawCity;
  items: RawCityCatalogItem[];
};

type RawCityCatalogItem = {
  code: string;
  cityId: number | string;
  title: string;
  thumbUrl?: string | null;
  categoryIds: Array<number | string>;
  featureIds: Array<number | string>;
};

function normalizeId(value: number | string): string {
  return String(value);
}

function normalizeNullableScalar(
  value: number | string | null | undefined,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const next = String(value).trim();
  return next === "" ? null : next;
}

function resolveMediaUrl(
  value: string | null | undefined,
  baseUrl: string,
): string | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  try {
    return new URL(value, `${baseUrl}/`).toString();
  } catch {
    return value;
  }
}

function normalizeSort(
  value: number | string | null | undefined,
): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return Number.MAX_SAFE_INTEGER;
}

function normalizePromotionImages(
  rawItems: RawPromotionImage[] | undefined,
  baseUrl: string,
): string[] {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          sort: index,
          url: resolveMediaUrl(item, baseUrl),
        };
      }

      if (item?.isPublished === false) {
        return null;
      }

      return {
        sort: normalizeSort(item?.sort) + index / 1000,
        url: resolveMediaUrl(item?.filePath ?? item?.url, baseUrl),
      };
    })
    .filter(
      (
        item,
      ): item is {
        sort: number;
        url: string;
      } => item !== null && typeof item.url === "string",
    )
    .sort((left, right) => left.sort - right.sort)
    .map((item) => item.url);
}

function toCity(raw: RawCity): City {
  return {
    code: raw.code,
    title: raw.title,
    sort: raw.sort,
  };
}

function toCategory(raw: RawCategory): Category {
  return {
    id: normalizeId(raw.id),
    title: raw.title,
    sort: raw.sort,
  };
}

function toFeature(raw: RawFeature): Feature {
  return {
    id: normalizeId(raw.id),
    title: raw.title,
    sort: raw.sort,
  };
}

function toShopSummary(
  raw: RawCityCatalogItem,
  baseUrl: string,
): ShopPublic {
  return {
    code: raw.code,
    cityId: normalizeId(raw.cityId),
    title: raw.title,
    slogan: "",
    description: "",
    scheduleNote: "",
    siteUrl: "",
    latitude: null,
    longitude: null,
    thumbUrl: resolveMediaUrl(raw.thumbUrl, baseUrl),
    galleryImages: [],
    categoryIds: raw.categoryIds.map(normalizeId),
    featureIds: raw.featureIds.map(normalizeId),
  };
}

function toShop(raw: RawShop, baseUrl: string): ShopPublic {
  return {
    code: raw.code,
    cityId: normalizeId(raw.cityId),
    title: raw.title,
    slogan: String(raw.slogan ?? "").trim(),
    description: raw.description,
    scheduleNote: String(
      raw.scheduleNote ?? raw.schedule_note ?? "",
    ).trim(),
    siteUrl: raw.siteUrl,
    latitude: normalizeNullableScalar(raw.latitude),
    longitude: normalizeNullableScalar(raw.longitude),
    thumbUrl: resolveMediaUrl(raw.thumbUrl, baseUrl),
    galleryImages: Array.isArray(raw.galleryImages)
      ? raw.galleryImages
          .map((item) => resolveMediaUrl(item, baseUrl))
          .filter((item): item is string => typeof item === "string")
      : [],
    categoryIds: raw.categoryIds.map(normalizeId),
    featureIds: raw.featureIds.map(normalizeId),
  };
}

function toPromotion(
  raw: RawPromotion,
  baseUrl: string,
): PromotionPublic {
  return {
    id: normalizeId(raw.id),
    code: raw.code,
    title: raw.title,
    description: raw.description,
    startDate: raw.startDate,
    endDate: raw.endDate,
    galleryImages: normalizePromotionImages(raw.galleryImages, baseUrl),
  };
}

export class HttpApiClient implements ApiClient {
  constructor(private readonly baseUrl: string) {}

  async getCityList(): Promise<City[]> {
    const items = await this.request<RawCity[]>("/city-list");
    return items.map(toCity);
  }

  async getCategoryList(): Promise<Category[]> {
    const items = await this.request<RawCategory[]>("/category-list");
    return items.map(toCategory);
  }

  async getFeatureList(): Promise<Feature[]> {
    const items = await this.request<RawFeature[]>("/feature-list");
    return items.map(toFeature);
  }

  async getCityShops(
    cityCode: string,
    _query: CityShopsQuery = {},
  ): Promise<CityShopsResponse> {
    const response = await this.request<RawCityShopsResponse>(
      `/city/${encodeURIComponent(cityCode)}`,
    );

    return {
      city: toCity(response.city),
      items: response.items.map((item) =>
        toShopSummary(item, this.baseUrl),
      ),
    };
  }

  async getShopPromotions(
    shopCode: string,
    init: RequestInit = {},
  ): Promise<PromotionPublic[]> {
    const promotions = await this.request<RawPromotion[]>(
      `/shop/${encodeURIComponent(shopCode)}/promotion`,
      init,
    );

    return Array.isArray(promotions)
      ? promotions.map((item) => toPromotion(item, this.baseUrl))
      : [];
  }

  async getShop(
    shopCode: string,
    init: RequestInit = {},
  ): Promise<ShopPublic> {
    const shop = await this.request<RawShop>(
      `/shop/${encodeURIComponent(shopCode)}`,
      init,
    );
    return toShop(shop, this.baseUrl);
  }

  async postAcceptableContactTypes(
    shopCode: string,
    types: string[],
    init: RequestInit = {},
  ): Promise<ContactsResponse> {
    return this.request<ContactsResponse>(
      `/shop/${encodeURIComponent(shopCode)}/acceptable-contact-types`,
      {
        ...init,
        method: "POST",
        body: JSON.stringify(types),
      },
    );
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init.headers,
      },
    });

    if (!response.ok) {
      let message = response.statusText || "Request failed";
      try {
        const errorBody = (await response.json()) as {
          message?: string;
        };
        if (typeof errorBody.message === "string") {
          message = errorBody.message;
        }
      } catch {
        // Ignore JSON parsing errors for non-JSON error bodies.
      }
      throw new ApiError(response.status, message);
    }

    return (await response.json()) as T;
  }
}

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

if (!rawBaseUrl) {
  throw new Error(
    "VITE_API_BASE_URL is required. Define it in frontend/.env.",
  );
}

const baseUrl = rawBaseUrl.endsWith("/")
  ? rawBaseUrl.slice(0, -1)
  : rawBaseUrl;

export const apiClient: ApiClient = new HttpApiClient(baseUrl);
