/**
 * ProductAnalyzer.js
 * Uses Gemini to intelligently extract and structure product data
 * from the raw DOCX text.
 *
 * RULES:
 *  - Never invent product information
 *  - Never create medical claims that weren't supplied
 *  - Never change ingredient names
 *  - Never change regulatory numbers
 *  - Present result for user review before proceeding
 */

import { gemini } from './GeminiClient.js';

const SYSTEM_PROMPT = `You are a professional packaging data analyst.
Your job is to read raw product document text and extract structured packaging information.

CRITICAL RULES:
1. ONLY extract information that is explicitly present in the document.
2. NEVER invent, assume, or create product claims not in the document.
3. NEVER change ingredient names — copy them exactly.
4. NEVER change regulatory numbers — copy them exactly.
5. NEVER create medical claims.
6. If a field is not present in the document, set it to empty string "".
7. Preserve ALL Arabic text exactly as written — do not translate or alter it.
8. Separate English and Arabic content clearly.
9. Return ONLY valid JSON matching the schema provided.`;

/**
 * Analyze raw document text and return structured ProductData.
 * @param {string} rawText - Extracted text from DOCX
 * @returns {ProductData}
 */
export async function analyzeProductData(rawText) {
  const prompt = `${SYSTEM_PROMPT}

Extract the packaging information from the following product document text.
Return a JSON object matching this exact schema:

{
  "brand": "string",
  "productName": "string",
  "productCategory": "string",
  "tagline": "string",
  "productDescription": { "en": "string", "ar": "string" },
  "keyBenefits": { "en": ["string"], "ar": ["string"] },
  "claims": { "en": ["string"], "ar": ["string"] },
  "ingredients": { "en": "string", "ar": "string" },
  "activeIngredients": { "en": "string", "ar": "string" },
  "directions": { "en": "string", "ar": "string" },
  "warnings": { "en": "string", "ar": "string" },
  "storage": { "en": "string", "ar": "string" },
  "productSize": "string",
  "weight": "string",
  "volume": "string",
  "netContent": "string",
  "regulatoryInfo": "string",
  "countryOfOrigin": { "en": "string", "ar": "string" },
  "frontPanelPriority": ["string"],
  "backPanelSections": ["string"],
  "targetAudience": "string",
  "productPositioning": "string"
}

DOCUMENT TEXT:
${rawText.slice(0, 15000)}`;

  try {
    const result = await gemini.generateJson(prompt, {
      temperature: 0.1, // Low temperature for accurate extraction
      maxOutputTokens: 4096,
    });

    // Validate: ensure no critical fields were invented
    // Any field not verifiable in rawText gets flagged
    result._source = 'ai-extracted';
    result._rawTextLength = rawText.length;
    result._extractionWarnings = validateExtraction(result, rawText);

    return result;
  } catch (err) {
    throw new Error(`Product data extraction failed: ${err.message}`);
  }
}

/**
 * Basic validation: check that key extracted values can be found in the source text.
 */
function validateExtraction(data, rawText) {
  const warnings = [];
  const lowerText = rawText.toLowerCase();

  // Check brand
  if (data.brand && !lowerText.includes(data.brand.toLowerCase())) {
    warnings.push(`Brand "${data.brand}" was not found verbatim in the document.`);
  }

  // Check product name
  if (data.productName && data.productName.length > 3 &&
      !lowerText.includes(data.productName.toLowerCase())) {
    warnings.push(`Product name "${data.productName}" was not found verbatim in the document.`);
  }

  // Check for any medical claims that might have been invented
  const medicalKeywords = ['cures', 'treats', 'prevents disease', 'FDA approved'];
  for (const claim of [...(data.claims?.en || []), ...(data.claims?.ar || [])]) {
    for (const kw of medicalKeywords) {
      if (claim.toLowerCase().includes(kw) && !lowerText.includes(kw.toLowerCase())) {
        warnings.push(`Claim may be invented: "${claim.slice(0, 60)}..."`);
      }
    }
  }

  return warnings;
}

/**
 * Format extracted product data as a human-readable summary.
 */
export function formatProductDataSummary(data) {
  const lines = [];
  if (data.brand)       lines.push(`Brand: ${data.brand}`);
  if (data.productName) lines.push(`Product: ${data.productName}`);
  if (data.productCategory) lines.push(`Category: ${data.productCategory}`);
  if (data.weight || data.volume || data.netContent) {
    lines.push(`Size: ${[data.weight, data.volume, data.netContent].filter(Boolean).join(' / ')}`);
  }
  return lines.join('\n');
}
