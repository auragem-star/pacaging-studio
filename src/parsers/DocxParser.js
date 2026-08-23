/**
 * DocxParser.js
 * Parses a Word (.docx) document and extracts product data.
 * Uses mammoth.js to convert .docx → clean HTML/text.
 *
 * Returns a structured ProductData object for AI review.
 */

import mammoth from 'mammoth';

/**
 * Extract raw text + HTML from a .docx File object.
 */
export async function parseDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const textResult = await mammoth.extractRawText({ arrayBuffer });

  return {
    html: result.value,
    text: textResult.value,
    messages: [...result.messages, ...textResult.messages],
  };
}

/**
 * Parse extracted text into a structured ProductData schema.
 * This is a best-effort text parser. The AI does the smart analysis.
 * 
 * Returns a flat object that the AI will refine.
 */
export function extractProductDataFromText(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const data = {
    brand: '',
    productName: '',
    productCategory: '',
    productDescription: { en: '', ar: '' },
    keyBenefits: { en: [], ar: [] },
    claims: { en: [], ar: [] },
    ingredients: { en: '', ar: '' },
    activeIngredients: { en: '', ar: '' },
    directions: { en: '', ar: '' },
    warnings: { en: '', ar: '' },
    storage: { en: '', ar: '' },
    productSize: '',
    weight: '',
    volume: '',
    netContent: '',
    regulatoryInfo: '',
    frontPanelText: { en: '', ar: '' },
    backPanelText:  { en: '', ar: '' },
    otherInfo: [],
    _rawText: rawText,
    _lines: lines,
  };

  // Simple heuristic extraction — AI will do the real work
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    const nextLine = lines[i + 1] || '';

    if (!data.brand && /^brand[:\s]/i.test(line)) {
      data.brand = line.replace(/^brand[:\s]*/i, '').trim();
    }
    if (!data.productName && /^product name[:\s]|^name[:\s]/i.test(line)) {
      data.productName = line.replace(/^product name[:\s]*|^name[:\s]*/i, '').trim() || nextLine;
    }
    if (/weight|net weight/i.test(lower) && !data.weight) {
      data.weight = line.replace(/.*weight[:\s]*/i, '').trim() || nextLine;
    }
    if (/volume|ml|fl\.?\s?oz/i.test(lower) && !data.volume) {
      data.volume = line.replace(/.*volume[:\s]*/i, '').trim() || nextLine;
    }
    if (/size/i.test(lower) && !data.productSize) {
      data.productSize = line.replace(/.*size[:\s]*/i, '').trim() || nextLine;
    }
  }

  return data;
}

/**
 * Check if a string contains Arabic characters.
 */
export function isArabicText(text) {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

/**
 * Split an array of lines into English and Arabic sections.
 */
export function splitBilingualLines(lines) {
  const english = [];
  const arabic  = [];

  for (const line of lines) {
    if (isArabicText(line)) {
      arabic.push(line);
    } else {
      english.push(line);
    }
  }

  return { english, arabic };
}
