import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  base: mode === "development" ? "/" : "/ambar-site/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"]
        }
      }
    }
  }
}));
