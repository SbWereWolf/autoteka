import { loadLocal, saveLocal } from "./storage";
import type { ThemeId } from "../state";

/**
 * Per-theme runtime overrides for CSS variables.
 * Stored as a single JSON object in localStorage.
 */

export type ThemeOverrides = Record<string, string>; // e.g. { "--bg": "oklch(...)" }
export type OverridesByTheme = Partial<Record<ThemeId, ThemeOverrides>>;

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
} as const;

export const EDITABLE_VARS = [
  ...EDITOR_GROUPS.palette,
  ...EDITOR_GROUPS.interactive,
] as const;

export function loadOverridesByTheme(): OverridesByTheme {
  return loadLocal<OverridesByTheme>(THEME_OVERRIDES_KEY, {});
}

export function loadThemeOverrides(theme: ThemeId): ThemeOverrides {
  const all = loadOverridesByTheme();
  return { ...(all[theme] ?? {}) };
}

export function saveThemeOverrides(theme: ThemeId, overrides: ThemeOverrides): void {
  const all = loadOverridesByTheme();
  // keep storage small: drop empty themes
  const nextAll: OverridesByTheme = { ...all };
  const keys = Object.keys(overrides);
  if (keys.length === 0) delete nextAll[theme];
  else nextAll[theme] = overrides;
  saveLocal(THEME_OVERRIDES_KEY, nextAll);
}

export function setThemeOverride(theme: ThemeId, varName: string, value: string): ThemeOverrides {
  const next = loadThemeOverrides(theme);
  next[varName] = value;
  saveThemeOverrides(theme, next);
  return next;
}

export function removeThemeOverride(theme: ThemeId, varName: string): ThemeOverrides {
  const next = loadThemeOverrides(theme);
  delete next[varName];
  saveThemeOverrides(theme, next);
  return next;
}

export function clearThemeOverrides(theme: ThemeId): void {
  saveThemeOverrides(theme, {});
}

export function applyThemeOverrides(appEl: HTMLElement, theme: ThemeId): void {
  const overrides = loadThemeOverrides(theme);
  for (const [k, v] of Object.entries(overrides)) {
    appEl.style.setProperty(k, v);
  }
}

export function removeThemeOverridesFromApp(appEl: HTMLElement, theme: ThemeId): void {
  const overrides = loadThemeOverrides(theme);
  for (const k of Object.keys(overrides)) {
    appEl.style.removeProperty(k);
  }
}

export function readComputedVar(appEl: HTMLElement, varName: string): string {
  return getComputedStyle(appEl).getPropertyValue(varName).trim();
}

// --- Validation helpers (MVP: text inputs, best-effort validation) ---

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
]);

const PERCENT_VARS = new Set(["--hover-amt", "--active-amt"]);
const BRIGHTNESS_VARS = new Set([
  "--hover-brightness",
  "--active-brightness",
  "--tile-hover-brightness",
  "--tile-active-brightness",
]);
const SATURATE_VARS = new Set(["--hover-saturate", "--active-saturate"]);

export function isColorVar(varName: string): boolean {
  return COLOR_VARS.has(varName);
}

export function validateVarValue(varName: string, value: string): boolean {
  const v = String(value ?? "").trim();
  if (!v) return false;

  if (COLOR_VARS.has(varName)) {
    return CSS.supports("color", v);
  }

  if (PERCENT_VARS.has(varName)) {
    // checks the percent token in a context similar to how we use it in color-mix
    return CSS.supports("color", `color-mix(in oklch, white ${v}, black)`);
  }

  if (BRIGHTNESS_VARS.has(varName)) {
    return CSS.supports("filter", `brightness(${v})`);
  }

  if (SATURATE_VARS.has(varName)) {
    return CSS.supports("filter", `saturate(${v})`);
  }

  // fallback: accept anything (it's a dev tool)
  return true;
}
