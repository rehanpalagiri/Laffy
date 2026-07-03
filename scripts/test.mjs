import { startVitest } from "vitest/node";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const srcPath = fileURLToPath(new URL("../src", import.meta.url));
const watch = process.argv.includes("--watch");

const ctx = await startVitest(
  "test",
  [],
  {
    root,
    config: false,
    watch,
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  {
    plugins: [react()],
    resolve: { alias: { "@": srcPath } },
  },
);

if (!watch) {
  await ctx.close();
  const failedFiles = ctx.state.getFiles().filter((file) => file.result?.state === "fail");
  const errors = ctx.state.getUnhandledErrors();
  if (failedFiles.length > 0 || errors.length > 0) process.exit(1);
}
