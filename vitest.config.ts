import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      {
        find: "@prisma/client",
        replacement: path.resolve(__dirname, "./node_modules/@prisma/client"),
      },
      {
        find: "server-only",
        replacement: path.resolve(__dirname, "./__mocks__/server-only.ts"),
      },
    ],
  },
  test: {
    globals: true,
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost:3737",
      },
    },
    setupFiles: ["./vitest.polyfills.ts", "./vitest.setup.ts"],
    clearMocks: true,
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage",
    },
    exclude: ["e2e/**", "node_modules/**"],
    server: {
      deps: {
        inline: [/@prisma/, /@clerk/, /@next/, /jose/],
      },
    },
  },
});
