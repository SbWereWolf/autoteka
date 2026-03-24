import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ mode, command }) => {
  const env = {
    ...loadEnv(mode, process.cwd(), ""),
    ...process.env,
  };

  const frontendPort = Number(
    env.FRONTEND_PORT || env.VITE_PORT || 5173,
  );
  const hmrHost = env.FRONTEND_HMR_HOST || undefined;
  const hmrPort = env.FRONTEND_HMR_PORT
    ? Number(env.FRONTEND_HMR_PORT)
    : undefined;
  const hmrProtocol = env.FRONTEND_HMR_PROTOCOL || undefined;
  const buildSourcemap =
    (env.VITE_BUILD_SOURCEMAP || "false").toLowerCase() === "true";
  const cacheDir = env.VITE_CACHE_DIR || "node_modules/.vite";

  return {
    cacheDir,
    plugins: [
      vue(),
    ].filter(Boolean),
    server: {
      host: "0.0.0.0",
      port: frontendPort,
      strictPort: true,
      hmr:
        hmrHost || hmrPort || hmrProtocol
          ? {
              host: hmrHost,
              port: hmrPort,
              clientPort: hmrPort,
              protocol: hmrProtocol,
            }
          : undefined,
    },
    preview: {
      host: "0.0.0.0",
      port: Number(env.FRONTEND_PREVIEW_PORT || 4173),
      strictPort: true,
    },
    build: {
      sourcemap: buildSourcemap,
    },
  };
});