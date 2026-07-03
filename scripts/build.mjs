import { build } from "vite";
import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";
import { fileURLToPath } from "node:url";

const mode = process.argv[2] ?? "production";
const srcPath = fileURLToPath(new URL("../src", import.meta.url));

await build({
  root: fileURLToPath(new URL("..", import.meta.url)),
  mode,
  configFile: false,
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: { "@": srcPath },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
});
