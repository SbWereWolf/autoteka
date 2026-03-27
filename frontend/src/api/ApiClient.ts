import type {
  Category,
  City,
  CityShopsResponse,
  ContactsResponse,
  Feature,
  PromotionPublic,
  ShopPublic,
} from "../types";

export type CityShopsQuery = {
  q?: string;
  page?: number;
  perPage?: number;
};

export interface ApiClient {
  getCityList(): Promise<City[]>;
  getCategoryList(): Promise<Category[]>;
  getFeatureList(): Promise<Feature[]>;
  getCityShops(
    cityCode: string,
    query?: CityShopsQuery,
  ): Promise<CityShopsResponse>;
  getShopPromotions(
    shopCode: string,
    init?: RequestInit,
  ): Promise<PromotionPublic[]>;
  getShop(
    shopCode: string,
    init?: RequestInit,
  ): Promise<ShopPublic>;
  postAcceptableContactTypes(
    shopCode: string,
    types: string[],
    init?: RequestInit,
  ): Promise<ContactsResponse>;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
