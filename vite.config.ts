import { defineConfig, loadEnv } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const configuredBase = env.VITE_BASE_PATH?.trim();
  const base = configuredBase ? `/${configuredBase.replace(/^\/+|\/+$/g, "")}/` : "/";
  return {
    base,
    build: {
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL("./index.html", import.meta.url)),
          admin: fileURLToPath(new URL("./admin/index.html", import.meta.url)),
        },
        output: {
          manualChunks: {
            three: ["three"],
          },
        },
      },
    },
  };
});
