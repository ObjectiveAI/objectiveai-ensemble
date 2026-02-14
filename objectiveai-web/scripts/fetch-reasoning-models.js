#!/usr/bin/env node

/**
 * Fetches reasoning-capable models from OpenRouter API
 * Generates public/reasoning-models.json for runtime consumption
 * Run during build process (npm run build via prebuild script)
 */

const fs = require('fs');
const path = require('path');

/**
 * Fetches reasoning models from OpenRouter API
 * @returns {Promise<Array>} Array of reasoning models
 */
async function fetchReasoningModels() {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    console.warn(
      '⚠️  No OPENROUTER_API_KEY found in environment. Using previous reasoning-models.json...'
    );
    return loadPreviousModels();
  }

  try {
    console.log('📡 Fetching models from OpenRouter API...');
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}` }
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const { data } = await response.json();

    // Filter for reasoning-capable models
    const reasoningModels = data.filter(m =>
      m.supported_parameters?.includes('reasoning') ||
      m.supported_parameters?.includes('include_reasoning') ||
      m.supported_parameters?.includes('reasoning_effort')
    );

    console.log(`✅ Found ${reasoningModels.length} reasoning-capable models from OpenRouter`);

    // Curate: Select 2 models per provider (affordable + premium)
    const curated = curateModels(reasoningModels);

    return curated.map(m => ({
      value: m.id,
      label: formatLabel(m.name),
      provider: getProvider(m.id),
      tier: getTier(m),
      pricing: {
        prompt: parseFloat(m.pricing.prompt),
        completion: parseFloat(m.pricing.completion)
      }
    }));
  } catch (error) {
    console.error('❌ Error fetching from OpenRouter:', error.message);
    console.log('   Falling back to previous reasoning-models.json...');
    return loadPreviousModels();
  }
}

/**
 * Curates models to 2 per provider
 * @param {Array} models - Array of models from OpenRouter
 * @returns {Array} Curated models
 */
function curateModels(models) {
  const byProvider = {
    openai: models.filter(m => m.id.startsWith('openai/')),
    google: models.filter(m => m.id.startsWith('google/')),
    anthropic: models.filter(m => m.id.startsWith('anthropic/'))
  };

  const curated = [];

  // OpenAI: Select cheapest + mid-tier (exclude top-tier like o1)
  if (byProvider.openai.length > 0) {
    const openaiSorted = byProvider.openai.sort((a, b) =>
      parseFloat(a.pricing.prompt) - parseFloat(b.pricing.prompt)
    );
    curated.push(openaiSorted[0]); // Cheapest
    const midTier = openaiSorted.find(m => !m.id.includes('o1') && !m.id.includes('mini') && m !== openaiSorted[0]);
    if (midTier) curated.push(midTier);
    else if (openaiSorted.length > 1) curated.push(openaiSorted[1]);
  }

  // Google: Select Gemini Flash + Pro tier
  if (byProvider.google.length > 0) {
    const geminiFlash = byProvider.google.find(m => m.id.includes('flash'));
    const geminiPro = byProvider.google.find(m => m.id.includes('pro') && !m.id.includes('ultra'));
    if (geminiFlash) curated.push(geminiFlash);
    if (geminiPro) curated.push(geminiPro);
  }

  // Anthropic: Select Haiku + Sonnet (exclude Opus for cost)
  if (byProvider.anthropic.length > 0) {
    const claudeHaiku = byProvider.anthropic.find(m => m.id.includes('haiku'));
    const claudeSonnet = byProvider.anthropic.find(m => m.id.includes('sonnet') && !m.id.includes('opus'));
    if (claudeHaiku) curated.push(claudeHaiku);
    if (claudeSonnet) curated.push(claudeSonnet);
  }

  return curated.filter(Boolean);
}

/**
 * Formats label from OpenRouter name
 * @param {string} name - Model name from OpenRouter
 * @returns {string} Formatted label
 */
function formatLabel(name) {
  // "OpenAI: GPT-5 Mini" → "GPT-5 Mini"
  return name.replace(/^(OpenAI|Google|Anthropic):\s*/i, '');
}

/**
 * Gets provider from model ID
 * @param {string} id - Model ID
 * @returns {string} Provider name
 */
function getProvider(id) {
  if (id.startsWith('openai/')) return 'OpenAI';
  if (id.startsWith('google/')) return 'Google';
  if (id.startsWith('anthropic/')) return 'Anthropic';
  return 'Other';
}

/**
 * Determines tier based on pricing
 * @param {Object} model - Model object with pricing
 * @returns {string} Tier ('affordable' or 'premium')
 */
function getTier(model) {
  const prompt = parseFloat(model.pricing.prompt);
  // Threshold: $5 per 1M tokens (0.000005) separates affordable from premium
  return prompt < 0.000005 ? 'affordable' : 'premium';
}

/**
 * Loads previous models from JSON file
 * @returns {Array} Previous models or fallback Claude models
 */
function loadPreviousModels() {
  const jsonPath = path.join(__dirname, '../public/reasoning-models.json');
  if (fs.existsSync(jsonPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      console.log(`   ✅ Loaded ${data.models.length} models from previous reasoning-models.json`);
      return data.models;
    } catch (error) {
      console.error('   ❌ Error parsing previous reasoning-models.json:', error.message);
    }
  }

  // Ultimate fallback: minimal Claude models
  console.log('   ⚠️  Using minimal Claude fallback (Haiku + Sonnet)');
  return [
    {
      value: 'anthropic/claude-haiku-4.5',
      label: 'Claude Haiku 4.5',
      provider: 'Anthropic',
      tier: 'affordable',
      pricing: { prompt: 0.000001, completion: 0.000005 }
    },
    {
      value: 'anthropic/claude-sonnet-4.5',
      label: 'Claude Sonnet 4.5',
      provider: 'Anthropic',
      tier: 'premium',
      pricing: { prompt: 0.000003, completion: 0.000015 }
    }
  ];
}

/**
 * Main function
 */
async function main() {
  console.log('🔨 Generating reasoning models list for function detail page...\n');

  const models = await fetchReasoningModels();

  // Determine default: prefer Google Gemini Flash if available, otherwise first affordable model
  const defaultModel =
    models.find(m => m.provider === 'Google' && m.tier === 'affordable')?.value ||
    models.find(m => m.tier === 'affordable')?.value ||
    models[0]?.value ||
    'anthropic/claude-haiku-4.5';

  const output = {
    generated_at: new Date().toISOString(),
    default_model: defaultModel,
    models: models
  };

  const jsonPath = path.join(__dirname, '../public/reasoning-models.json');
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2) + '\n');

  console.log(`\n✅ Generated ${jsonPath}`);
  console.log(`   - ${models.length} reasoning models total`);
  console.log(`   - Default: ${output.default_model}`);
  console.log(`   - Generated: ${output.generated_at}\n`);
}

main().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
