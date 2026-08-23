/**
 * Validator.js
 * Pre-export validation engine.
 * Checks dieline integrity and print safety.
 *
 * Returns a structured ValidationReport with ✅ / ⚠️ / ❌ items.
 */

import { dielineEngine } from './DielectricEngine.js';

export const STATUS = {
  PASS:    'pass',
  WARNING: 'warn',
  ERROR:   'error',
};

export class Validator {
  /**
   * Run all validation checks against the current SVG string and project data.
   *
   * @param {string}  currentSvgText  - The working SVG document as text
   * @param {object}  project         - Project object with product data, brand profile, etc.
   * @returns {ValidationReport}
   */
  validate(currentSvgText, project = {}) {
    const checks = [];

    // Parse the current SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentSvgText, 'image/svg+xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      checks.push({
        id: 'parse-error',
        category: 'Structure',
        label: 'SVG Parse Error',
        status: STATUS.ERROR,
        detail: 'The working SVG file has a syntax error and cannot be validated.',
      });
      return this._buildReport(checks);
    }

    // ── 1. Dieline Integrity ──────────────────────────────
    if (dielineEngine.isLoaded) {
      const dielineResult = dielineEngine.validateDieline(currentSvgText);
      if (dielineResult.passed) {
        checks.push({
          id: 'dieline-integrity',
          category: 'Dieline',
          label: 'Dieline structure preserved',
          status: STATUS.PASS,
          detail: 'Artboard dimensions and structural paths match the original dieline.',
        });
      } else {
        for (const issue of dielineResult.issues) {
          checks.push({
            id: `dieline-${issue.category}`,
            category: 'Dieline',
            label: `Dieline ${issue.category} changed`,
            status: STATUS.ERROR,
            detail: issue.message,
          });
        }
      }
    } else {
      checks.push({
        id: 'no-dieline',
        category: 'Dieline',
        label: 'No dieline reference loaded',
        status: STATUS.WARNING,
        detail: 'Cannot validate dieline integrity without an original reference.',
      });
    }

    // ── 2. Required Layers Present ────────────────────────
    const requiredLayers = ['dieline', 'front-artwork', 'back-artwork', 'brand-assets'];
    for (const layerId of requiredLayers) {
      const found = doc.getElementById(layerId) ||
                    doc.querySelector(`[inkscape\\:label*="${layerId.replace('-',' ').toUpperCase()}"]`);
      checks.push({
        id: `layer-${layerId}`,
        category: 'Structure',
        label: `Layer "${layerId}" present`,
        status: found ? STATUS.PASS : STATUS.ERROR,
        detail: found
          ? `The "${layerId}" layer exists in the document.`
          : `Required layer "${layerId}" is missing from the SVG.`,
      });
    }

    // ── 3. Fixed Assets ───────────────────────────────────
    const logoPresent = !!doc.querySelector('[data-asset-type="logo"]');
    checks.push({
      id: 'logo-present',
      category: 'Brand Assets',
      label: 'Official logo placed',
      status: logoPresent ? STATUS.PASS : STATUS.WARNING,
      detail: logoPresent
        ? 'Company logo is present in the design.'
        : 'No company logo detected. Add the official logo before exporting.',
    });

    const barcodePresent = !!doc.querySelector('[data-asset-type="barcode"]');
    checks.push({
      id: 'barcode-present',
      category: 'Brand Assets',
      label: 'Official barcode placed',
      status: barcodePresent ? STATUS.PASS : STATUS.WARNING,
      detail: barcodePresent
        ? 'Barcode is present in the design.'
        : 'No barcode detected. Add the official barcode before exporting.',
    });

    // Check barcode is not distorted (aspect ratio preserved)
    if (barcodePresent) {
      const barcodeEl = doc.querySelector('[data-asset-type="barcode"]');
      const w = parseFloat(barcodeEl?.getAttribute('width') || 0);
      const h = parseFloat(barcodeEl?.getAttribute('height') || 0);
      const storedRatio = project.brandProfile?.barcodeAspectRatio;
      if (storedRatio && w > 0 && h > 0) {
        const currentRatio = w / h;
        const diff = Math.abs(currentRatio - storedRatio) / storedRatio;
        if (diff > 0.05) {
          checks.push({
            id: 'barcode-distortion',
            category: 'Brand Assets',
            label: 'Barcode aspect ratio',
            status: STATUS.ERROR,
            detail: `Barcode appears distorted. Expected ratio ~${storedRatio.toFixed(2)}, found ~${currentRatio.toFixed(2)}.`,
          });
        } else {
          checks.push({
            id: 'barcode-ratio',
            category: 'Brand Assets',
            label: 'Barcode proportions preserved',
            status: STATUS.PASS,
            detail: 'Barcode aspect ratio is within acceptable range.',
          });
        }
      }
    }

    // ── 4. Text Checks ────────────────────────────────────
    const allText = Array.from(doc.querySelectorAll('text, tspan'));
    const tinyText = allText.filter(t => {
      const fs = parseFloat(t.getAttribute('font-size') || t.style?.fontSize || '12');
      return fs < 5; // 5pt is typically the minimum readable print size
    });
    checks.push({
      id: 'text-size',
      category: 'Print Safety',
      label: 'Text size readability',
      status: tinyText.length === 0 ? STATUS.PASS : STATUS.WARNING,
      detail: tinyText.length === 0
        ? 'All text appears to be at a readable size.'
        : `${tinyText.length} text element(s) may be too small for print (< 5pt).`,
    });

    // ── 5. Bilingual Order (English before Arabic) ────────
    const backArtwork = doc.getElementById('back-artwork');
    if (backArtwork) {
      const englishLayer = doc.getElementById('back-english');
      const arabicLayer  = doc.getElementById('back-arabic');

      if (englishLayer && arabicLayer) {
        // Check DOM order: English must precede Arabic (rendered first = lower z-order = earlier in DOM)
        const allGroups = Array.from(backArtwork.children);
        const enIdx = allGroups.indexOf(englishLayer);
        const arIdx = allGroups.indexOf(arabicLayer);

        const orderCorrect = enIdx < arIdx;
        checks.push({
          id: 'bilingual-order',
          category: 'Content',
          label: 'English before Arabic',
          status: orderCorrect ? STATUS.PASS : STATUS.ERROR,
          detail: orderCorrect
            ? 'English content layer appears before Arabic layer — correct order.'
            : 'CRITICAL: Arabic content layer appears before English. English must always come first.',
        });
      }

      // Check for Arabic text RTL direction
      const arabicTexts = arabicLayer ? Array.from(arabicLayer.querySelectorAll('text, tspan')) : [];
      const wrongDir = arabicTexts.filter(t => {
        const dir = t.getAttribute('direction') || t.style?.direction || '';
        return dir && dir !== 'rtl';
      });
      if (arabicTexts.length > 0) {
        checks.push({
          id: 'arabic-rtl',
          category: 'Content',
          label: 'Arabic text direction (RTL)',
          status: wrongDir.length === 0 ? STATUS.PASS : STATUS.ERROR,
          detail: wrongDir.length === 0
            ? 'Arabic text elements have correct RTL direction.'
            : `${wrongDir.length} Arabic text element(s) do not have direction:rtl set.`,
        });
      }
    }

    // ── 6. Company Information ────────────────────────────
    const hasCompanyInfo = !!doc.getElementById('back-fixed-info');
    const hasCompanyText = hasCompanyInfo &&
      (doc.getElementById('back-fixed-info')?.textContent?.trim().length > 0);
    checks.push({
      id: 'company-info',
      category: 'Content',
      label: 'Fixed company information',
      status: hasCompanyText ? STATUS.PASS : STATUS.WARNING,
      detail: hasCompanyText
        ? 'Company information layer contains content.'
        : 'Fixed company information layer is empty.',
    });

    // ── 7. Objects outside dieline ────────────────────────
    // (Heuristic: check if any element has coordinates far outside viewBox)
    const geo = dielineEngine.geometry;
    if (geo && geo.viewBox) {
      const { minX, minY, width, height } = geo.viewBox;
      const margin = Math.max(width, height) * 0.1; // 10% tolerance
      const outsideElements = [];

      for (const el of doc.querySelectorAll('[x][y]')) {
        const x = parseFloat(el.getAttribute('x') || 0);
        const y = parseFloat(el.getAttribute('y') || 0);
        const w = parseFloat(el.getAttribute('width') || 0);
        const h = parseFloat(el.getAttribute('height') || 0);
        if (x + w < minX - margin || y + h < minY - margin ||
            x > minX + width + margin || y > minY + height + margin) {
          outsideElements.push(el.id || el.tagName);
        }
      }

      checks.push({
        id: 'elements-outside',
        category: 'Print Safety',
        label: 'Elements within artboard',
        status: outsideElements.length === 0 ? STATUS.PASS : STATUS.WARNING,
        detail: outsideElements.length === 0
          ? 'All elements appear to be within the artboard area.'
          : `${outsideElements.length} element(s) appear to be outside the artboard bounds.`,
      });
    }

    // ── 8. Low-res raster images ──────────────────────────
    const rasterImages = Array.from(doc.querySelectorAll('image'));
    const potentiallyLowRes = rasterImages.filter(img => {
      const w = parseFloat(img.getAttribute('width') || 0);
      const h = parseFloat(img.getAttribute('height') || 0);
      // If displayed at more than 200px but href is a tiny data URI — heuristic
      const href = img.getAttribute('href') || img.getAttribute('xlink:href') || '';
      return (w > 200 || h > 200) && href.length < 5000 && href.startsWith('data:image/');
    });

    checks.push({
      id: 'image-resolution',
      category: 'Print Safety',
      label: 'Image resolution',
      status: potentiallyLowRes.length === 0 ? STATUS.PASS : STATUS.WARNING,
      detail: potentiallyLowRes.length === 0
        ? 'No obviously low-resolution raster images detected.'
        : `${potentiallyLowRes.length} image(s) may be low resolution for print. Verify at 300dpi.`,
    });

    return this._buildReport(checks);
  }

  _buildReport(checks) {
    const errorCount   = checks.filter(c => c.status === STATUS.ERROR).length;
    const warningCount = checks.filter(c => c.status === STATUS.WARNING).length;
    const passCount    = checks.filter(c => c.status === STATUS.PASS).length;

    return {
      checks,
      errorCount,
      warningCount,
      passCount,
      canExport: errorCount === 0,
      summary: errorCount > 0
        ? `❌ ${errorCount} error(s) must be fixed before export.`
        : warningCount > 0
          ? `⚠️ ${warningCount} warning(s) — review before export.`
          : `✅ All checks passed — ready to export.`,
    };
  }
}

export const validator = new Validator();
