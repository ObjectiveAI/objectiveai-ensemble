import { defineConfig, Options } from "tsup";
import path from "path";

// Base configuration shared between formats
const baseConfig: Options = {
  entry: ["src/index.ts"],
  dts: true,
  outDir: "dist",
  treeshake: true,
  target: "es2020",
  esbuildOptions(options) {
    options.alias = {
      src: path.resolve(__dirname, "src"),
    };
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
]);
