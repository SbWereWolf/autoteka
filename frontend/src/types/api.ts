export type City = {
  id: string;
  name: string;
  sort: number;
};

export type Category = {
  id: string;
  name: string;
  sort: number;
};

export type Feature = {
  id: string;
  name: string;
  sort: number;
};

export type ShopPublic = {
  id: string;
  cityId: string;
  name: string;
  description: string;
  workHours: string;
  siteUrl: string;
  thumbUrl?: string;
  galleryImages?: string[];
  categoryIds: string[];
  featureIds: string[];
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
