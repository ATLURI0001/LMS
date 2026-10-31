import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": {
          target: process.env.API_URL || env.API_URL || "http://127.0.0.1:8000",
          changeOrigin: false,
        },
      },
    },
    preview: { port: 4173 },
  };
});
