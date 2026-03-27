export type City = {
  code: string;
  title: string;
  sort: number;
};

export type Category = {
  id: string;
  title: string;
  sort: number;
};

export type Feature = {
  id: string;
  title: string;
  sort: number;
};

export type ShopPublic = {
  code: string;
  cityId: string;
  title: string;
  slogan: string;
  description: string;
  scheduleNote: string;
  siteUrl: string;
  latitude: string | null;
  longitude: string | null;
  thumbUrl?: string;
  galleryImages?: string[];
  categoryIds: string[];
  featureIds: string[];
};

export type PromotionPublic = {
  id: string;
  code: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  galleryImages: string[];
};

export type Contact = {
  type: string;
  value: string;
};

export type ContactsResponse = Record<string, string[]>;

export type CityShopsResponse = {
  city: City;
  items: ShopPublic[];
};
