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

type ShopWithContacts = ShopPublic & { contacts?: Contact[] };

function sortByOrder<T extends { sort: number; code: string }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) => a.sort - b.sort || a.code.localeCompare(b.code, "ru"),
  );
}

const cityList: City[] = sortByOrder(cityListRaw as City[]);
const categoryList: Category[] = sortByOrder(
  categoryListRaw as Category[],
);
const featureList: Feature[] = sortByOrder(
  featureListRaw as Feature[],
);
const shopsWithContacts = shops as ShopWithContacts[];

function toShopPublic(shop: ShopWithContacts): ShopPublic {
  const { contacts: _contacts, ...rest } = shop;
  return rest;
}

function paginate<T>(items: T[], page = 1, perPage = 24) {
  const safePage = Math.max(1, page);
  const safePerPage = Math.max(1, perPage);
  const start = (safePage - 1) * safePerPage;
  return {
    items: items.slice(start, start + safePerPage),
    page: safePage,
    perPage: safePerPage,
    total: items.length,
  };
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
      (shop) => shop.cityCode === cityCode,
    );
    if (q.length > 0) {
      filtered = filtered.filter((shop) =>
        shop.name.toLocaleLowerCase("ru").includes(q),
      );
    }
    const ordered = [...filtered].sort((a, b) =>
      a.code.localeCompare(b.code, "ru"),
    );
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 24;
    const result = paginate(ordered.map(toShopPublic), page, perPage);
    return result;
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
