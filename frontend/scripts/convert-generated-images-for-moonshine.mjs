import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const frontendRoot = path.resolve(".");
const generatedDir = path.join(frontendRoot, "public", "generated");
const shopsPath = path.join(
  frontendRoot,
  "src",
  "mocks",
  "shops.json",
);

function parseSvgSize(svg) {
  const widthMatch = svg.match(/\bwidth="(\d+)"/i);
  const heightMatch = svg.match(/\bheight="(\d+)"/i);

  if (widthMatch && heightMatch) {
    return {
      width: Number(widthMatch[1]),
      height: Number(heightMatch[1]),
    };
  }

  const viewBoxMatch = svg.match(
    /\bviewBox="[\d.\s-]*\s(\d+(?:\.\d+)?)\s(\d+(?:\.\d+)?)"/i,
  );
  if (!viewBoxMatch) {
    throw new Error("Не удалось определить размеры SVG");
  }

  return {
    width: Math.round(Number(viewBoxMatch[1])),
    height: Math.round(Number(viewBoxMatch[2])),
  };
}

function svgPathToPng(mediaPath) {
  if (typeof mediaPath !== "string") {
    return mediaPath;
  }

  return mediaPath.replace(
    /^\/generated\/(.+)\.svg$/i,
    "/generated/$1.png",
  );
}

async function convertSvgFile(page, fileName) {
  const svgPath = path.join(generatedDir, fileName);
  const pngPath = path.join(
    generatedDir,
    fileName.replace(/\.svg$/i, ".png"),
  );
  const svg = await fs.readFile(svgPath, "utf8");
  const { width, height } = parseSvgSize(svg);

  await page.setViewportSize({ width, height });
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}</style>${svg}`,
    { waitUntil: "load" },
  );

  await page.screenshot({
    path: pngPath,
    type: "png",
    omitBackground: false,
  });

  return {
    svg: fileName,
    png: path.basename(pngPath),
  };
}

async function updateShopsJson() {
  const raw = await fs.readFile(shopsPath, "utf8");
  const shops = JSON.parse(raw);

  const updated = shops.map((shop) => ({
    ...shop,
    thumbUrl: svgPathToPng(shop.thumbUrl),
    galleryImages: Array.isArray(shop.galleryImages)
      ? shop.galleryImages.map(svgPathToPng)
      : shop.galleryImages,
  }));

  await fs.writeFile(
    `${shopsPath}.tmp`,
    `${JSON.stringify(updated, null, 2)}\n`,
    "utf8",
  );
  await fs.rename(`${shopsPath}.tmp`, shopsPath);
}

async function main() {
  const entries = await fs.readdir(generatedDir, {
    withFileTypes: true,
  });
  const svgFiles = entries
    .filter(
      (entry) =>
        entry.isFile() && entry.name.toLowerCase().endsWith(".svg"),
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "en"));

  if (svgFiles.length === 0) {
    console.log("Нет SVG-файлов для конвертации");
    return;
  }

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    const converted = [];

    for (const fileName of svgFiles) {
      converted.push(await convertSvgFile(page, fileName));
    }

    await updateShopsJson();

    console.log(
      `convert-generated-images-for-moonshine OK: converted ${converted.length} SVG files to PNG and updated shops.json`,
    );
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(
    `convert-generated-images-for-moonshine FAIL: ${err.message}`,
  );
  process.exit(1);
});
