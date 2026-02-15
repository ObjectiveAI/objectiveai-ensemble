// Test CommonJS import — top-level namespace
const ObjectiveAI = require("../dist/index.cjs");

console.log("Testing CommonJS...");

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

// Test CommonJS subpath imports
const Functions = require("../dist/functions/index.cjs");
if (typeof Functions !== "object" || Functions === null || Object.keys(Functions).length === 0) {
  console.log("  ✗ Functions subpath import failed");
  process.exit(1);
}
console.log("  ✓ Functions subpath import works");

const Expression = require("../dist/functions/expression/index.cjs");
if (typeof Expression !== "object" || Expression === null || Object.keys(Expression).length === 0) {
  console.log("  ✗ Functions/Expression subpath import failed");
  process.exit(1);
}
console.log("  ✓ Functions/Expression subpath import works");

const EnsembleLlm = require("../dist/ensemble_llm/index.cjs");
if (typeof EnsembleLlm !== "object" || EnsembleLlm === null || Object.keys(EnsembleLlm).length === 0) {
  console.log("  ✗ EnsembleLlm subpath import failed");
  process.exit(1);
}
console.log("  ✓ EnsembleLlm subpath import works");

const Chat = require("../dist/chat/index.cjs");
if (typeof Chat !== "object" || Chat === null || Object.keys(Chat).length === 0) {
  console.log("  ✗ Chat subpath import failed");
  process.exit(1);
}
console.log("  ✓ Chat subpath import works");

const Vector = require("../dist/vector/index.cjs");
if (typeof Vector !== "object" || Vector === null || Object.keys(Vector).length === 0) {
  console.log("  ✗ Vector subpath import failed");
  process.exit(1);
}
console.log("  ✓ Vector subpath import works");

const Ensemble = require("../dist/ensemble/index.cjs");
if (typeof Ensemble !== "object" || Ensemble === null || Object.keys(Ensemble).length === 0) {
  console.log("  ✗ Ensemble subpath import failed");
  process.exit(1);
}
console.log("  ✓ Ensemble subpath import works");

console.log("CommonJS: PASSED");
