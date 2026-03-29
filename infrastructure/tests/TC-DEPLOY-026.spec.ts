/**
 * TC-DEPLOY-026: APP_KEY generation is owned by runtime preparation only.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INFRA_ROOT_PATH = join(__dirname, "..");

function read(relPath: string): string {
  return readFileSync(join(INFRA_ROOT_PATH, relPath), "utf-8");
}

describe("TC-DEPLOY-026", () => {
  it("keeps APP_KEY generation inside prepare_laravel_runtime only", () => {
    const laravelRuntime = read("lib/laravel-runtime.sh");
    const deployFlow = read("lib/deploy-flow.sh");
    const prodEntrypoint = read("runtime/docker/php/prod-entrypoint.sh");
    const devEntrypoint = read("runtime/docker/php/dev-entrypoint.sh");
    const deployDocs = read("DEPLOY.md");

    expect(laravelRuntime).toMatch(/prepare_laravel_runtime\(\)/);
    expect(laravelRuntime).toMatch(
      /cd apps\/ShopOperator && php artisan key:generate --force --ansi/,
    );
    expect(laravelRuntime).toMatch(
      /cd apps\/ShopAPI && php artisan key:generate --force --ansi/,
    );

    expect(deployFlow).not.toMatch(/ensure_app_key/);
    expect(prodEntrypoint).not.toMatch(/php artisan key:generate/);
    expect(devEntrypoint).not.toMatch(/php artisan key:generate/);
    expect(deployDocs).toMatch(/ShopOperator/);
    expect(deployDocs).toMatch(/php artisan key:generate --force/);
    expect(deployDocs).toMatch(/source \/etc\/autoteka\/options\.env/);
  });
});
