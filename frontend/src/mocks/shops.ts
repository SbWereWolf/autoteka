import rawShops from "./shops.json";

type RawShop = (typeof rawShops)[number];

export const shops = rawShops as RawShop[];

export default shops;
