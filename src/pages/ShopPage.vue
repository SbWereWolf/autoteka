<template>
  <div class="mx-auto max-w-6xl px-3 xs:px-3 sm:px-4 3xl:px-6 7xl:px-8 pb-16">
    <div class="pt-4">
      <div class="flex items-start gap-3">
        <button
          class="ui-transition rounded-xl px-3 py-2 text-sm"
          :style="backStyle"
          @click="router.back()"
        >
          ← Назад
        </button>

        <!-- Title block on its own background for readability -->
        <div class="flex-1 min-w-0 text-panel p-3 ui-transition">
          <div
            class="truncate text-base font-semibold"
            :style="{ color: 'var(--muted)' }"
          >
            Магазин
          </div>
          <div
            class="mt-0.5 truncate text-xl font-bold"
            :style="{ color: 'var(--text)', fontFamily: 'var(--font-display)' }"
          >
            {{ shop?.name ?? "Не найден" }}
          </div>
        </div>
      </div>

      <div v-if="shop" class="mt-4 space-y-4">
        <div class="relative">
          <GalleryCarousel :items="shop.gallery" />
          <div
            class="absolute left-3 top-3 rounded-2xl px-3 py-2 text-xs ui-transition"
            :style="hoursStyle"
          >
            <div class="whitespace-pre-line">{{ shop.workHours }}</div>
          </div>
        </div>

        <section class="rounded-[var(--radius)] p-4 ui-transition" :style="cardStyle">
          <div class="text-xs uppercase tracking-wide" :style="{ color: 'var(--muted)' }">Описание</div>
          <div class="mt-2 text-sm leading-relaxed" :style="{ color: 'var(--text)' }">{{ shop.description }}</div>
        </section>

        <section class="rounded-[var(--radius)] p-4 ui-transition" :style="cardStyle">
          <div class="text-xs uppercase tracking-wide" :style="{ color: 'var(--muted)' }">Контакты</div>
          <ul class="mt-2 space-y-2">
            <li v-for="(c, i) in shop.contacts" :key="i">
              <a
                v-if="hrefFor(c)"
                class="ui-transition text-sm underline"
                :style="{ color: 'var(--text)' }"
                :href="hrefFor(c)!"
                target="_blank"
                rel="noreferrer"
              >
                {{ labelFor(c) }}
              </a>
              <div v-else class="text-sm" :style="{ color: 'var(--text)' }">{{ labelFor(c) }}</div>
            </li>
          </ul>
        </section>

        <section class="flex gap-3">
          <a
            class="ui-transition inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold"
            :style="primaryStyle"
            :href="shop.siteUrl"
            target="_self"
          >
            Перейти на сайт
          </a>
          <div
            class="flex-1 rounded-2xl px-4 py-3 text-xs ui-transition"
            :style="hintStyle"
          >
            Или дотяните вниз в конце страницы
          </div>
        </section>

        <div class="h-24"></div>
      </div>

      <div v-else class="mt-6 text-panel p-4 ui-transition">
        <div class="text-sm" :style="{ color: 'var(--text)' }">Магазин не найден.</div>
      </div>
    </div>

    <OverscrollOpenLink v-if="shop" :url="shop.siteUrl" :thresholdPx="90" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import shops from "../mocks/shops.json";
import GalleryCarousel from "../components/GalleryCarousel.vue";
import OverscrollOpenLink from "../components/OverscrollOpenLink.vue";

const route = useRoute();
const router = useRouter();

const shopId = computed(() => String(route.params.id ?? ""));
const shop = computed(() => (shops as any[]).find(s => s.id === shopId.value));

const backStyle = computed(() => ({
  background: "var(--surface)",
  color: "var(--text)",
  border: "1px solid color-mix(in oklch, var(--text) 12%, transparent)",
  boxShadow: "var(--shadow)"
}));

const cardStyle = computed(() => ({
  background: "var(--surface)",
  color: "var(--text)",
  border: "1px solid color-mix(in oklch, var(--text) 10%, transparent)",
  boxShadow: "var(--shadow)"
}));

const hoursStyle = computed(() => ({
  /* Opaque badge so the busy background never shows through */
  background: "var(--surface-strong)",
  color: "var(--text)",
  border: "1px solid color-mix(in oklch, var(--text) 12%, transparent)",
  boxShadow: "var(--shadow)"
}));

const primaryStyle = computed(() => ({
  background: "var(--accent)",
  color: "color-mix(in oklch, oklch(100% 0 0) 92%, transparent)",
  boxShadow: "var(--shadow)"
}));

const hintStyle = computed(() => ({
  background: "var(--surface)",
  color: "var(--muted)",
  border: "1px solid color-mix(in oklch, var(--text) 10%, transparent)"
}));

function hrefFor(c: { type: string; value: string }) {
  if (c.type === "phone") return `tel:${c.value.replace(/\s|\(|\)|-/g, "")}`;
  if (c.type === "email") return `mailto:${c.value}`;
  if (c.type === "telegram" || c.type === "whatsapp") return c.value;
  return null;
}

function labelFor(c: { type: string; value: string }) {
  const map: Record<string, string> = {
    phone: "Телефон",
    email: "Email",
    telegram: "Telegram",
    whatsapp: "WhatsApp",
    address: "Адрес",
    text: "Контакт"
  };
  return `${map[c.type] ?? c.type}: ${c.value}`;
}
</script>
