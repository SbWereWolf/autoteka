<template>
  <div
      class="app min-h-screen"
      :class="shellClass"
    :style="{ color: 'var(--text)' }"
  >
    <TopBar v-if="isCatalog"/>
    <HamburgerMenu v-if="isCatalog"/>

    <main :class="isCatalog ? 'pt-[4.5rem]' : ''">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue";
import {useRoute} from "vue-router";
import TopBar from "./components/TopBar.vue";
import HamburgerMenu from "./components/HamburgerMenu.vue";

const route = useRoute();

const isCatalog = computed(() => route.name === "catalog");
const isShop = computed(() => route.name === "shop");
const shellClass = computed(() => {
      let result = "";
      switch (true) {
        case isCatalog.value:
          result = "app-catalog-shell";
          break;
        case isShop.value:
          result = "app-shop-shell";
          break;
      }

      return result;
}
);
</script>
