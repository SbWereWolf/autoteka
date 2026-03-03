<template>
  <div class="app-container pb-16 3xl:pb-24 7xl:pb-28">
    <div class="pt-4">
      <button class="ui-transition ui-interactive ui-bounce rounded-xl min-h-12 px-4 py-3 text-sm"
              @click="router.back()">
        ← Назад
      </button>

      <div class="mt-3 text-panel">
        <div class="text-2xl font-bold" :style="{ fontFamily: 'var(--font-display)' }">
          {{ shop?.name ?? "Магазин" }}
        </div>
      </div>

      <div v-if="shop" class="mt-4 space-y-4 3xl:space-y-6">
        <div class="relative">
          <GalleryCarousel :items="galleryItems" />
          <div class="absolute left-3 top-3 rounded-2xl px-3 py-2 text-xs ui-transition"
               :style="hoursStyle">
            <div class="whitespace-pre-line">{{ shop.workHours }}</div>
          </div>
        </div>

        <section class="text-panel">
          <div class="text-xs uppercase tracking-wide" :style="{ color: 'var(--muted)' }">Описание</div>
          <div class="mt-2 text-sm leading-relaxed" :style="{ color: 'var(--text)' }">{{ shop.description }}</div>
        </section>

        <section class="text-panel">
          <div class="text-xs uppercase tracking-wide" :style="{ color: 'var(--muted)' }">Контакты</div>
          <ul class="mt-2 space-y-2">
            <li v-for="(c, i) in shop.contacts" :key="i">
              <a v-if="hrefFor(c)" class="ui-transition ui-link text-sm underline"
                 :style="{ color: 'var(--text)' }"
                 :href="hrefFor(c)!"
                 :target="targetFor(c)"
                 rel="noreferrer">
                {{ labelFor(c) }}
              </a>
              <div v-else class="text-sm" :style="{ color: 'var(--text)' }">{{ labelFor(c) }}</div>
            </li>
          </ul>
        </section>

        <section class="flex gap-3 3xl:gap-6">
          <a class="ui-transition ui-primary ui-bounce inline-flex items-center justify-center rounded-2xl min-h-12 px-4 py-3 text-sm font-semibold"
             :style="{ boxShadow: 'var(--shadow)' }"
             :href="shop.siteUrl"
             target="_self">
            Перейти на сайт
          </a>
          <div class="flex-1 rounded-2xl px-4 py-3 text-xs ui-transition"
               :style="hintStyle">
            Или дотяните вниз в конце страницы
          </div>
        </section>

        <div class="h-24 3xl:h-56 7xl:h-64"></div>
      </div>

      <div v-else class="mt-8 text-sm" :style="{ color: 'var(--muted)' }">
        Магазин не найден.
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

const galleryItems = computed(() => {
  const s: any = shop.value;
  if (!s) return [];
  if (Array.isArray(s.galleryImages) && s.galleryImages.length) return s.galleryImages;
  if (Array.isArray(s.gallery) && s.gallery.length) return s.gallery;
  return [{ kind: "placeholder", label: "Галерея" }];
});

const hoursStyle = computed(() => ({
  background: "var(--surface-strong)",
  color: "var(--text)",
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow)"
}));

const hintStyle = computed(() => ({
  background: "var(--surface-strong)",
  color: "var(--muted)",
  border: "1px solid var(--border)"
}));

function hrefFor(c: { type: string; value: string }) {
  if (c.type === "phone") return `tel:${c.value.replace(/\s|\(|\)|-/g, "")}`;
  if (c.type === "email") return `mailto:${c.value}`;
  if (c.type === "telegram" || c.type === "whatsapp") return c.value;
  // address could be a maps link later
  return null;
}

function targetFor(c: { type: string; value: string }) {
  const href = hrefFor(c);
  if (!href) return undefined;
  return href.startsWith("http") ? "_blank" : "_self";
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
