import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    proxy: {
      // Proxy AnkiConnect API to avoid CORS issues
      "/api/anki": {
        target: "http://localhost:8765",
        changeOrigin: true,
        // Rewrite the path to remove /api/anki prefix
        rewrite: (path) => path.replace(/^\/api\/anki/, ""),
      },
    },
  },
});
