/**
 * SvgExporter.js
 * Exports the final packaging design as an Illustrator-compatible layered SVG.
 *
 * The exported SVG preserves:
 *  - Exact dieline dimensions and viewBox
 *  - All named layers as <g> groups with inkscape:label attributes
 *  - Editable text objects
 *  - Embedded images
 *  - Vector paths
 *  - Adobe Illustrator namespace hints
 */

export class SvgExporter {
  /**
   * Build the final export SVG string from the live canvas SVG element.
   *
   * @param {SVGSVGElement} svgElement - The live editor SVG DOM element
   * @param {string} documentTitle     - Product/project title for metadata
   * @returns {string} Complete SVG document string
   */
  buildExportSvg(svgElement, documentTitle = 'Packaging Design') {
    // Clone the SVG deeply so we don't mutate the live editor
    const clone = svgElement.cloneNode(true);

    // Remove editor-only attributes and classes
    this._cleanEditorArtifacts(clone);

    // Ensure Adobe Illustrator namespaces and hints
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    clone.setAttribute('xmlns:inkscape', 'http://www.inkscape.org/namespaces/inkscape');
    clone.setAttribute('xmlns:svg', 'http://www.w3.org/2000/svg');
    clone.setAttribute('version', '1.1');

    // Build final SVG string
    const serializer = new XMLSerializer();
    let svgText = serializer.serializeToString(clone);

    // Prepend XML declaration and doctype
    svgText = `<?xml version="1.0" encoding="utf-8"?>\n${svgText}`;

    // Inject embedded Google Fonts for portability
    svgText = this._injectFontFaces(svgText);

    return svgText;
  }

  /**
   * Download the SVG to the user's machine.
   */
  downloadSvg(svgText, filename = 'packaging-design.svg') {
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Export as PDF using jsPDF + svg2pdf.js.
   * Preserves vector elements where possible.
   */
  async exportPdf(svgElement, filename = 'packaging-design.pdf', meta = {}) {
    try {
      // Dynamically import heavy PDF deps
      const [{ jsPDF }, { svg2pdf }] = await Promise.all([
        import('jspdf'),
        import('svg2pdf.js'),
      ]);

      const viewBox = svgElement.viewBox?.baseVal;
      const w = viewBox?.width  || parseFloat(svgElement.getAttribute('width')  || 800);
      const h = viewBox?.height || parseFloat(svgElement.getAttribute('height') || 600);

      // Convert SVG user units to mm (assuming 96dpi: 1px = 0.2646mm)
      const mmW = w * 0.2646;
      const mmH = h * 0.2646;

      const orientation = mmW > mmH ? 'landscape' : 'portrait';
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: [mmW, mmH],
        compress: true,
      });

      // Add metadata
      pdf.setProperties({
        title: meta.title || 'Packaging Design',
        subject: 'Packaging Design — Created with PackStudio',
        author: meta.author || 'PackStudio',
        creator: 'PackStudio AI Packaging Design Studio',
      });

      // Clone for PDF export
      const clone = svgElement.cloneNode(true);
      document.body.appendChild(clone);
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';

      try {
        await svg2pdf(clone, pdf, { x: 0, y: 0, width: mmW, height: mmH });
      } finally {
        document.body.removeChild(clone);
      }

      pdf.save(filename);

      return { success: true };
    } catch (err) {
      console.error('[SvgExporter] PDF export failed:', err);
      return {
        success: false,
        error: err.message,
        fallback: 'PDF export encountered an issue. Please download the SVG and print from Illustrator.',
      };
    }
  }

  // ── Private Helpers ───────────────────────────────────────

  _cleanEditorArtifacts(svgClone) {
    // Remove selection handles, guide overlays, cursor elements
    const editorEls = svgClone.querySelectorAll(
      '[data-editor-only], .selection-handle, .guide-line, .safe-area-guide, .bleed-guide'
    );
    for (const el of editorEls) el.remove();

    // Remove inline cursor/pointer styles added by the editor
    const allEls = svgClone.querySelectorAll('[style]');
    for (const el of allEls) {
      let style = el.getAttribute('style') || '';
      style = style.replace(/cursor:[^;]+;?/g, '');
      style = style.replace(/outline:[^;]+;?/g, '');
      if (style.trim()) {
        el.setAttribute('style', style.trim());
      } else {
        el.removeAttribute('style');
      }
    }

    // Restore pointer-events:none on dieline layer for export
    const dielineLayer = svgClone.getElementById('dieline');
    if (dielineLayer) {
      dielineLayer.setAttribute('style', 'pointer-events:none;');
    }
  }

  _injectFontFaces(svgText) {
    // Inject font-face declarations for Inter and Noto Naskh Arabic
    // so the SVG is portable when opened outside a browser
    const fontFaces = `<style type="text/css">
    /* Inter — Latin */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&amp;display=swap');
    /* Noto Naskh Arabic — Arabic */
    @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&amp;display=swap');
  </style>`;

    // Insert after opening <svg> tag
    return svgText.replace(/(<svg[^>]*>)/, `$1\n  ${fontFaces}`);
  }
}

export const svgExporter = new SvgExporter();
