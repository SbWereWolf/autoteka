export type City = {
  code: string;
  name: string;
  sort: number;
};

export type Category = {
  code: string;
  name: string;
  sort: number;
};

export type Feature = {
  code: string;
  name: string;
  sort: number;
};

export type ShopPublic = {
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
};

export type Contact = {
  type: string;
  value: string;
};

export type ContactsResponse = Record<string, string[]>;

export type CityShopsResponse = {
  items: ShopPublic[];
  page: number;
  perPage: number;
  total: number;
};
