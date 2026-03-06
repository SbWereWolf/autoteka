import cityListRaw from "../mocks/city-list.json";
import categoryListRaw from "../mocks/category-list.json";
import featureListRaw from "../mocks/feature-list.json";
import shops from "./mockShops";
import type {
  Category,
  City,
  Contact,
  ContactsResponse,
  Feature,
  ShopPublic,
} from "../types";
import type { ApiClient, CityShopsQuery } from "./ApiClient";
import { ApiError } from "./ApiClient";

type RawCity = {
  code: string;
  name: string;
  sort: number;
};

type RawNamedDict = {
  code: string;
  name: string;
  sort: number;
};

type RawShop = {
  code: string;
  cityCode: string;
  name: string;
  description: string;
  workHours: string;
  siteUrl: string;
  thumbUrl?: string;
  galleryImages?: string[];
  categoryCodes: string[];
  featureCodes: string[];
  contacts?: Contact[];
};

type ShopWithContacts = ShopPublic & { contacts?: Contact[] };

function sortByOrder<T extends { sort: number; id?: string; code?: string }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) =>
      a.sort - b.sort ||
      String(a.code ?? a.id).localeCompare(
        String(b.code ?? b.id),
        "ru",
      ),
  );
}

const cityList: City[] = sortByOrder(
  (cityListRaw as RawCity[]).map((city) => ({
    code: city.code,
    title: city.name,
    sort: city.sort,
  })),
);

const categoryList: Category[] = sortByOrder(
  (categoryListRaw as RawNamedDict[]).map((category) => ({
    id: category.code,
    title: category.name,
    sort: category.sort,
  })),
);

const featureList: Feature[] = sortByOrder(
  (featureListRaw as RawNamedDict[]).map((feature) => ({
    id: feature.code,
    title: feature.name,
    sort: feature.sort,
  })),
);

const categoryIdByLegacyCode = new Map(
  (categoryListRaw as RawNamedDict[]).map((category) => [
    category.code,
    category.code,
  ]),
);
const featureIdByLegacyCode = new Map(
  (featureListRaw as RawNamedDict[]).map((feature) => [
    feature.code,
    feature.code,
  ]),
);

const shopsWithContacts: ShopWithContacts[] = (shops as RawShop[]).map(
  (shop) => ({
    code: shop.code,
    cityId: shop.cityCode,
    title: shop.name,
    description: shop.description,
    workHours: shop.workHours,
    siteUrl: shop.siteUrl,
    thumbUrl: shop.thumbUrl,
    galleryImages: shop.galleryImages ?? [],
    categoryIds: shop.categoryCodes.map(
      (categoryCode) => categoryIdByLegacyCode.get(categoryCode) ?? categoryCode,
    ),
    featureIds: shop.featureCodes.map(
      (featureCode) => featureIdByLegacyCode.get(featureCode) ?? featureCode,
    ),
    contacts: shop.contacts,
  }),
);

function toShopPublic(shop: ShopWithContacts): ShopPublic {
  const { contacts: _contacts, ...rest } = shop;
  return rest;
}

export class MockApiClient implements ApiClient {
  async getCityList() {
    return cityList;
  }

  async getCategoryList() {
    return categoryList;
  }

  async getFeatureList() {
    return featureList;
  }

  async getCityShops(cityCode: string, query: CityShopsQuery = {}) {
    if (!cityList.some((city) => city.code === cityCode)) {
      throw new ApiError(404, "City Not Found");
    }

    const q = String(query.q ?? "")
      .trim()
      .toLocaleLowerCase("ru");
    let filtered = shopsWithContacts.filter(
      (shop) => shop.cityId === cityCode,
    );

    if (q.length > 0) {
      filtered = filtered.filter((shop) =>
        shop.title.toLocaleLowerCase("ru").includes(q),
      );
    }

    const ordered = [...filtered].sort((a, b) =>
      a.code.localeCompare(b.code, "ru"),
    );

    return {
      city: cityList.find((city) => city.code === cityCode)!,
      items: ordered.map(toShopPublic),
    };
  }

  async getShop(shopCode: string) {
    const shop = shopsWithContacts.find(
      (item) => item.code === shopCode,
    );
    if (!shop) {
      throw new ApiError(404, "Shop Not Found");
    }
    return toShopPublic(shop);
  }

  async postAcceptableContactTypes(
    shopCode: string,
    types: string[],
  ) {
    const shop = shopsWithContacts.find(
      (item) => item.code === shopCode,
    );
    if (!shop) {
      throw new ApiError(404, "Shop Not Found");
    }
    const allowed = new Set(
      types.filter((type) => typeof type === "string"),
    );
    const response: ContactsResponse = {};
    for (const contact of shop.contacts ?? []) {
      if (!allowed.has(contact.type)) continue;
      if (!response[contact.type]) response[contact.type] = [];
      response[contact.type].push(contact.value);
    }
    return response;
  }
}

export const apiClient: ApiClient = new MockApiClient();
