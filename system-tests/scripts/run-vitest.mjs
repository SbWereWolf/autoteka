/**
 * Запуск system-tests (Vitest) с подготовкой стека.
 *
 * Профиль ui-headless-dev + stack dev + FRONTEND_MODE=source: на хосте поднимается
 * `npm run dev` (Vite), а в env compose прокидывается FRONTEND_UPSTREAM_* — nginx в
 * контейнере проксирует на этот dev-сервер (HMR). Без остановки дочернего процесса
 * после прогона остаётся висящий Node/npm.
 *
 * Teardown (process.on('exit')) останавливает host Vite и при необходимости
 * выполняет `docker compose down` для того же compose-файла, что поднимался в
 * preflight; хвосты, которые нельзя гарантированно убрать, печатаются в stderr.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const nullDevice = os.platform() === "win32" ? "NUL" : "/dev/null";

/** @type {string[]} */
const teardownManualHints = [];

let activeComposeFileForCleanup = null;
/** @type {Record<string, string> | null} */
let composeEnvSnapshotForDown = null;
let composeStackWentUpForCleanup = false;

const rawArgs = process.argv.slice(2);

const getArgValue = (name) => {
  const pref = `${name}=`;
  const direct = rawArgs.find((arg) => arg.startsWith(pref));
  if (direct) return direct.slice(pref.length);
  const idx = rawArgs.indexOf(name);
  if (idx >= 0 && rawArgs[idx + 1]) return rawArgs[idx + 1];
  return undefined;
};

const cliBaseUrl = getArgValue("--base-url");

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

const fail = (message) => {
  console.error(message);
  process.exit(3);
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

const requireFromSystemTestsEnv = (key) => {
  const value = systemTestsEnv[key]?.trim();
  if (!value) {
    fail(
      `[run-vitest] В system-tests/.env не задан ${key}. Скопируйте ключ из system-tests/example.env и задайте значение.`,
    );
  }
  return value;
};

const requirePositiveIntFromSystemTestsEnv = (key) => {
  const raw = requireFromSystemTestsEnv(key);
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) {
    fail(
      `[run-vitest] В system-tests/.env переменная ${key} должна быть положительным целым числом (сейчас: ${raw}).`,
    );
  }
  return n;
};

const dockerStartupTimeoutSec = requirePositiveIntFromSystemTestsEnv(
  "SYSTEM_TESTS_DOCKER_STARTUP_TIMEOUT_SEC",
);
const dockerPollIntervalSec = requirePositiveIntFromSystemTestsEnv(
  "SYSTEM_TESTS_DOCKER_POLL_INTERVAL_SEC",
);
const curlMaxTimeSec = requirePositiveIntFromSystemTestsEnv("SYSTEM_TESTS_CURL_MAX_TIME_SEC");
const hostFrontendReadyTimeoutSec = requirePositiveIntFromSystemTestsEnv(
  "SYSTEM_TESTS_HOST_FRONTEND_READY_TIMEOUT_SEC",
);
const hostFrontendPollIntervalSec = requirePositiveIntFromSystemTestsEnv(
  "SYSTEM_TESTS_HOST_FRONTEND_POLL_INTERVAL_SEC",
);
const viteDevBindHost = requireFromSystemTestsEnv("SYSTEM_TESTS_VITE_DEV_BIND_HOST");
const viteDevUrlHost = requireFromSystemTestsEnv("SYSTEM_TESTS_VITE_DEV_URL_HOST");
const frontendUpstreamHost = requireFromSystemTestsEnv("SYSTEM_TESTS_FRONTEND_UPSTREAM_HOST");
const localBaseUrl = requireFromSystemTestsEnv("SYSTEM_TESTS_LOCAL_BASE_URL");
const hostFrontendPort = requirePositiveIntFromSystemTestsEnv("AUTOTEKA_DEV_FRONTEND_PORT");

const profile =
  getArgValue("--profile")?.trim() ||
  requireFromSystemTestsEnv("AUTOTEKA_SYSTEM_TESTS_PROFILE").trim();

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

const requireFromStackFile = (stackLabel, envObj, fileHint, key) => {
  const value = envObj[key]?.trim();
  if (!value) {
    fail(
      `[run-vitest] В ${fileHint} не задан ${key} (нужен для stack=${stackLabel}). Уберите пустое значение и задайте его явно.`,
    );
  }
  return value;
};

const isWindowsAbsolutePath = (value) => /^[A-Za-z]:[\\/]/.test(value);

const resolveEnvRootPath = (rawPath, label) => {
  if (!rawPath) return undefined;
  if (path.isAbsolute(rawPath)) return path.resolve(rawPath);
  if (process.platform !== "win32" && isWindowsAbsolutePath(rawPath)) {
    fail(
      `[run-vitest] ${label} задан Windows-путём в non-Windows среде: ${rawPath}. Синхронизируйте *.test.env под текущую платформу или подготовьте copy через scripts/agent/wsl-prepare-test-copy.sh.`,
    );
  }
  return path.resolve(rawPath);
};

const resolvePath = (basePath, targetPath) => {
  if (!targetPath) return undefined;
  if (path.isAbsolute(targetPath)) return path.resolve(targetPath);
  return path.resolve(basePath, targetPath);
};

const getRuntimeInstance = (stackEnvForProfile) => {
  const fromStack = stackEnvForProfile.RUN_INSTANCE?.trim();
  if (fromStack) return fromStack;
  const fromSystemTests = systemTestsEnv.RUN_INSTANCE?.trim();
  if (fromSystemTests) return fromSystemTests;
  fail(
    "[run-vitest] Не задан RUN_INSTANCE: добавьте в infrastructure/*.test.env или в system-tests/.env (см. system-tests/example.env).",
  );
};

const getResolvedRuntimeState = (stackEnvForProfile) => {
  const autotekaRootRaw = stackEnvForProfile.AUTOTEKA_ROOT?.trim();
  const infraRootRaw = stackEnvForProfile.INFRA_ROOT?.trim();
  const dbDatabaseRaw = stackEnvForProfile.DB_DATABASE?.trim();

  const autotekaRoot = autotekaRootRaw
    ? resolveEnvRootPath(autotekaRootRaw, "AUTOTEKA_ROOT")
    : undefined;
  const infraRootFromEnv = infraRootRaw
    ? resolveEnvRootPath(infraRootRaw, "INFRA_ROOT")
    : undefined;
  const dbBasePath = autotekaRoot
    ? path.join(autotekaRoot, "backend", "apps", "ShopOperator")
    : undefined;
  const resolvedDbPath =
    dbBasePath && dbDatabaseRaw ? resolvePath(dbBasePath, dbDatabaseRaw) : undefined;
  const mainDbPath = autotekaRoot
    ? path.resolve(autotekaRoot, "backend", "database", "database.sqlite")
    : undefined;
  const testDbPath = autotekaRoot
    ? path.resolve(autotekaRoot, "backend", "database", "database.test.sqlite")
    : undefined;

  return {
    instance: getRuntimeInstance(stackEnvForProfile),
    autotekaRoot,
    infraRootFromEnv,
    dbDatabaseRaw,
    resolvedDbPath,
    mainDbPath,
    testDbPath,
  };
};

const logTestRuntimeEnv = (stackEnvForProfile) => {
  if (profileInfo.stack === "local") return;

  const runtimeState = getResolvedRuntimeState(stackEnvForProfile);
  const dbConnection = stackEnvForProfile.DB_CONNECTION?.trim() ?? "<unset>";
  console.log(
    `[run-vitest] runtime instance=${runtimeState.instance} dbConnection=${dbConnection} dbPath=${runtimeState.resolvedDbPath ?? "<unset>"}`,
  );
};

const normalizeHost = (host) => {
  if (!host) return host;
  if (host === "0.0.0.0" || host === "::" || host === "[::]") return "127.0.0.1";
  return host;
};

const stackBaseUrlFromEnv = () => {
  if (profileInfo.stack === "local") {
    return localBaseUrl;
  }
  if (profileInfo.stack === "dev") {
    const host = requireFromStackFile("dev", devEnv, devEnvPath, "HTTP_BIND_IP");
    const port = requireFromStackFile("dev", devEnv, devEnvPath, "HTTP_PORT");
    return `http://${normalizeHost(host)}:${port}`;
  }
  const host = requireFromStackFile("prod", deployEnv, deployEnvPath, "HTTP_BIND_IP");
  const port = requireFromStackFile("prod", deployEnv, deployEnvPath, "HTTP_PORT");
  return `http://${normalizeHost(host)}:${port}`;
};

const resolveBaseUrl = () => {
  const envBaseUrl =
    process.env.BASE_URL && process.env.BASE_URL !== "/" ? process.env.BASE_URL : undefined;
  const candidate = cliBaseUrl ?? envBaseUrl ?? stackBaseUrlFromEnv();
  try {
    const parsed = new URL(candidate);
    parsed.hostname = normalizeHost(parsed.hostname);
    return parsed.toString();
  } catch {
    fail(`[run-vitest] Некорректный URL для BASE_URL/стека: ${candidate}`);
  }
};

const composeFileForStack = (stack) => {
  if (stack === "prod") return path.join(infraRoot, "runtime", "docker-compose.yml");
  if (stack === "dev") return path.join(infraRoot, "runtime", "docker-compose.dev.yml");
  return null;
};

const waitForHttpStatus = ({
  url,
  timeoutSec,
  intervalSec,
  expectedStatuses,
  label,
}) => {
  const startedAt = Date.now();

  while (true) {
    const response = spawnSync(
      "curl",
      [
        "-sS",
        "--max-time",
        String(curlMaxTimeSec),
        "-o",
        nullDevice,
        "-w",
        "%{http_code}",
        url,
      ],
      {
        stdio: "pipe",
        encoding: "utf8",
        cwd: repoRoot,
        env: process.env,
      },
    );

    const statusCode = response.stdout.trim();
    if (response.status === 0 && expectedStatuses.has(statusCode)) {
      return;
    }

    const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
    if (elapsedSec >= timeoutSec) {
      const printableStatus = statusCode || "<no-http-status>";
      console.error(
        `[run-vitest] ${label} не стал готов за ${timeoutSec}s: lastStatus=${printableStatus}`,
      );
      process.exit(1);
    }

    spawnSync("sleep", [String(intervalSec)], {
      stdio: "inherit",
      cwd: repoRoot,
      env: process.env,
    });
  }
};

const stackEnv = profileInfo.stack === "prod" ? deployEnv : devEnv;
logTestRuntimeEnv(stackEnv);

const composeEnv = {
  ...process.env,
  ...stackEnv,
};

const frontendModeForDev =
  profileInfo.stack === "dev"
    ? requireFromStackFile("dev", stackEnv, devEnvPath, "FRONTEND_MODE")
    : undefined;

const shouldUseHostFrontendDevServer =
  profile === "ui-headless-dev" &&
  profileInfo.stack === "dev" &&
  frontendModeForDev === "source";

if (shouldUseHostFrontendDevServer) {
  composeEnv.FRONTEND_UPSTREAM_HOST = frontendUpstreamHost;
  composeEnv.FRONTEND_UPSTREAM_PORT = String(hostFrontendPort);
}

let hostFrontendProcess = null;

const stopHostFrontendDevServer = () => {
  if (!hostFrontendProcess) {
    return;
  }
  const proc = hostFrontendProcess;
  hostFrontendProcess = null;
  try {
    const sig = process.platform === "win32" ? undefined : "SIGTERM";
    proc.kill(sig);
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err ? err.code : undefined;
    if (code === "ESRCH") {
      return;
    }
    console.error(
      `[run-vitest] teardown: не удалось отправить сигнал host Vite (pid=${proc.pid ?? "?"}): ${err instanceof Error ? err.message : String(err)}`,
    );
    teardownManualHints.push(
      `Завершите вручную дерево процессов npm/node, запущенное для Vite (порт ${hostFrontendPort}), если оно осталось.`,
    );
  }
};

const runTeardownOnExit = () => {
  stopHostFrontendDevServer();

  if (
    composeStackWentUpForCleanup &&
    activeComposeFileForCleanup &&
    composeEnvSnapshotForDown
  ) {
    const skipDown =
      String(process.env.SYSTEM_TESTS_SKIP_COMPOSE_DOWN ?? "").trim() === "1";
    if (skipDown) {
      teardownManualHints.push(
        `Задан SYSTEM_TESTS_SKIP_COMPOSE_DOWN=1 — контейнеры compose не останавливались. Файл: ${activeComposeFileForCleanup}. При необходимости: docker compose -f "${activeComposeFileForCleanup}" down`,
      );
    } else {
      const down = spawnSync(
        "docker",
        ["compose", "-f", activeComposeFileForCleanup, "down"],
        {
          stdio: "pipe",
          encoding: "utf8",
          cwd: repoRoot,
          env: composeEnvSnapshotForDown,
        },
      );
      if (down.status !== 0) {
        const tail = (down.stderr || down.stdout || "").trim();
        console.error(
          `[run-vitest] teardown: docker compose down завершился с кодом ${down.status ?? "?"}`,
        );
        if (tail) {
          console.error(tail);
        }
        teardownManualHints.push(
          `Не удалось выполнить docker compose down. Вручную: docker compose -f "${activeComposeFileForCleanup}" down`,
        );
      }
    }
  }

  if (teardownManualHints.length > 0) {
    console.error("[run-vitest] teardown: возможные хвосты прогона (ручная проверка):");
    for (const line of teardownManualHints) {
      console.error(`  - ${line}`);
    }
  }
};

process.on("exit", runTeardownOnExit);

const startHostFrontendDevServer = () => {
  if (!shouldUseHostFrontendDevServer || hostFrontendProcess) return;

  hostFrontendProcess = spawn(
    "npm",
    [
      "--prefix",
      "frontend",
      "run",
      "dev",
      "--",
      "--host",
      viteDevBindHost,
      "--port",
      String(hostFrontendPort),
    ],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        ...stackEnv,
        FRONTEND_PORT: String(hostFrontendPort),
      },
      stdio: "inherit",
    },
  );

  hostFrontendProcess.on("exit", (code, signal) => {
    if (hostFrontendProcess) {
      console.error(
        `[run-vitest] Host frontend dev server завершился раньше времени: code=${code ?? "<null>"} signal=${signal ?? "<null>"}`,
      );
    }
  });
};

const waitForHostFrontendDevServer = () => {
  if (!shouldUseHostFrontendDevServer) return;

  waitForHttpStatus({
    url: `http://${viteDevUrlHost}:${hostFrontendPort}/`,
    timeoutSec: hostFrontendReadyTimeoutSec,
    intervalSec: hostFrontendPollIntervalSec,
    expectedStatuses: new Set(["200"]),
    label: `host frontend / on ${hostFrontendPort}`,
  });

  waitForHttpStatus({
    url: `http://${viteDevUrlHost}:${hostFrontendPort}/@vite/client`,
    timeoutSec: hostFrontendReadyTimeoutSec,
    intervalSec: hostFrontendPollIntervalSec,
    expectedStatuses: new Set(["200"]),
    label: `host frontend /@vite/client on ${hostFrontendPort}`,
  });
};

const preflightRuntime = (baseUrl) => {
  const composeFile = composeFileForStack(profileInfo.stack);
  if (!composeFile) return;

  startHostFrontendDevServer();
  waitForHostFrontendDevServer();

  const upArgs = ["compose", "-f", composeFile, "up", "-d", "--remove-orphans"];
  const up = spawnSync("docker", upArgs, { stdio: "inherit", cwd: repoRoot, env: composeEnv });
  if (up.status !== 0) {
    console.error("[run-vitest] Не удалось поднять docker-compose runtime");
    process.exit(up.status ?? 1);
  }

  activeComposeFileForCleanup = composeFile;
  composeEnvSnapshotForDown = { ...process.env, ...composeEnv };
  composeStackWentUpForCleanup = true;

  const ps = spawnSync("docker", ["compose", "-f", composeFile, "ps"], {
    stdio: "inherit",
    cwd: repoRoot,
    env: composeEnv,
  });
  if (ps.status !== 0) {
    console.error("[run-vitest] Не удалось получить статус контейнеров");
    process.exit(ps.status ?? 1);
  }

  const listContainers = spawnSync(
    "docker",
    ["compose", "-f", composeFile, "ps", "-q"],
    { stdio: "pipe", encoding: "utf8", cwd: repoRoot, env: composeEnv },
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
        { stdio: "pipe", encoding: "utf8", cwd: repoRoot, env: composeEnv },
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
    if (elapsedSec >= dockerStartupTimeoutSec) {
      console.error(
        `[run-vitest] Контейнеры не перешли в healthy/running за ${dockerStartupTimeoutSec}s (SYSTEM_TESTS_DOCKER_STARTUP_TIMEOUT_SEC)`,
      );
      const psAfterTimeout = spawnSync("docker", ["compose", "-f", composeFile, "ps"], {
        stdio: "inherit",
        cwd: repoRoot,
        env: composeEnv,
      });
      process.exit(psAfterTimeout.status ?? 1);
    }

    spawnSync("sleep", [String(dockerPollIntervalSec)], {
      stdio: "inherit",
      cwd: repoRoot,
      env: composeEnv,
    });
  }

  waitForHttpStatus({
    url: new URL("/healthcheck", baseUrl).toString(),
    timeoutSec: dockerStartupTimeoutSec,
    intervalSec: dockerPollIntervalSec,
    expectedStatuses: new Set(["200", "204"]),
    label: "/healthcheck",
  });

  waitForHttpStatus({
    url: new URL("/up", baseUrl).toString(),
    timeoutSec: dockerStartupTimeoutSec,
    intervalSec: dockerPollIntervalSec,
    expectedStatuses: new Set(["200"]),
    label: "/up",
  });

  waitForHttpStatus({
    url: new URL("/api/v1/category-list", baseUrl).toString(),
    timeoutSec: dockerStartupTimeoutSec,
    intervalSec: dockerPollIntervalSec,
    expectedStatuses: new Set(["200"]),
    label: "/api/v1/category-list",
  });

  if (profileInfo.mode === "ui") {
    waitForHttpStatus({
      url: new URL("/admin/login", baseUrl).toString(),
      timeoutSec: dockerStartupTimeoutSec,
      intervalSec: dockerPollIntervalSec,
      expectedStatuses: new Set(["200"]),
      label: "/admin/login",
    });
    waitForHttpStatus({
      url: new URL("/", baseUrl).toString(),
      timeoutSec: dockerStartupTimeoutSec,
      intervalSec: dockerPollIntervalSec,
      expectedStatuses: new Set(["200"]),
      label: "/",
    });
  }
};

const baseUrl = resolveBaseUrl();

let exitCode = 1;

try {
  preflightRuntime(baseUrl);
  console.log(
    `[run-vitest] profile=${profile} stack=${profileInfo.stack} baseUrl=${baseUrl} db=${composeEnv.DB_DATABASE ?? "<unset>"} instance=${getRuntimeInstance(stackEnv)}`,
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
    exitCode = 1;
  } else {
    exitCode = result.status ?? 1;
  }
}

process.exit(exitCode);
