/**
 * CreativeDirector.js
 * AI-powered creative direction generation.
 * Synthesizes product data + market research → actionable creative brief.
 */

import { gemini } from './GeminiClient.js';

/**
 * Generate a creative direction brief.
 *
 * @param {object} productData    - Extracted product data
 * @param {object} marketResearch - Market research results
 * @param {object} brandProfile   - Fixed brand assets and identity
 * @returns {CreativeDirection}
 */
export async function generateCreativeDirection(productData, marketResearch, brandProfile = {}) {
  const prompt = `You are a Creative Director at a world-class packaging design agency.

Based on the product data, market research, and brand information below, create an original and compelling creative direction for packaging design.

PRODUCT DATA:
${JSON.stringify({
  brand: productData.brand,
  productName: productData.productName,
  productCategory: productData.productCategory,
  tagline: productData.tagline,
  targetAudience: productData.targetAudience,
  productPositioning: productData.productPositioning,
  keyBenefits: productData.keyBenefits?.en,
  claims: productData.claims?.en,
  productSize: productData.productSize,
  weight: productData.weight,
  volume: productData.volume,
}, null, 2)}

MARKET RESEARCH INSIGHT:
${marketResearch.overallInsight || ''}

DIFFERENTIATION OPPORTUNITY:
${marketResearch.differentiation?.recommendedDirection || ''}

BRAND PROFILE:
- Company: ${brandProfile.companyName || 'Not specified'}
- Brand personality: ${brandProfile.brandPersonality || 'Not specified'}

Create a creative direction with these sections. Return JSON:
{
  "headline": "string (3-6 word creative theme/direction title)",
  "concept": "string (2-3 sentence creative concept statement)",
  "targetAudience": {
    "primary": "string",
    "psychographic": "string",
    "shoppingContext": "string"
  },
  "brandPositioning": "string",
  "colorDirection": {
    "primary": "string (specific hex color with reasoning)",
    "secondary": "string (specific hex color with reasoning)",
    "accent": "string (specific hex color with reasoning)",
    "background": "string (specific hex color with reasoning)",
    "palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
    "colorReasoning": "string"
  },
  "typographyDirection": {
    "primaryFont": "string (Google Font name — professional, available)",
    "secondaryFont": "string (Google Font name — for body/Arabic support)",
    "fontReasoning": "string",
    "hierarchy": "string"
  },
  "visualLanguage": {
    "style": "string (e.g. Premium Minimal, Bold Modern, Clean Medical, Natural Organic)",
    "graphicElements": "string",
    "photography": "string",
    "texture": "string",
    "pattern": "string"
  },
  "frontPanelStrategy": "string",
  "backPanelStrategy": "string",
  "differentiationRationale": "string",
  "moodKeywords": ["string", "string", "string", "string", "string"],
  "thingsToAvoid": ["string", "string", "string"]
}

Be specific and actionable. The colors must be precise hex values.
The fonts must be available on Google Fonts.
The direction must be genuinely differentiated from market norms.`;

  const result = await gemini.generateJson(prompt, {
    temperature: 0.75,
    maxOutputTokens: 3000,
  });

  return result;
}

/**
 * Generate 2 or 4 distinct concept variations from the approved creative direction.
 *
 * Each concept must have genuinely different creative direction,
 * NOT just color swaps of the same layout.
 */
export async function generateConceptVariations(approvedDirection, count = 4) {
  const prompt = `You are a Creative Director generating ${count} distinct packaging design concepts.

APPROVED CREATIVE DIRECTION:
${JSON.stringify(approvedDirection, null, 2)}

Generate exactly ${count} DISTINCT concept variations. Each must have a genuinely different creative direction — different style, different visual language, different emotional tone. Not just different colors.

Example themes to use (choose ${count} different ones):
- PREMIUM: Luxury materials, gold accents, understated elegance, high-end typography
- MODERN: Bold geometry, clean minimalism, Swiss-style grid, contemporary sans-serif
- MEDICAL/CLINICAL: Clean white, trustworthy blue, scientific precision, clinical authority  
- NATURAL: Earth tones, organic textures, hand-drawn elements, botanical feel
- BOLD/ENERGETIC: High contrast, strong typography, vibrant color blocking, impact-first
- MINIMAL: White space, restrained color, refined elegance, negative space as design
- TRADITIONAL: Heritage cues, established trust, classic serif typography, timeless feel
- CONTEMPORARY: Gradient richness, modern duotone, lifestyle photography, youth-oriented

Return JSON array of ${count} concept objects:
[
  {
    "id": "concept-1",
    "name": "string (e.g. 'Elevated Premium')",
    "theme": "string (single theme keyword)",
    "tagline": "string (2-4 words capturing the feeling)",
    "concept": "string (1 sentence description)",
    "colorPalette": {
      "primary": "#hex",
      "secondary": "#hex",
      "accent": "#hex",
      "background": "#hex",
      "text": "#hex",
      "all": ["#hex1", "#hex2", "#hex3", "#hex4"]
    },
    "typography": {
      "heading": "string (Google Font name)",
      "body": "string (Google Font name)",
      "size_heading": "number (pt)",
      "size_body": "number (pt)"
    },
    "frontPanel": {
      "bgType": "solid|gradient|pattern|image",
      "bgValue": "string (color or gradient CSS or description)",
      "logoPosition": "top-left|top-center|top-right",
      "productNameStyle": "string (bold large|elegant italic|minimal etc.)",
      "graphicElement": "string (describe the key graphic element)"
    },
    "backPanel": {
      "bgColor": "#hex",
      "sectionStyle": "string (how info sections look)",
      "barcodePosition": "bottom-right|bottom-left|bottom-center"
    },
    "visualStyle": "string",
    "differentiator": "string (what makes this unique)"
  }
]`;

  const result = await gemini.generateJson(prompt, {
    temperature: 0.85, // Higher creativity for concepts
    maxOutputTokens: 4096,
  });

  return Array.isArray(result) ? result.slice(0, count) : result;
}
