import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Run like the server on Vercel (UTC), so time zone bugs show up in tests.
process.env.TZ = "UTC";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.js"],
    environment: "node",
  },
});
