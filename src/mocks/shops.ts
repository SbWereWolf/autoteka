import rawShops from "./shops.json";
import type { Shop } from "../types";

function hashToSeed(str: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SCALES = [0.5, 0.75, 1.0, 1.25, 1.5] as const;
const VARIANTS = [1, 2, 3] as const;

type Aspect = "1x1" | "3x2" | "2x3";

function sizeFor(aspect: Aspect, scale: number) {
  const base =
    aspect === "1x1" ? { w: 512, h: 512 } : aspect === "3x2" ? { w: 768, h: 512 } : { w: 512, h: 768 };
  return {
    w: Math.round(base.w * scale),
    h: Math.round(base.h * scale)
  };
}

function scaleToSlug(scale: number) {
  return Number.isInteger(scale) ? `${scale}_0` : String(scale).replace(".", "_");
}

function buildPool(): string[] {
  const out: string[] = [];
  const aspects: Aspect[] = ["1x1", "3x2", "2x3"];
  for (const a of aspects) {
    for (const s of SCALES) {
      for (const v of VARIANTS) {
        const { w, h } = sizeFor(a, s);
        out.push(`/generated/gen-${a}-x${scaleToSlug(s)}-v${v}-${w}x${h}.svg`);
      }
    }
  }
  return out;
}

const IMAGE_POOL = buildPool();

function pickImages(shopId: string) {
  const rnd = mulberry32(hashToSeed(shopId));

  // Randomized amount per shop: 0..5 (deterministic by shopId seed).
  const count = Math.floor(rnd() * 6);

  if (count === 0) return { thumbUrl: undefined, galleryImages: undefined };

  // deterministic shuffle
  const pool = IMAGE_POOL.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const galleryImages = pool.slice(0, count);
  return { thumbUrl: galleryImages[0], galleryImages };
}

export const shops: Shop[] = (rawShops as Shop[]).map((s) => {
  const imgs = pickImages(s.id);
  return {
    ...s,
    ...imgs
  };
});

export default shops;
