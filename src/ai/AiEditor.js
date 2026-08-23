/**
 * AiEditor.js
 * AI-assisted editing: interprets natural language commands
 * and modifies only the editable artwork layers.
 *
 * PROTECTED (never modified by AI):
 *  - Dieline layer
 *  - Logo asset elements (data-fixed="true")
 *  - Barcode asset elements (data-fixed="true")
 *  - Fixed company info
 *  - Regulatory numbers
 */

import { gemini } from './GeminiClient.js';
import { showToast } from '../components/Toast.js';

export class AiEditor {
  constructor(canvasEditor) {
    this._canvas = canvasEditor;
  }

  /**
   * Process a natural language edit command.
   * @param {string} instruction  - User's edit instruction
   * @param {string} currentSvg   - Current SVG document as text
   * @param {object} context      - Project context (productData, brandProfile, concept)
   * @param {function} onChunk    - Streaming callback
   * @returns {string} Modified SVG
   */
  async processCommand(instruction, currentSvg, context = {}, onChunk = null) {
    // Validate: reject requests to modify protected elements
    const rejectionReason = this._checkForProtectedModification(instruction);
    if (rejectionReason) {
      showToast(rejectionReason, 'warning');
      return currentSvg; // Return unchanged
    }

    const systemContext = `You are an expert packaging design AI assistant.
You can modify the EDITABLE ARTWORK layers of an SVG packaging design.

ABSOLUTE RULES — you must NEVER:
1. Modify, move, or change any element inside the <g id="dieline"> layer.
2. Modify, delete, or replace any <image> element with data-fixed="true" (logo, barcode, QR code).
3. Change the SVG viewBox, width, or height attributes.
4. Change any element with data-ai-locked="true".
5. Invent product information, ingredients, or claims not in the context.
6. Change the order of English and Arabic content (English must always come first).
7. Remove Arabic RTL text direction.
8. Generate a 3D representation — this is flat packaging artwork only.

YOU CAN modify:
- Colors, fills, gradients in background layers (front-bg, back-bg)
- Typography (font-size, font-weight, font-family) in artwork layers
- Layout of editable text elements
- Decorative graphic elements in graphics layers
- Visual hierarchy of non-protected elements

PRODUCT CONTEXT:
${JSON.stringify({
  productName: context.productData?.productName,
  brand: context.productData?.brand,
  colors: context.concept?.colorPalette,
}, null, 2)}

CURRENT SVG (truncated to editable layers):
${this._extractEditableLayers(currentSvg)}

USER INSTRUCTION: "${instruction}"

Respond with a JSON object:
{
  "analysis": "Brief description of what you will change and why",
  "changes": [
    {
      "elementId": "string (id of element to change)",
      "attribute": "string (attribute name)",
      "oldValue": "string",
      "newValue": "string",
      "reason": "string"
    }
  ],
  "newElements": [
    {
      "layerId": "string (target layer id)",
      "svgMarkup": "string (SVG element to add)"
    }
  ],
  "removeElementIds": ["string"]
}`;

    try {
      let fullResponse = '';

      if (onChunk) {
        await gemini.generateStream(systemContext, (chunk, full) => {
          fullResponse = full;
          onChunk(chunk, full);
        }, { temperature: 0.5, maxOutputTokens: 3000 });
      } else {
        fullResponse = await gemini.generate(systemContext, { temperature: 0.5, maxOutputTokens: 3000 });
      }

      // Parse AI response
      const jsonMatch = fullResponse.match(/```(?:json)?\s*([\s\S]+?)```/) || [null, fullResponse];
      const editPlan = JSON.parse(jsonMatch[1] || fullResponse);

      // Apply changes to the SVG
      const modifiedSvg = this._applySvgEdits(currentSvg, editPlan);

      showToast(`AI edit applied: ${editPlan.analysis?.slice(0, 60) || 'Done'}`, 'success');
      return modifiedSvg;

    } catch (err) {
      console.error('[AiEditor] Error:', err);
      showToast(`AI edit failed: ${err.message}`, 'error');
      return currentSvg; // Return unchanged on failure
    }
  }

  /**
   * Check if the instruction is trying to modify protected content.
   * Returns a rejection message or null if safe.
   */
  _checkForProtectedModification(instruction) {
    const lower = instruction.toLowerCase();

    if (/dieline|cut line|fold line|structural/i.test(lower)) {
      return 'Cannot modify the dieline — it is locked to protect the structural template.';
    }
    if (/barcode|ean|upc/i.test(lower) && /change|replace|regenerate|new|different/i.test(lower)) {
      return 'Cannot modify the barcode — it is a fixed official asset.';
    }
    if (/logo/i.test(lower) && /change|replace|regenerate|new|redraw|different color/i.test(lower)) {
      return 'Cannot modify the logo — it is a fixed official asset. To replace it, upload a new logo in Brand Profile.';
    }
    if (/ingredient|regulatory|inci|cas\s*number/i.test(lower) && /change|modify|alter/i.test(lower)) {
      return 'Cannot modify ingredients or regulatory information — these are fixed official values.';
    }
    if (/3d|mockup|render|perspective/i.test(lower)) {
      return 'This app creates flat packaging artwork only, not 3D mockups.';
    }

    return null;
  }

  /**
   * Extract only the editable layers from the SVG for context (to save tokens).
   */
  _extractEditableLayers(svgText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');

    const editableLayers = ['front-artwork', 'back-artwork', 'side-panels', 'graphics'];
    const parts = [];

    for (const id of editableLayers) {
      const el = doc.getElementById(id);
      if (el) {
        parts.push(new XMLSerializer().serializeToString(el).slice(0, 2000));
      }
    }

    return parts.join('\n\n');
  }

  /**
   * Apply the AI's edit plan to the SVG string.
   */
  _applySvgEdits(svgText, editPlan) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    let modified = false;

    // Apply attribute changes
    for (const change of (editPlan.changes || [])) {
      const el = doc.getElementById(change.elementId);
      if (!el) continue;

      // SAFETY: never touch dieline or fixed assets
      if (el.closest('#dieline') || el.getAttribute('data-fixed') === 'true') {
        console.warn('[AiEditor] Rejected change to protected element:', change.elementId);
        continue;
      }

      el.setAttribute(change.attribute, change.newValue);
      modified = true;
    }

    // Add new elements
    for (const item of (editPlan.newElements || [])) {
      const layer = doc.getElementById(item.layerId);
      if (!layer) continue;

      // SAFETY: never add to dieline layer
      if (item.layerId === 'dieline') continue;

      try {
        const tempDoc = parser.parseFromString(`<svg>${item.svgMarkup}</svg>`, 'image/svg+xml');
        const newEl = tempDoc.documentElement.firstElementChild;
        if (newEl) {
          layer.appendChild(doc.importNode(newEl, true));
          modified = true;
        }
      } catch (e) {
        console.warn('[AiEditor] Could not parse new element markup:', e);
      }
    }

    // Remove elements
    for (const id of (editPlan.removeElementIds || [])) {
      const el = doc.getElementById(id);
      if (!el) continue;

      // SAFETY: never remove from dieline or fixed assets
      if (el.closest('#dieline') || el.getAttribute('data-fixed') === 'true') {
        console.warn('[AiEditor] Rejected removal of protected element:', id);
        continue;
      }

      el.remove();
      modified = true;
    }

    if (!modified) return svgText;

    const serializer = new XMLSerializer();
    return `<?xml version="1.0" encoding="utf-8"?>\n${serializer.serializeToString(doc)}`;
  }
}
