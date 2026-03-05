import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(".");

const dictsPath = path.join(root, "src/mocks/dicts.json");
const shopsPath = path.join(root, "src/mocks/shops.json");
const cityListPath = path.join(root, "src/mocks/city-list.json");
const categoryListPath = path.join(root, "src/mocks/category-list.json");
const featureListPath = path.join(root, "src/mocks/feature-list.json");
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
  const cityList = JSON.parse(await fs.readFile(cityListPath, "utf8"));
  const categoryList = JSON.parse(await fs.readFile(categoryListPath, "utf8"));
  const featureList = JSON.parse(await fs.readFile(featureListPath, "utf8"));
  const themesCss = await fs.readFile(themesCssPath, "utf8");

  const features = new Set(dicts.features);
  const cityCodes = new Set();
  const categoryCodes = new Set();
  const featureCodes = new Set();

  if (!features.has(dicts.defaultFeature)) {
    fail(`defaultFeature '${dicts.defaultFeature}' отсутствует в dicts.features`);
  }

  for (const [index, city] of cityList.entries()) {
    if (typeof city.code !== "string" || city.code.length === 0) {
      fail(`city-list[${index}].code должен быть непустой строкой`);
    }
    if (typeof city.name !== "string" || city.name.length === 0) {
      fail(`city-list[${index}].name должен быть непустой строкой`);
    }
    if (typeof city.sort !== "number" || !Number.isFinite(city.sort)) {
      fail(`city-list[${index}].sort должен быть числом`);
    }
    if (cityCodes.has(city.code)) {
      fail(`city-list: повтор code '${city.code}'`);
    }
    cityCodes.add(city.code);
  }

  for (const [index, category] of categoryList.entries()) {
    if (typeof category.code !== "string" || category.code.length === 0) {
      fail(`category-list[${index}].code должен быть непустой строкой`);
    }
    if (typeof category.name !== "string" || category.name.length === 0) {
      fail(`category-list[${index}].name должен быть непустой строкой`);
    }
    if (typeof category.sort !== "number" || !Number.isFinite(category.sort)) {
      fail(`category-list[${index}].sort должен быть числом`);
    }
    if (categoryCodes.has(category.code)) {
      fail(`category-list: повтор code '${category.code}'`);
    }
    categoryCodes.add(category.code);
  }

  for (const [index, feature] of featureList.entries()) {
    if (typeof feature.code !== "string" || feature.code.length === 0) {
      fail(`feature-list[${index}].code должен быть непустой строкой`);
    }
    if (typeof feature.name !== "string" || feature.name.length === 0) {
      fail(`feature-list[${index}].name должен быть непустой строкой`);
    }
    if (typeof feature.sort !== "number" || !Number.isFinite(feature.sort)) {
      fail(`feature-list[${index}].sort должен быть числом`);
    }
    if (featureCodes.has(feature.code)) {
      fail(`feature-list: повтор code '${feature.code}'`);
    }
    featureCodes.add(feature.code);
  }

  const themeClassMatches = [...themesCss.matchAll(/\.theme-([a-z0-9-]+)/g)];
  const themeClasses = new Set(themeClassMatches.map((m) => m[1]));

  for (const t of dicts.themes) {
    if (!themeClasses.has(t.id)) {
      fail(`Для темы '${t.id}' отсутствует CSS-класс .theme-${t.id}`);
    }
  }

  const shopCodes = new Set();
  for (const [shopIndex, shop] of shops.entries()) {
    if (typeof shop.code !== "string" || shop.code.length === 0) {
      fail(`shops[${shopIndex}].code должен быть непустой строкой`);
    }
    if (shopCodes.has(shop.code)) {
      fail(`shops: повтор code '${shop.code}'`);
    }
    shopCodes.add(shop.code);

    if (
      typeof shop.cityCode !== "string" ||
      !cityCodes.has(shop.cityCode)
    ) {
      fail(
        `Магазин '${shop.code}': неизвестный cityCode '${shop.cityCode}'`,
      );
    }

    if (!Array.isArray(shop.categoryCodes)) {
      fail(`Магазин '${shop.code}': categoryCodes должен быть массивом`);
    }
    for (const categoryCode of shop.categoryCodes ?? []) {
      if (!categoryCodes.has(categoryCode)) {
        fail(
          `Магазин '${shop.code}': неизвестный categoryCode '${categoryCode}'`,
        );
      }
    }

    if (!Array.isArray(shop.featureCodes)) {
      fail(`Магазин '${shop.code}': featureCodes должен быть массивом`);
    }
    for (const featureCode of shop.featureCodes ?? []) {
      if (!featureCodes.has(featureCode)) {
        fail(
          `Магазин '${shop.code}': неизвестный featureCode '${featureCode}'`,
        );
      }
    }

    if (shop.thumbUrl != null && typeof shop.thumbUrl !== "string") {
      fail(`Магазин '${shop.code}': thumbUrl должен быть строкой`);
    }
    if (shop.galleryImages != null && !Array.isArray(shop.galleryImages)) {
      fail(
        `Магазин '${shop.code}': galleryImages должен быть массивом строк`,
      );
    }
    if (Array.isArray(shop.galleryImages)) {
      for (const [i, image] of shop.galleryImages.entries()) {
        if (typeof image !== "string") {
          fail(
            `Магазин '${shop.code}': galleryImages[${i}] должен быть строкой`,
          );
        }
      }
    }

    if (shop.contacts != null) {
      if (!Array.isArray(shop.contacts)) {
        fail(`Магазин '${shop.code}': contacts должен быть массивом`);
      }
      for (const [i, contact] of (shop.contacts ?? []).entries()) {
        if (typeof contact?.type !== "string" || typeof contact?.value !== "string") {
          fail(
            `Магазин '${shop.code}': contacts[${i}] должен иметь type/value строками`,
          );
        }
        if (contact.value.trim().length === 0) {
          fail(
            `Магазин '${shop.code}': contacts[${i}].value не должен быть пустым`,
          );
        }
      }
    }

    const imageRefs = [];
    if (typeof shop.thumbUrl === "string") imageRefs.push(shop.thumbUrl);
    if (Array.isArray(shop.galleryImages)) imageRefs.push(...shop.galleryImages.filter(Boolean));

    for (const imageRef of imageRefs) {
      const filePath = toPublicFsPath(imageRef);
      if (!(await pathExists(filePath))) {
        fail(`Магазин '${shop.code}': ассет не найден '${imageRef}'`);
      }
    }
  }

  console.log("check:mocks OK");
}

main().catch((err) => {
  console.error(`check:mocks FAIL: ${err.message}`);
  process.exit(1);
});
