import { spawnSync } from "node:child_process";
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
const stackDefaultBaseUrl = {
  local: "http://127.0.0.1:8081",
  dev: "http://127.0.0.1:8081",
  prod: "http://127.0.0.1:8083",
};

const resolveBaseUrl = () => {
  const envBaseUrl =
    process.env.BASE_URL && process.env.BASE_URL !== "/"
      ? process.env.BASE_URL
      : undefined;
  const candidate =
    cliBaseUrl ??
    stackDefaultBaseUrl[profileInfo.stack] ??
    envBaseUrl ??
    "http://127.0.0.1:8081";
  try {
    return new URL(candidate).toString();
  } catch {
    if (candidate.startsWith("/")) return new URL(candidate, "http://127.0.0.1:8081").toString();
    return "http://127.0.0.1:8081";
  }
};

const baseUrl = resolveBaseUrl();
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
