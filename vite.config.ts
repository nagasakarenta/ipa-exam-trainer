/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages のサブパスでも動くように相対パスで出力する（ルーティングは HashRouter）
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    // 問題集（約 500KB の JSON）をバンドルに同梱するため、既定の 500KB 警告を緩める
    chunkSizeWarningLimit: 1200,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
