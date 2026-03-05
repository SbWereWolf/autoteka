import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(".");
const mocksDir = path.join(root, "src", "mocks");
const shopsPath = path.join(mocksDir, "shops.json");

const SCALES = [0.5, 0.75, 1.0, 1.25, 1.5];
const VARIANTS = [1, 2, 3];
const ASPECTS = ["1x1", "3x2", "2x3"];

function hashToSeed(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }

  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;

  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sizeFor(aspect, scale) {
  const base =
    aspect === "1x1"
      ? { w: 512, h: 512 }
      : aspect === "3x2"
        ? { w: 768, h: 512 }
        : { w: 512, h: 768 };

  return {
    w: Math.round(base.w * scale),
    h: Math.round(base.h * scale),
  };
}

function scaleToSlug(scale) {
  return Number.isInteger(scale)
    ? `${scale}_0`
    : String(scale).replace(".", "_");
}

export function buildImagePool() {
  const out = [];

  for (const aspect of ASPECTS) {
    for (const scale of SCALES) {
      for (const variant of VARIANTS) {
        const { w, h } = sizeFor(aspect, scale);
        out.push(
          `/generated/gen-${aspect}-x${scaleToSlug(scale)}-v${variant}-${w}x${h}.svg`,
        );
      }
    }
  }

  return out;
}

const IMAGE_POOL = buildImagePool();

export function assignShopImages(shopCode) {
  const code = String(shopCode ?? "").trim();
  if (code === "") {
    return {};
  }

  const rnd = mulberry32(hashToSeed(code));
  const count = Math.floor(rnd() * 6);

  if (count === 0) {
    return {};
  }

  const pool = IMAGE_POOL.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const galleryImages = pool.slice(0, count);

  return {
    thumbUrl: galleryImages[0],
    galleryImages,
  };
}

export function materializeShopMedia(shop) {
  const media = assignShopImages(shop?.code);

  return {
    ...shop,
    ...media,
  };
}

export function materializeShops(shops) {
  return shops.map((shop) => materializeShopMedia(shop));
}

async function main() {
  const shops = JSON.parse(await fs.readFile(shopsPath, "utf8"));
  const nextShops = materializeShops(shops);

  await fs.writeFile(
    shopsPath,
    `${JSON.stringify(nextShops, null, 2)}\n`,
    "utf8",
  );

  console.log("materialize:shop-media OK");
}

const isDirectRun =
  process.argv[1] != null &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  main().catch((err) => {
    console.error(`materialize:shop-media FAIL: ${err.message}`);
    process.exit(1);
  });
}
