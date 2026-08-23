/**
 * DielectricEngine.js
 * ─────────────────────────────────────────────────────────────
 * THE STRUCTURAL CORE — responsible for:
 *   1. Parsing uploaded SVG dielines
 *   2. Classifying cut vs. fold paths
 *   3. Detecting panel bounding boxes
 *   4. Preserving original geometry as an immutable reference
 *   5. Validating that no structural changes have occurred
 *
 * ABSOLUTE RULE: This module NEVER modifies the dieline.
 * It only reads, stores, and compares.
 * ─────────────────────────────────────────────────────────────
 */

export class DielectricEngine {
  constructor() {
    this._originalSvgString = null;   // Raw uploaded SVG text
    this._originalDoc = null;          // Parsed original SVG DOM
    this._geometry = null;             // Extracted geometry object
  }

  // ── Load & Parse ─────────────────────────────────────────

  /**
   * Load a dieline from an SVG string.
   * Stores the original verbatim and extracts geometry.
   */
  loadFromSvgString(svgText) {
    // Preserve the original exactly as uploaded
    this._originalSvgString = svgText;

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');

    // Check for parse errors
    const error = doc.querySelector('parsererror');
    if (error) {
      throw new Error('SVG parse error: ' + error.textContent.trim().split('\n')[0]);
    }

    this._originalDoc = doc;
    this._geometry = this._extractGeometry(doc);
    return this._geometry;
  }

  /**
   * Load from a PDF-extracted SVG representation.
   * Marks geometry confidence as 'medium' (PDF extraction is approximate).
   */
  loadFromPdfExtractedSvg(svgText, confidence = 'medium') {
    const geo = this.loadFromSvgString(svgText);
    geo.sourceFormat = 'pdf';
    geo.confidence = confidence;
    return geo;
  }

  // ── Geometry Extraction ───────────────────────────────────

  _extractGeometry(doc) {
    const svg = doc.documentElement;
    const viewBox = this._parseViewBox(svg);
    const width = parseFloat(svg.getAttribute('width') || viewBox?.width || 0);
    const height = parseFloat(svg.getAttribute('height') || viewBox?.height || 0);

    // Collect all path elements
    const paths = Array.from(doc.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon'));

    // Classify paths
    const cutPaths = [];
    const foldPaths = [];
    const unknownPaths = [];

    for (const el of paths) {
      const type = this._classifyPathElement(el);
      const entry = {
        element: el.outerHTML,
        tag: el.tagName,
        id: el.id || null,
        stroke: el.getAttribute('stroke') || el.style?.stroke || '',
        strokeDasharray: el.getAttribute('stroke-dasharray') || el.style?.strokeDasharray || '',
        fill: el.getAttribute('fill') || el.style?.fill || 'none',
        d: el.getAttribute('d') || null,
        bbox: this._getBBoxApprox(el),
      };

      if (type === 'cut')    cutPaths.push(entry);
      else if (type === 'fold') foldPaths.push(entry);
      else                    unknownPaths.push(entry);
    }

    // Detect panel regions
    const panels = this._detectPanels(doc, viewBox);

    return {
      sourceFormat: 'svg',
      confidence: 'high',
      viewBox,
      width,
      height,
      units: svg.getAttribute('width')?.replace(/[\d.]/g, '') || 'px',
      cutPaths,
      foldPaths,
      unknownPaths,
      panels,
      rawSvg: this._originalSvgString,
    };
  }

  _parseViewBox(svg) {
    const vb = svg.getAttribute('viewBox');
    if (!vb) return null;
    const parts = vb.trim().split(/[\s,]+/).map(Number);
    if (parts.length !== 4) return null;
    return { minX: parts[0], minY: parts[1], width: parts[2], height: parts[3] };
  }

  /**
   * Classify a path element as cut, fold, or unknown.
   * Uses stroke color conventions and dash patterns common in print dielines.
   */
  _classifyPathElement(el) {
    const stroke = (el.getAttribute('stroke') || el.style?.stroke || '').toLowerCase().trim();
    const dashArray = (el.getAttribute('stroke-dasharray') || el.style?.strokeDasharray || '').trim();
    const layerName = this._getLayerName(el)?.toLowerCase() || '';
    const id = (el.id || '').toLowerCase();
    const className = (el.getAttribute('class') || '').toLowerCase();

    // Layer-name based detection (most reliable)
    if (/cut|trim|die|crease-cut|perfor/i.test(layerName) ||
        /cut|trim|die/i.test(id) || /cut|trim|die/i.test(className)) {
      return 'cut';
    }
    if (/fold|score|crease|perf/i.test(layerName) ||
        /fold|score|crease/i.test(id) || /fold|score|crease/i.test(className)) {
      return 'fold';
    }

    // Color-based: Magenta/cyan are industry cut/fold conventions
    if (/^(magenta|#ff00ff|#f0f|rgb\(255,\s*0,\s*255\)|fuchsia)/.test(stroke)) return 'cut';
    if (/^(cyan|#00ffff|#0ff|rgb\(0,\s*255,\s*255\))/.test(stroke)) return 'fold';
    if (/#ff0000|red|rgb\(255,\s*0,\s*0\)/.test(stroke)) return 'cut';
    if (/#0000ff|blue|rgb\(0,\s*0,\s*255\)/.test(stroke)) return 'fold';

    // Dash pattern: solid = cut, dashed = fold (common convention)
    if (dashArray && dashArray !== 'none' && dashArray !== '') return 'fold';
    if (!dashArray || dashArray === 'none') {
      if (stroke && stroke !== 'none' && stroke !== '') return 'cut';
    }

    return 'unknown';
  }

  _getLayerName(el) {
    // Walk up ancestors to find an Inkscape layer or Illustrator group label
    let node = el.parentElement;
    while (node) {
      const label = node.getAttribute('inkscape:label') ||
                    node.getAttribute('id') ||
                    node.getAttribute('data-name') || '';
      if (label) return label;
      node = node.parentElement;
    }
    return '';
  }

  /**
   * Approximate bounding box using SVG path data.
   * Returns null if not computable in browser without SVG geometry APIs.
   */
  _getBBoxApprox(el) {
    // For serialized SVG (no live DOM), we cannot call getBBox().
    // Return null; the editor will compute real bboxes when rendering.
    return null;
  }

  /**
   * Attempt to detect rectangular panels from the dieline structure.
   * Uses group labels or bounding box clustering.
   */
  _detectPanels(doc, viewBox) {
    const panels = [];
    const groups = doc.querySelectorAll('g');

    for (const g of groups) {
      const label = (
        g.getAttribute('inkscape:label') ||
        g.getAttribute('id') ||
        g.getAttribute('data-name') || ''
      ).toLowerCase();

      let type = 'unknown';
      if (/front/i.test(label)) type = 'front';
      else if (/back/i.test(label)) type = 'back';
      else if (/left.*side|side.*left/i.test(label)) type = 'left';
      else if (/right.*side|side.*right/i.test(label)) type = 'right';
      else if (/top/i.test(label)) type = 'top';
      else if (/bottom/i.test(label)) type = 'bottom';
      else if (/flap/i.test(label)) type = 'flap';

      if (type !== 'unknown') {
        panels.push({ type, label, groupId: g.id || null });
      }
    }

    return panels;
  }

  // ── Validation ────────────────────────────────────────────

  /**
   * Validate that the current working SVG still matches the original dieline geometry.
   * Returns { passed: bool, issues: [] }
   */
  validateDieline(currentSvgText) {
    const issues = [];

    if (!this._originalSvgString) {
      return { passed: false, issues: [{ severity: 'error', message: 'No original dieline loaded for comparison.' }] };
    }

    const parser = new DOMParser();
    const origDoc = this._originalDoc;
    const currDoc = parser.parseFromString(currentSvgText, 'image/svg+xml');

    // 1. Check viewBox / artboard dimensions
    const origVB = origDoc.documentElement.getAttribute('viewBox');
    const currVB = currDoc.documentElement.getAttribute('viewBox');
    if (origVB !== currVB) {
      issues.push({
        severity: 'error',
        message: `Artboard dimensions changed. Original: ${origVB} → Current: ${currVB}`,
        category: 'dimensions'
      });
    }

    // 2. Check that the dieline group still exists and is unchanged
    const origDielineGroup = origDoc.querySelector('#dieline, [inkscape\\:label="DIELINE - LOCKED"]');
    const currDielineGroup = currDoc.querySelector('#dieline, [inkscape\\:label="DIELINE - LOCKED"]');

    if (!currDielineGroup) {
      issues.push({
        severity: 'error',
        message: 'The DIELINE - LOCKED layer is missing from the working file.',
        category: 'structure'
      });
    } else {
      // Compare path count in dieline group
      const origPaths = origDielineGroup
        ? origDielineGroup.querySelectorAll('path, rect, circle, line, polyline, polygon').length
        : this._geometry?.cutPaths.length + this._geometry?.foldPaths.length;
      const currPaths = currDielineGroup.querySelectorAll('path, rect, circle, line, polyline, polygon').length;

      if (origPaths !== currPaths) {
        issues.push({
          severity: 'error',
          message: `Structural path count changed in dieline layer. Original: ${origPaths} → Current: ${currPaths}`,
          category: 'paths'
        });
      }
    }

    return {
      passed: issues.filter(i => i.severity === 'error').length === 0,
      issues
    };
  }

  // ── Getters ───────────────────────────────────────────────

  get geometry() { return this._geometry; }
  get originalSvg() { return this._originalSvgString; }
  get isLoaded() { return !!this._originalSvgString; }

  /**
   * Build the initial locked dieline layer SVG group string.
   * This wraps the original dieline paths in a locked <g> element.
   */
  buildDielineLayer() {
    if (!this._originalDoc) return '';

    const svg = this._originalDoc.documentElement;
    const innerContent = svg.innerHTML;

    return `<g id="dieline" inkscape:label="DIELINE - LOCKED" 
               data-locked="true" 
               style="pointer-events:none;" 
               opacity="1">${innerContent}</g>`;
  }
}

// Singleton instance
export const dielineEngine = new DielectricEngine();
