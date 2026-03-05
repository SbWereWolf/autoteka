import fs from "node:fs/promises";
import path from "node:path";

const outDir = path.resolve("public/generated");

const ASPECTS = [
  { id: "1x1", bw: 512, bh: 512 },
  { id: "3x2", bw: 768, bh: 512 },
  { id: "2x3", bw: 512, bh: 768 }
];
const SCALES = [0.5, 0.75, 1.0, 1.25, 1.5];
const VARIANTS = [1, 2, 3];

function scaleSlug(scale) {
  return Number.isInteger(scale) ? `${scale}_0` : String(scale).replace(".", "_");
}

function palette(variant) {
  if (variant === 1) {
    return { bg: "#f8fafc", a: "#0ea5e9", b: "#22c55e", fg: "#0f172a" };
  }
  if (variant === 2) {
    return { bg: "#fff7ed", a: "#f97316", b: "#eab308", fg: "#1f2937" };
  }
  return { bg: "#f5f3ff", a: "#8b5cf6", b: "#ec4899", fg: "#312e81" };
}

function makeSvg({ w, h, aspect, variant }) {
  const p = palette(variant);
  const r = Math.max(12, Math.round(Math.min(w, h) * 0.08));
  const c1x = Math.round(w * 0.2);
  const c1y = Math.round(h * 0.25);
  const c2x = Math.round(w * 0.78);
  const c2y = Math.round(h * 0.72);
  const txt = `${w}x${h}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p.a}"/>
      <stop offset="100%" stop-color="${p.b}"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${w}" height="${h}" rx="${r}" fill="${p.bg}"/>
  <circle cx="${c1x}" cy="${c1y}" r="${Math.round(Math.min(w, h) * 0.17)}" fill="url(#g)" opacity="0.86"/>
  <circle cx="${c2x}" cy="${c2y}" r="${Math.round(Math.min(w, h) * 0.22)}" fill="url(#g)" opacity="0.72"/>
  <text x="${Math.round(w * 0.06)}" y="${Math.round(h * 0.88)}" fill="${p.fg}" font-family="Verdana, sans-serif" font-size="${Math.max(14, Math.round(Math.min(w, h) * 0.09))}" font-weight="700">${aspect} • ${txt}</text>
</svg>`;
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });

  const existing = await fs.readdir(outDir).catch(() => []);
  await Promise.all(existing.map((f) => fs.rm(path.join(outDir, f), { force: true })));

  let created = 0;
  for (const aspect of ASPECTS) {
    for (const scale of SCALES) {
      for (const variant of VARIANTS) {
        const w = Math.round(aspect.bw * scale);
        const h = Math.round(aspect.bh * scale);
        const file = `gen-${aspect.id}-x${scaleSlug(scale)}-v${variant}-${w}x${h}.svg`;
        const svg = makeSvg({ w, h, aspect: aspect.id, variant });
        await fs.writeFile(path.join(outDir, file), svg, "utf8");
        created++;
      }
    }
  }

  console.log(`Generated ${created} files in ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
