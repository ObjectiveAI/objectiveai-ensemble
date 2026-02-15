// Test ESM import — top-level namespace
import * as ObjectiveAI from "../dist/index.js";

console.log("Testing ESM...");

if (typeof ObjectiveAI !== "object" || ObjectiveAI === null) {
  console.log("  ✗ Failed to import module");
  process.exit(1);
}

const moduleExports = Object.keys(ObjectiveAI);

if (moduleExports.length === 0) {
  console.log("  ✗ Module has no exports");
  process.exit(1);
}

ObjectiveAI.EnsembleLlm.validate({
  model: "openai/gpt-5-nano",
  output_mode: "instruction",
});

console.log("  ✓ Top-level namespace import works");

// Test ESM subpath imports
import * as Functions from "../dist/functions/index.js";
if (typeof Functions !== "object" || Functions === null || Object.keys(Functions).length === 0) {
  console.log("  ✗ Functions subpath import failed");
  process.exit(1);
}
console.log("  ✓ Functions subpath import works");

import * as Expression from "../dist/functions/expression/index.js";
if (typeof Expression !== "object" || Expression === null || Object.keys(Expression).length === 0) {
  console.log("  ✗ Functions/Expression subpath import failed");
  process.exit(1);
}
console.log("  ✓ Functions/Expression subpath import works");

import * as EnsembleLlm from "../dist/ensemble_llm/index.js";
if (typeof EnsembleLlm !== "object" || EnsembleLlm === null || Object.keys(EnsembleLlm).length === 0) {
  console.log("  ✗ EnsembleLlm subpath import failed");
  process.exit(1);
}
console.log("  ✓ EnsembleLlm subpath import works");

import * as Chat from "../dist/chat/index.js";
if (typeof Chat !== "object" || Chat === null || Object.keys(Chat).length === 0) {
  console.log("  ✗ Chat subpath import failed");
  process.exit(1);
}
console.log("  ✓ Chat subpath import works");

import * as Vector from "../dist/vector/index.js";
if (typeof Vector !== "object" || Vector === null || Object.keys(Vector).length === 0) {
  console.log("  ✗ Vector subpath import failed");
  process.exit(1);
}
console.log("  ✓ Vector subpath import works");

import * as Ensemble from "../dist/ensemble/index.js";
if (typeof Ensemble !== "object" || Ensemble === null || Object.keys(Ensemble).length === 0) {
  console.log("  ✗ Ensemble subpath import failed");
  process.exit(1);
}
console.log("  ✓ Ensemble subpath import works");

console.log("ESM: PASSED");
