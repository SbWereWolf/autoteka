import { createRouter, createWebHistory } from "vue-router";
import CatalogPage from "../pages/CatalogPage.vue";
import ShopPage from "../pages/ShopPage.vue";

let catalogScrollTop = 0;

export default createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (from.name === "catalog") {
      catalogScrollTop = window.scrollY;
    }

    if (savedPosition) {
      return savedPosition;
    }

    if (to.name === "shop") {
      return { left: 0, top: 0 };
    }

    if (to.name === "catalog" && from.name === "shop") {
      return { left: 0, top: catalogScrollTop };
    }

    return { left: 0, top: 0 };
  },
  routes: [
    { path: "/", name: "catalog", component: CatalogPage },
    { path: "/shop/:code", name: "shop", component: ShopPage },
  ],
});
