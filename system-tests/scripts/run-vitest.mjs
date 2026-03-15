import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rawArgs = process.argv.slice(2);

const getArgValue = (name) => {
  const pref = `${name}=`;
  const direct = rawArgs.find((arg) => arg.startsWith(pref));
  if (direct) return direct.slice(pref.length);
  const idx = rawArgs.indexOf(name);
  if (idx >= 0 && rawArgs[idx + 1]) return rawArgs[idx + 1];
  return undefined;
};

const profile = getArgValue("--profile") ?? "quick-local";
const cliBaseUrl = getArgValue("--base-url");
const waitProfile = (process.env.TEST_WAIT_PROFILE ?? "normal").toLowerCase();

const profileMap = {
  "quick-local": { mode: "quick", stack: "local", headed: "0" },
  "quick-dev": { mode: "quick", stack: "dev", headed: "0" },
  "ui-headless-dev": { mode: "ui", stack: "dev", headed: "0" },
  "ui-headless-prod": { mode: "ui", stack: "prod", headed: "0" },
  "ui-headed-local": { mode: "ui", stack: "local", headed: "1" },
  "ui-headed-prod": { mode: "ui", stack: "prod", headed: "1" },
};

if (!profileMap[profile]) {
  console.error(`Unknown profile: ${profile}`);
  process.exit(2);
}

const profileInfo = profileMap[profile];
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const systemTestsDir = path.join(repoRoot, "system-tests");
const systemTestsEnvPath = path.join(systemTestsDir, ".env");

const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const parsed = {};
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key) continue;
    parsed[key] = value.replace(/^['"]|['"]$/g, "");
  }
  return parsed;
};

if (!fs.existsSync(systemTestsEnvPath)) {
  console.error(
    "[run-vitest] Не найден system-tests/.env. Создайте: 1) скопируйте system-tests/example.env в system-tests/win.env и system-tests/nix.env; 2) заполните INFRA_ROOT; 3) выполните: pwsh ./scripts/swap-env.ps1 load -t system-tests-env",
  );
  process.exit(3);
}

const systemTestsEnv = parseEnvFile(systemTestsEnvPath);
const infraRoot = systemTestsEnv.INFRA_ROOT?.trim();

if (!infraRoot) {
  console.error(
    "[run-vitest] В system-tests/.env не задан INFRA_ROOT. Задайте абсолютный путь к каталогу infrastructure (например: INFRA_ROOT=C:\\path\\to\\infrastructure).",
  );
  process.exit(3);
}

const deployEnvPath = path.join(infraRoot, "prod.test.env");
const devEnvPath = path.join(infraRoot, "dev.test.env");

if (profileInfo.stack === "dev" && !fs.existsSync(devEnvPath)) {
  console.error(
    `[run-vitest] Не найден ${devEnvPath}. Создайте копию: cp ${path.join(infraRoot, "dev.env")} ${devEnvPath} (или аналог для Windows).`,
  );
  process.exit(3);
}
if (profileInfo.stack === "prod" && !fs.existsSync(deployEnvPath)) {
  console.error(
    `[run-vitest] Не найден ${deployEnvPath}. Создайте копию: cp ${path.join(infraRoot, "prod.env")} ${deployEnvPath} (или аналог для Windows).`,
  );
  process.exit(3);
}

const deployEnv = parseEnvFile(deployEnvPath);
const devEnv = parseEnvFile(devEnvPath);

const stackDefaultBaseUrl = {
  local: "http://127.0.0.1:8081",
  dev: `http://${devEnv.DEV_BIND_HOST ?? "127.0.0.1"}:${devEnv.DEV_WEB_PORT ?? "8081"}`,
  prod: `http://${deployEnv.HTTP_BIND_HOST ?? "127.0.0.1"}:${deployEnv.HTTP_PORT ?? "80"}`,
};

const normalizeHost = (host) => {
  if (!host) return host;
  if (host === "0.0.0.0" || host === "::" || host === "[::]") return "127.0.0.1";
  return host;
};

const resolveBaseUrl = () => {
  const envBaseUrl =
    process.env.BASE_URL && process.env.BASE_URL !== "/" ? process.env.BASE_URL : undefined;
  const candidate =
    cliBaseUrl ?? envBaseUrl ?? stackDefaultBaseUrl[profileInfo.stack] ?? "http://127.0.0.1:8081";
  try {
    const parsed = new URL(candidate);
    parsed.hostname = normalizeHost(parsed.hostname);
    return parsed.toString();
  } catch {
    return "http://127.0.0.1:8081/";
  }
};

const composeFileForStack = (stack) => {
  if (stack === "prod") return path.join(infraRoot, "runtime", "docker-compose.yml");
  if (stack === "dev") return path.join(infraRoot, "runtime", "docker-compose.dev.yml");
  return null;
};

const preflightRuntime = (baseUrl) => {
  const composeFile = composeFileForStack(profileInfo.stack);
  if (!composeFile) return;

  const upArgs = ["compose", "-f", composeFile, "up", "-d", "--remove-orphans"];
  const up = spawnSync("docker", upArgs, { stdio: "inherit", cwd: repoRoot, env: process.env });
  if (up.status !== 0) {
    console.error("[run-vitest] Не удалось поднять docker-compose runtime");
    process.exit(up.status ?? 1);
  }

  const ps = spawnSync("docker", ["compose", "-f", composeFile, "ps"], {
    stdio: "inherit",
    cwd: repoRoot,
    env: process.env,
  });
  if (ps.status !== 0) {
    console.error("[run-vitest] Не удалось получить статус контейнеров");
    process.exit(ps.status ?? 1);
  }

  const waitProfiles = {
    short: { startupTimeoutSec: 45, intervalSec: 2, smokeTimeoutSec: 8 },
    normal: { startupTimeoutSec: 120, intervalSec: 2, smokeTimeoutSec: 10 },
    long: { startupTimeoutSec: 240, intervalSec: 3, smokeTimeoutSec: 15 },
  };
  const effectiveWait = waitProfiles[waitProfile] ?? waitProfiles.normal;

  const listContainers = spawnSync(
    "docker",
    ["compose", "-f", composeFile, "ps", "-q"],
    { stdio: "pipe", encoding: "utf8", cwd: repoRoot, env: process.env },
  );
  if (listContainers.status !== 0) {
    console.error("[run-vitest] Не удалось получить id контейнеров для ожидания health");
    process.exit(listContainers.status ?? 1);
  }
  const containerIds = listContainers.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (containerIds.length === 0) {
    console.error("[run-vitest] После docker compose up не найдено контейнеров");
    process.exit(1);
  }

  const startedAt = Date.now();
  let allReady = false;
  while (!allReady) {
    allReady = true;
    for (const containerId of containerIds) {
      const inspect = spawnSync(
        "docker",
        [
          "inspect",
          "--format",
          "{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}",
          containerId,
        ],
        { stdio: "pipe", encoding: "utf8", cwd: repoRoot, env: process.env },
      );
      if (inspect.status !== 0) {
        console.error(`[run-vitest] Не удалось проверить состояние контейнера ${containerId}`);
        process.exit(inspect.status ?? 1);
      }
      const status = inspect.stdout.trim();
      const isReady = status === "healthy" || status === "running";
      if (!isReady) {
        allReady = false;
        break;
      }
    }

    if (allReady) break;

    const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
    if (elapsedSec >= effectiveWait.startupTimeoutSec) {
      console.error(
        `[run-vitest] Контейнеры не перешли в healthy/running за ${effectiveWait.startupTimeoutSec}s (profile=${waitProfile})`,
      );
      const psAfterTimeout = spawnSync("docker", ["compose", "-f", composeFile, "ps"], {
        stdio: "inherit",
        cwd: repoRoot,
        env: process.env,
      });
      process.exit(psAfterTimeout.status ?? 1);
    }

    spawnSync("sleep", [String(effectiveWait.intervalSec)], {
      stdio: "inherit",
      cwd: repoRoot,
      env: process.env,
    });
  }

  const smoke = spawnSync(
    "curl",
    [
      "-fsS",
      "--max-time",
      String(effectiveWait.smokeTimeoutSec),
      new URL("/healthcheck", baseUrl).toString(),
    ],
    {
      stdio: "inherit",
      cwd: repoRoot,
      env: process.env,
    },
  );
  if (smoke.status !== 0) {
    console.error("[run-vitest] Healthcheck не отвечает для целевого BASE_URL");
    process.exit(smoke.status ?? 1);
  }

  if (profileInfo.mode === "ui") {
    const adminSmoke = spawnSync(
      "curl",
      [
        "-fsS",
        "--max-time",
        String(effectiveWait.smokeTimeoutSec),
        "-o",
        "/dev/null",
        "-w",
        "%{http_code}",
        new URL("/admin/login", baseUrl).toString(),
      ],
      {
        stdio: "pipe",
        encoding: "utf8",
        cwd: repoRoot,
        env: process.env,
      },
    );
    if (adminSmoke.status !== 0 || adminSmoke.stdout.trim() !== "200") {
      console.error("[run-vitest] /admin/login не готов для UI-профиля");
      process.exit(1);
    }
  }
};

const baseUrl = resolveBaseUrl();
preflightRuntime(baseUrl);
console.log(
  `[run-vitest] profile=${profile} stack=${profileInfo.stack} baseUrl=${baseUrl}`,
);

const env = {
  ...process.env,
  BASE_URL: baseUrl,
  TEST_BASE_URL: baseUrl,
  TEST_PROFILE: profile,
  TEST_MODE: profileInfo.mode,
  TEST_STACK: profileInfo.stack,
  TEST_UI_HEADED: profileInfo.headed,
};

const testTargets =
  profileInfo.mode === "quick"
    ? ["cases"]
    : ["cases", "ui"];

const passThroughArgs = [];
for (let i = 0; i < rawArgs.length; i += 1) {
  const arg = rawArgs[i];
  if (arg === "--profile" || arg === "--base-url") {
    i += 1;
    continue;
  }
  if (arg.startsWith("--profile=") || arg.startsWith("--base-url=")) {
    continue;
  }
  passThroughArgs.push(arg);
}

const result = spawnSync(
  process.execPath,
  [
    fileURLToPath(new URL("../node_modules/vitest/vitest.mjs", import.meta.url)),
    "run",
    "--config",
    "vitest.config.ts",
    ...testTargets,
    ...passThroughArgs,
  ],
  {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    stdio: "inherit",
    env,
  },
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
