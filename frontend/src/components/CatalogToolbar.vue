<template>
  <div class="catalog-toolbar" data-testid="catalog-toolbar">
    <div class="catalog-toolbar-left">
      <span class="catalog-toolbar-count">
        {{ count }} {{ shopWord }}
      </span>
      <CatalogFilterChips class="catalog-toolbar-chips" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import CatalogFilterChips from "./CatalogFilterChips.vue";

const props = defineProps<{
  count: number;
}>();

function plural(n: number, forms: [string, string, string]): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return forms[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
  return forms[2];
}

const shopWord = computed(() =>
  plural(props.count, ["магазин", "магазина", "магазинов"]),
);
</script>
