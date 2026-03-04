import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(".");
const generatedDir = path.join(root, "public/generated");

const SCALES = [0.5, 0.75, 1.0, 1.25, 1.5];
const VARIANTS = [1, 2, 3];
const ASPECTS = [
  { id: "1x1", bw: 512, bh: 512 },
  { id: "3x2", bw: 768, bh: 512 },
  { id: "2x3", bw: 512, bh: 768 }
];

function scaleSlug(scale) {
  return Number.isInteger(scale) ? `${scale}_0` : String(scale).replace(".", "_");
}

function expectedFileNames() {
  const out = new Set();
  for (const aspect of ASPECTS) {
    for (const scale of SCALES) {
      for (const variant of VARIANTS) {
        const w = Math.round(aspect.bw * scale);
        const h = Math.round(aspect.bh * scale);
        out.add(`gen-${aspect.id}-x${scaleSlug(scale)}-v${variant}-${w}x${h}.svg`);
      }
    }
  }
  return out;
}

async function main() {
  const expected = expectedFileNames();
  const actualList = await fs.readdir(generatedDir);
  const actual = new Set(actualList);

  const missing = [...expected].filter((f) => !actual.has(f)).sort();
  const unused = [...actual].filter((f) => !expected.has(f)).sort();

  if (missing.length === 0 && unused.length === 0) {
    console.log("check:unused-assets OK");
    return;
  }

  if (missing.length > 0) {
    console.error("Отсутствуют ожидаемые файлы:");
    for (const f of missing) console.error(`- public/generated/${f}`);
  }

  if (unused.length > 0) {
    console.error("Найдены лишние файлы:");
    for (const f of unused) console.error(`- public/generated/${f}`);
  }

  process.exit(1);
}

main().catch((err) => {
  console.error(`check:unused-assets FAIL: ${err.message}`);
  process.exit(1);
});
