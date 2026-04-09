/**
 * TC-DEPLOY-027: runtime config file names match their content type.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INFRA_ROOT_PATH = join(__dirname, "..");

function read(relPath: string): string {
  return readFileSync(join(INFRA_ROOT_PATH, relPath), "utf-8");
}

function exists(relPath: string): boolean {
  return existsSync(join(INFRA_ROOT_PATH, relPath));
}

describe("TC-DEPLOY-027", () => {
  it("keeps nginx and php runtime configs only under the renamed files", () => {
    expect(exists("runtime/docker/dev/nginx/sourc.templatee.conf")).toBe(
      true,
    );
    expect(exists("runtime/docker/dev/nginx/bundle-watch.template.conf")).toBe(
      true,
    );
    expect(exists("runtime/docker/php/php.dev.ini")).toBe(true);
    expect(exists("runtime/docker/php/php.prod.template.ini")).toBe(true);

    expect(exists("runtime/docker/dev/nginx/source.conf.template")).toBe(
      false,
    );
    expect(exists("runtime/docker/dev/nginx/bundle-watch.conf.template")).toBe(
      false,
    );
    expect(exists("runtime/docker/php/php.ini.dev")).toBe(false);
    expect(exists("runtime/docker/php/php.ini.prod.template")).toBe(false);
  });

  it("updates docker wiring to the renamed runtime configs", () => {
    const nginxDockerfile = read("runtime/docker/dev/nginx/Dockerfile");
    const nginxEntrypoint = read("runtime/docker/dev/nginx/entrypoint.sh");
    const phpDockerfile = read("runtime/docker/php/Dockerfile");

    expect(nginxDockerfile).toMatch(/sourc\.templatee\.conf/);
    expect(nginxDockerfile).toMatch(/bundle-watch\.template\.conf/);
    expect(nginxDockerfile).not.toMatch(/source\.conf\.template/);
    expect(nginxDockerfile).not.toMatch(/bundle-watch\.conf\.template/);

    expect(nginxEntrypoint).toMatch(/sourc\.templatee\.conf/);
    expect(nginxEntrypoint).toMatch(/bundle-watch\.template\.conf/);
    expect(nginxEntrypoint).not.toMatch(/source\.conf\.template/);
    expect(nginxEntrypoint).not.toMatch(/bundle-watch\.conf\.template/);

    expect(phpDockerfile).toMatch(/php\.dev\.ini/);
    expect(phpDockerfile).toMatch(/php\.prod\.template\.ini/);
    expect(phpDockerfile).not.toMatch(/php\.ini\.dev/);
    expect(phpDockerfile).not.toMatch(/php\.ini\.prod\.template/);
  });
});
