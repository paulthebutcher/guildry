import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/__tests__/**/*.test.{ts,tsx}", "**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./apps/web"),
      "@guildry/ai": path.resolve(__dirname, "./packages/ai/src"),
      "@guildry/database": path.resolve(__dirname, "./packages/database/src"),
      "@guildry/ui": path.resolve(__dirname, "./packages/ui/src"),
    },
  },
});
