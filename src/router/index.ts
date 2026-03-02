import { createRouter, createWebHistory } from "vue-router";
import CatalogPage from "../pages/CatalogPage.vue";
import ShopPage from "../pages/ShopPage.vue";

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "catalog", component: CatalogPage },
    { path: "/shop/:id", name: "shop", component: ShopPage, props: true },
  ],
});
