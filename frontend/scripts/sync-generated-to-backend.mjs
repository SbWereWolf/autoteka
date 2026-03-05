import fs from "node:fs/promises";
import path from "node:path";

const frontendRoot = path.resolve(".");
const sourceDir = path.join(frontendRoot, "public", "generated");
const backendGeneratedDir = path.resolve(
  frontendRoot,
  "..",
  "backend",
  "storage",
  "app",
  "public",
  "generated",
);

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function clearDir(dirPath) {
  await ensureDir(dirPath);
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  await Promise.all(
    entries.map((entry) =>
      fs.rm(path.join(dirPath, entry.name), {
        recursive: true,
        force: true,
      }),
    ),
  );
}

async function copyDirFlat(fromDir, toDir) {
  const entries = await fs.readdir(fromDir, { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map((entry) =>
        fs.copyFile(
          path.join(fromDir, entry.name),
          path.join(toDir, entry.name),
        ),
      ),
  );
}

async function main() {
  await ensureDir(sourceDir);
  await clearDir(backendGeneratedDir);
  await copyDirFlat(sourceDir, backendGeneratedDir);

  const count = (await fs.readdir(backendGeneratedDir)).length;
  console.log(
    `sync-generated-to-backend OK: copied ${count} files to ${backendGeneratedDir}`,
  );
}

main().catch((err) => {
  console.error(`sync-generated-to-backend FAIL: ${err.message}`);
  process.exit(1);
});
