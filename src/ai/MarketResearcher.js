/**
 * MarketResearcher.js
 * AI-powered competitor and market research for a product category.
 *
 * Purpose: Understand the market to create BETTER, MORE DIFFERENTIATED designs.
 * NOT to copy competitor designs.
 */

import { gemini } from './GeminiClient.js';

/**
 * Research the market for a given product category.
 *
 * @param {object} productData  - Extracted product data
 * @param {string[]} referenceImageUris - Optional design reference image data URIs
 * @returns {MarketResearch}
 */
export async function performMarketResearch(productData, referenceImageUris = []) {
  const { brand, productName, productCategory, targetAudience, productPositioning } = productData;

  const categoryStr = productCategory || productName || 'consumer product';

  let prompt = `You are a senior brand strategist and packaging design director.

Perform a comprehensive market and competitor analysis for:
- Product Category: ${categoryStr}
- Brand: ${brand || 'Unknown brand'}
- Product: ${productName || 'Unknown product'}
- Target Audience: ${targetAudience || 'General consumer'}
- Positioning: ${productPositioning || 'To be determined'}

Provide a thorough analysis covering:

1. COMPETITOR LANDSCAPE
   - Key players in this category
   - Their typical packaging approaches
   - Common visual conventions

2. COLOR TRENDS
   - Dominant color palettes in this category
   - Premium vs. mass-market color signals
   - Colors that signal trust, efficacy, or luxury

3. TYPOGRAPHY TRENDS
   - Font styles common in this category
   - What typographic choices signal authority vs. approachability

4. LAYOUT PATTERNS
   - Typical front panel hierarchy
   - Back panel information flow
   - Common structural/graphic elements

5. MARKET POSITIONING GAPS
   - What's missing or overdone in the market
   - Opportunities for visual differentiation
   - White space in the category

6. DIFFERENTIATION STRATEGY
   - How this brand can stand out
   - Visual angles competitors are NOT using
   - Recommended positioning direction

7. CATEGORY CONVENTIONS TO RESPECT
   - Regulatory requirements for this category
   - Consumer expectations that MUST be met
   - Anything that would confuse or alienate the target buyer

Return a JSON object with this structure:
{
  "categoryOverview": "string",
  "competitorInsights": [
    { "competitor": "string", "packagingApproach": "string", "strengths": "string", "weaknesses": "string" }
  ],
  "colorTrends": {
    "dominant": ["string"],
    "premium": ["string"],
    "avoid": ["string"],
    "reasoning": "string"
  },
  "typographyTrends": {
    "dominant": "string",
    "premium": "string",
    "reasoning": "string"
  },
  "layoutPatterns": {
    "frontPanel": "string",
    "backPanel": "string",
    "commonElements": ["string"]
  },
  "differentiation": {
    "opportunities": ["string"],
    "recommendedDirection": "string",
    "avoidCopying": ["string"]
  },
  "categoryConventions": ["string"],
  "overallInsight": "string"
}`;

  // If reference images were provided, include visual analysis
  let result;
  if (referenceImageUris.length > 0) {
    const visualPart = `\n\nThe user has also provided design reference images. Analyze their visual language (color, mood, style, composition) as additional context for the market research.`;
    result = await gemini.generateWithImages(
      prompt + visualPart,
      referenceImageUris.slice(0, 3), // max 3 images
      { temperature: 0.6, maxOutputTokens: 4096 }
    );
    // Parse the JSON from the text response
    const jsonMatch = result.match(/```(?:json)?\s*([\s\S]+?)```/) || [null, result];
    result = JSON.parse(jsonMatch[1] || result);
  } else {
    result = await gemini.generateJson(prompt, {
      temperature: 0.6,
      maxOutputTokens: 4096,
    });
  }

  return result;
}
