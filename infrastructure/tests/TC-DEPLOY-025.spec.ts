/**
 * TC-DEPLOY-025: server-watchdog normalizes load by CPU cores.
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

describe("TC-DEPLOY-025", () => {
  it("server-watchdog.sh computes normalized load with a CPU-core helper", () => {
    const content = read("observability/infrastructure/server-watchdog.sh");

    expect(content).toMatch(/cpu_cores_numbers\(\)/);
    expect(content).toMatch(/getconf _NPROCESSORS_ONLN/);
    expect(content).toMatch(/nproc/);
    expect(content).toMatch(/load_1m_pct\(\)/);
    expect(content).toMatch(/LOAD="\$\(load_1m_pct\)"/);
    expect(content).toMatch(/printf "%d\\n", int\(pct\) \+ 1/);
  });

  it("server-watchdog.sh keeps a 1-core fallback instead of aborting", () => {
    const content = read("observability/infrastructure/server-watchdog.sh");

    expect(content).toMatch(/case "\$cores" in/);
    expect(content).toMatch(/echo 1/);
    expect(content).not.toMatch(/exit 3/);
  });

  it("metrics output and chart labels are percent-based", () => {
    expect(read("observability/application/metrics/index.html")).toMatch(
      /CPU Load %/,
    );
    expect(read("observability/application/metrics-export.sh")).toMatch(
      /load=63 ram=32 health=healthy/,
    );
  });

  it("deploy docs describe the normalized load metric", () => {
    const content = read("DEPLOY.md");

    expect(content).toMatch(/server-watchdog\.sh/);
    expect(content).toMatch(/процентную шкалу/);
  });

  it("env thresholds remain aligned with the percent scale", () => {
    expect(read("prod.env")).toMatch(/^WATCHDOG_LOAD_LIMIT=90$/m);
    expect(read("dev.env")).toMatch(/^# WATCHDOG_LOAD_LIMIT=90$/m);
  });
});
