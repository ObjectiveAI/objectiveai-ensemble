import { defineConfig, Options } from "tsup";
import path from "path";

// Base configuration shared between formats
const baseConfig: Options = {
  entry: ["src/index.ts"],
  dts: true,
  outDir: "dist",
  treeshake: true,
  target: "node18",
  platform: "node",
  esbuildOptions(options) {
    options.alias = {
      src: path.resolve(__dirname, "src"),
      assets: path.resolve(__dirname, "assets"),
    };
  },
  loader: {
    ".txt": "text",
  },
};

export default defineConfig([
  // ESM build
  {
    ...baseConfig,
    format: ["esm"],
    outExtension: () => ({ js: ".js" }),
    clean: true,
  },
  // CJS build
  {
    ...baseConfig,
    format: ["cjs"],
    outExtension: () => ({ js: ".cjs" }),
    clean: false,
    dts: false,
  },
  // CLI build
  {
    ...baseConfig,
    entry: ["src/cli.ts"],
    format: ["esm"],
    outExtension: () => ({ js: ".js" }),
    clean: false,
    dts: false,
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
  // Worker build
  {
    ...baseConfig,
    entry: ["src/worker/inventWorker.ts"],
    format: ["esm"],
    outExtension: () => ({ js: ".js" }),
    clean: false,
    dts: false,
  },
]);
