import { defineConfig, Options } from "tsup";
import path from "path";
import { inlineConvertPlugin } from "./scripts/esbuild-inline-convert";

// All module entry points for multi-file output
const entry = [
  "src/index.ts",
  "src/auth/index.ts",
  "src/chat/index.ts",
  "src/chat/completions/index.ts",
  "src/ensemble/index.ts",
  "src/ensemble_llm/index.ts",
  "src/functions/index.ts",
  "src/functions/expression/index.ts",
  "src/functions/executions/index.ts",
  "src/functions/profiles/index.ts",
  "src/functions/quality/index.ts",
  "src/vector/index.ts",
  "src/vector/completions/index.ts",
];

// Base configuration shared between formats
const baseConfig: Options = {
  entry,
  outDir: "dist",
  treeshake: true,
  target: "es2020",
  minify: false,
  keepNames: true,
  esbuildOptions(options) {
    options.alias = {
      src: path.resolve(__dirname, "src"),
    };
    // Preserve comments (legal comments + all others)
    options.legalComments = "inline";
  },
  esbuildPlugins: [inlineConvertPlugin()],
};

export default defineConfig([
  // ESM build — with splitting for shared chunk deduplication
  {
    ...baseConfig,
    format: ["esm"],
    splitting: true,
    outExtension: () => ({ js: ".js" }),
    clean: true,
    dts: true,
  },
  // CJS build
  {
    ...baseConfig,
    format: ["cjs"],
    splitting: false,
    outExtension: () => ({ js: ".cjs" }),
    clean: false,
    dts: false,
    // Copy wasm loader to dist after build
    async onSuccess() {
      const { cpSync } = await import("fs");
      const srcWasm = path.resolve(__dirname, "src", "wasm");
      const distWasm = path.resolve(__dirname, "dist", "wasm");
      cpSync(srcWasm, distWasm, { recursive: true });
      console.log("✓ Copied wasm files to dist/wasm/");
    },
  },
]);
