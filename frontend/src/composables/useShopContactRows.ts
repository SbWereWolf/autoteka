import { computed, type Ref } from "vue";
import type { ContactsResponse } from "../types";
import { buildYandexMapsWebUrl } from "../utils/yandexAddressOpen";

export const SHOP_ACCEPTABLE_CONTACT_TYPES = [
  "phone",
  "email",
  "telegram",
  "whatsapp",
  "address",
] as const;

export type ShopAcceptableContactType =
  (typeof SHOP_ACCEPTABLE_CONTACT_TYPES)[number];

export type MobileContactRow = {
  key: string;
  kind: "phone" | "email" | "address";
  text: string;
  href: string;
  external?: boolean;
};

export type PrimaryContactActions = {
  phoneHref?: string;
  telegramHref?: string;
  whatsappHref?: string;
  addressText?: string;
};

export type ContactRow =
  | {
      key: string;
      kind: "address";
      addressText: string;
      addressTextId: string;
      mapsHref: string;
    }
  | {
      key: string;
      kind: "link";
      label: string;
      href: string;
      target: string;
    }
  | {
      key: string;
      kind: "plain";
      label: string;
    };

function hrefFor(type: string, value: string): string | null {
  if (type === "phone") {
    return `tel:${value.replace(/\s|\(|\)|-/g, "")}`;
  }

  if (type === "email") {
    return `mailto:${value}`;
  }

  if (type === "telegram" || type === "whatsapp") {
    return value;
  }

  return null;
}

function labelFor(type: string, value: string) {
  return value;
}

export function useShopContactRows(contacts: Ref<ContactsResponse>) {
  const contactRows = computed((): ContactRow[] => {
    const rows: ContactRow[] = [];

    for (const type of SHOP_ACCEPTABLE_CONTACT_TYPES) {
      for (const value of contacts.value[type] ?? []) {
        if (type === "address") {
          const addressText = String(value ?? "");
          if (!addressText.trim()) {
            continue;
          }
          const addressTextId = `shop-address-text-${rows.length}`;
          rows.push({
            key: `address:${rows.length}:${addressText}`,
            kind: "address",
            addressText,
            addressTextId,
            mapsHref: buildYandexMapsWebUrl(addressText),
          });
          continue;
        }

        const href = hrefFor(type, value);
        if (href) {
          rows.push({
            key: `${type}:${value}`,
            kind: "link",
            label: labelFor(type, value),
            href,
            target: href.startsWith("http") ? "_blank" : "_self",
          });
        } else {
          rows.push({
            key: `${type}:${value}`,
            kind: "plain",
            label: labelFor(type, value),
          });
        }
      }
    }

    return rows;
  });

  const primaryContactActions = computed((): PrimaryContactActions => {
    const result: PrimaryContactActions = {};

    const firstOf = (type: string) =>
      (contacts.value[type] ?? []).find((value) => value.trim() !== "");

    const phone = firstOf("phone");
    if (phone) {
      const href = hrefFor("phone", phone);
      if (href) {
        result.phoneHref = href;
      }
    }

    const telegram = firstOf("telegram");
    if (telegram) {
      const href = hrefFor("telegram", telegram);
      if (href) {
        result.telegramHref = href;
      }
    }

    const whatsapp = firstOf("whatsapp");
    if (whatsapp) {
      const href = hrefFor("whatsapp", whatsapp);
      if (href) {
        result.whatsappHref = href;
      }
    }

    const address = firstOf("address");
    if (address) {
      result.addressText = address;
    }

    return result;
  });

  // Контент-секция карточки на мобиле (канон ShopMain): только
  // телефон/email/адрес — иконка + текст, без tg/wa и без навигатор-кнопки.
  // contactRows (десктоп + action-бар) не трогаем.
  const mobileContactRows = computed((): MobileContactRow[] => {
    const rows: MobileContactRow[] = [];
    const data = contacts.value;

    for (const value of data.phone ?? []) {
      const text = String(value ?? "").trim();
      if (!text) continue;
      const href = hrefFor("phone", text);
      if (href) {
        rows.push({ key: `phone:${text}`, kind: "phone", text, href });
      }
    }

    for (const value of data.email ?? []) {
      const text = String(value ?? "").trim();
      if (!text) continue;
      const href = hrefFor("email", text);
      if (href) {
        rows.push({ key: `email:${text}`, kind: "email", text, href });
      }
    }

    for (const value of data.address ?? []) {
      const text = String(value ?? "").trim();
      if (!text) continue;
      rows.push({
        key: `address:${rows.length}:${text}`,
        kind: "address",
        text,
        href: buildYandexMapsWebUrl(text),
        external: true,
      });
    }

    return rows;
  });

  return { contactRows, primaryContactActions, mobileContactRows };
}
