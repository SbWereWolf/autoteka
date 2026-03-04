import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(".");

const dictsPath = path.join(root, "src/mocks/dicts.json");
const shopsPath = path.join(root, "src/mocks/shops.json");
const themesCssPath = path.join(root, "src/styles/themes.css");
const publicPath = path.join(root, "public");

function fail(message) {
  throw new Error(message);
}

function toPublicFsPath(publicUrl) {
  const clean = publicUrl.startsWith("/") ? publicUrl.slice(1) : publicUrl;
  return path.join(publicPath, clean);
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const dicts = JSON.parse(await fs.readFile(dictsPath, "utf8"));
  const shops = JSON.parse(await fs.readFile(shopsPath, "utf8"));
  const themesCss = await fs.readFile(themesCssPath, "utf8");

  const cityIds = new Set(dicts.cities.map((c) => c.id));
  const categories = new Set(dicts.categories);
  const features = new Set(dicts.features);

  if (!features.has(dicts.defaultFeature)) {
    fail(`defaultFeature '${dicts.defaultFeature}' отсутствует в dicts.features`);
  }

  const themeClassMatches = [...themesCss.matchAll(/\.theme-([a-z0-9-]+)/g)];
  const themeClasses = new Set(themeClassMatches.map((m) => m[1]));

  for (const t of dicts.themes) {
    if (!themeClasses.has(t.id)) {
      fail(`Для темы '${t.id}' отсутствует CSS-класс .theme-${t.id}`);
    }
  }

  for (const shop of shops) {
    if (!cityIds.has(shop.city)) {
      fail(`Магазин '${shop.id}': неизвестный city '${shop.city}'`);
    }

    for (const c of shop.categories ?? []) {
      if (!categories.has(c)) {
        fail(`Магазин '${shop.id}': неизвестная категория '${c}'`);
      }
    }

    for (const f of shop.features ?? []) {
      if (!features.has(f)) {
        fail(`Магазин '${shop.id}': неизвестная фишка '${f}'`);
      }
    }

    const imageRefs = [];
    if (typeof shop.thumbUrl === "string") imageRefs.push(shop.thumbUrl);
    if (Array.isArray(shop.galleryImages)) imageRefs.push(...shop.galleryImages.filter(Boolean));

    for (const imageRef of imageRefs) {
      const filePath = toPublicFsPath(imageRef);
      if (!(await pathExists(filePath))) {
        fail(`Магазин '${shop.id}': ассет не найден '${imageRef}'`);
      }
    }
  }

  console.log("validate:mocks OK");
}

main().catch((err) => {
  console.error(`validate:mocks FAIL: ${err.message}`);
  process.exit(1);
});
