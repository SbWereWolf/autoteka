import { loadLocal, saveLocal } from "./storage";
import type { ThemeId } from "../state";

export type ThemeOverrides = Record<string, string>;
export type OverridesByTheme = Partial<
  Record<ThemeId, ThemeOverrides>
>;

export const THEME_OVERRIDES_KEY = "autoteka_theme_overrides_v1";

export const EDITOR_GROUPS = {
  palette: [
    "--bg",
    "--surface",
    "--surface-strong",
    "--text",
    "--muted",
    "--accent",
    "--tile-stroke",
    "--tile-shadow",
  ],
  interactive: [
    "--hover-ink",
    "--hover-amt",
    "--active-amt",
    "--hover-saturate",
    "--active-saturate",
    "--hover-brightness",
    "--active-brightness",
    "--tile-hover-brightness",
    "--tile-active-brightness",
  ],
  typography: [
    "--topbar-title-font-size",
    "--topbar-title-font-weight",
    "--topbar-title-letter-spacing",
    "--tile-title-font-ratio",
    "--tile-title-font-min",
    "--tile-title-font-max",
    "--tile-title-color",
    "--tile-title-stroke-color",
    "--tile-title-stroke-width",
    "--tile-title-shadow",
    "--tile-title-line-clamp",
  ],
  layout: [
    "--catalog-grid-gap",
    "--catalog-grid-bottom-padding",
    "--shop-gallery-height",
    "--shop-gallery-max-height",
    "--shop-meta-gap",
  ],
  catalog: [
    "--catalog-grid-columns-mobile",
    "--catalog-grid-columns-3xl",
    "--catalog-grid-columns-7xl",
    "--catalog-feature-sticky-top",
    "--catalog-feature-sticky-bottom",
    "--catalog-feature-max-width",
    "--catalog-feature-min-height",
    "--catalog-feature-font-ratio",
    "--catalog-feature-radius",
  ],
  shop: [
    "--shop-hours-bottom",
    "--shop-hours-max-width",
    "--shop-hours-font-min",
    "--shop-hours-font-fluid",
    "--shop-hours-font-max",
    "--shop-hours-line-height",
    "--shop-hours-letter-spacing",
    "--shop-hours-color",
    "--shop-hours-shadow",
    "--shop-hours-stroke-color",
    "--shop-hours-stroke-width",
  ],
} as const;

export const EDITABLE_VARS = Object.values(
  EDITOR_GROUPS,
).flat() as string[];

export function loadOverridesByTheme(): OverridesByTheme {
  return loadLocal<OverridesByTheme>(THEME_OVERRIDES_KEY, {});
}

export function loadThemeOverrides(theme: ThemeId): ThemeOverrides {
  const all = loadOverridesByTheme();
  return { ...(all[theme] ?? {}) };
}

export function saveThemeOverrides(
  theme: ThemeId,
  overrides: ThemeOverrides,
): void {
  const all = loadOverridesByTheme();
  const nextAll: OverridesByTheme = { ...all };
  const keys = Object.keys(overrides);
  if (keys.length === 0) delete nextAll[theme];
  else nextAll[theme] = overrides;
  saveLocal(THEME_OVERRIDES_KEY, nextAll);
}

export function setThemeOverride(
  theme: ThemeId,
  varName: string,
  value: string,
): ThemeOverrides {
  const next = loadThemeOverrides(theme);
  next[varName] = value;
  saveThemeOverrides(theme, next);
  return next;
}

export function removeThemeOverride(
  theme: ThemeId,
  varName: string,
): ThemeOverrides {
  const next = loadThemeOverrides(theme);
  delete next[varName];
  saveThemeOverrides(theme, next);
  return next;
}

export function clearThemeOverrides(theme: ThemeId): void {
  saveThemeOverrides(theme, {});
}

export function applyThemeOverrides(
  appEl: HTMLElement,
  theme: ThemeId,
): void {
  const overrides = loadThemeOverrides(theme);
  for (const [k, v] of Object.entries(overrides)) {
    appEl.style.setProperty(k, v);
  }
}

export function removeThemeOverridesFromApp(
  appEl: HTMLElement,
  theme: ThemeId,
): void {
  const overrides = loadThemeOverrides(theme);
  for (const k of Object.keys(overrides)) {
    appEl.style.removeProperty(k);
  }
}

export function readComputedVar(
  appEl: HTMLElement,
  varName: string,
): string {
  return getComputedStyle(appEl).getPropertyValue(varName).trim();
}

const COLOR_VARS = new Set([
  "--bg",
  "--surface",
  "--surface-strong",
  "--text",
  "--muted",
  "--accent",
  "--tile-stroke",
  "--tile-shadow",
  "--hover-ink",
  "--tile-title-color",
  "--tile-title-stroke-color",
  "--shop-hours-color",
  "--shop-hours-stroke-color",
]);

const PERCENT_VARS = new Set(["--hover-amt", "--active-amt"]);
const BRIGHTNESS_VARS = new Set([
  "--hover-brightness",
  "--active-brightness",
  "--tile-hover-brightness",
  "--tile-active-brightness",
]);
const SATURATE_VARS = new Set([
  "--hover-saturate",
  "--active-saturate",
]);
const LENGTH_VARS = new Set([
  "--topbar-title-font-size",
  "--topbar-title-letter-spacing",
  "--tile-title-font-min",
  "--tile-title-font-max",
  "--tile-title-stroke-width",
  "--catalog-grid-gap",
  "--catalog-grid-bottom-padding",
  "--catalog-feature-sticky-top",
  "--catalog-feature-sticky-bottom",
  "--catalog-feature-max-width",
  "--catalog-feature-min-height",
  "--catalog-feature-radius",
  "--shop-gallery-height",
  "--shop-gallery-max-height",
  "--shop-hours-bottom",
  "--shop-hours-max-width",
  "--shop-hours-font-min",
  "--shop-hours-font-fluid",
  "--shop-hours-font-max",
  "--shop-hours-letter-spacing",
  "--shop-hours-stroke-width",
  "--shop-meta-gap",
]);
const NUMBER_VARS = new Set([
  "--tile-title-font-ratio",
  "--tile-title-line-clamp",
  "--catalog-grid-columns-mobile",
  "--catalog-grid-columns-3xl",
  "--catalog-grid-columns-7xl",
  "--catalog-feature-font-ratio",
  "--shop-hours-line-height",
]);
const FONT_WEIGHT_VARS = new Set(["--topbar-title-font-weight"]);
const SHADOW_VARS = new Set([
  "--tile-title-shadow",
  "--shop-hours-shadow",
]);

export function isColorVar(varName: string): boolean {
  return COLOR_VARS.has(varName);
}

export function validateVarValue(
  varName: string,
  value: string,
): boolean {
  const v = String(value ?? "").trim();
  if (!v) return false;

  if (COLOR_VARS.has(varName)) {
    return CSS.supports("color", v);
  }

  if (PERCENT_VARS.has(varName)) {
    return CSS.supports(
      "color",
      `color-mix(in oklch, white ${v}, black)`,
    );
  }

  if (BRIGHTNESS_VARS.has(varName)) {
    return CSS.supports("filter", `brightness(${v})`);
  }

  if (SATURATE_VARS.has(varName)) {
    return CSS.supports("filter", `saturate(${v})`);
  }

  if (LENGTH_VARS.has(varName)) {
    return (
      CSS.supports("width", v) ||
      CSS.supports("font-size", v) ||
      CSS.supports("max-width", v) ||
      CSS.supports("height", v)
    );
  }

  if (NUMBER_VARS.has(varName)) {
    return /^-?\d+(\.\d+)?$/.test(v);
  }

  if (FONT_WEIGHT_VARS.has(varName)) {
    return CSS.supports("font-weight", v);
  }

  if (SHADOW_VARS.has(varName)) {
    return CSS.supports("text-shadow", v);
  }

  return true;
}
