import type {
  Category,
  City,
  CityShopsResponse,
  ContactsResponse,
  Feature,
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
  getShop(shopCode: string): Promise<ShopPublic>;
  postAcceptableContactTypes(
    shopCode: string,
    types: string[],
  ): Promise<ContactsResponse>;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
