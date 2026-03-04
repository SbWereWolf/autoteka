export type Contact = {
  type: string;
  value: string;
};

export type Shop = {
  id: string;
  name: string;
  city: string;
  categories: string[];
  features: string[];
  workHours: string;
  description: string;
  contacts: Contact[];
  siteUrl: string;
  thumbUrl?: string;
  galleryImages?: string[];
};
