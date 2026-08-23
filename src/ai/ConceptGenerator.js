/**
 * ConceptGenerator.js
 * Renders packaging design concepts as live SVG compositions on the locked dieline.
 *
 * CRITICAL RULES:
 *  - NEVER recreates the dieline — artwork goes INSIDE panels
 *  - NEVER generates a 3D mockup — only flat SVG artwork
 *  - Dieline layer remains locked and untouched
 *  - English content always before Arabic
 *  - Arabic uses proper RTL formatting
 *  - Fixed assets (logo, barcode) placed from AssetVault
 */

import { dielineEngine } from '../core/DielectricEngine.js';
import { layerManager } from '../core/LayerManager.js';

/**
 * Render a concept onto the dieline SVG, producing a full SVG document string.
 *
 * @param {object} concept       - Concept definition from CreativeDirector
 * @param {object} productData   - Extracted product data
 * @param {object} brandProfile  - Brand profile with logo, barcode asset IDs
 * @param {object} panelMap      - { front: {x,y,w,h}, back: {x,y,w,h}, ... }
 * @returns {string} Complete SVG document
 */
export function renderConcept(concept, productData, brandProfile, panelMap) {
  const geo = dielineEngine.geometry;
  if (!geo) throw new Error('No dieline loaded. Cannot render concept.');

  const vb = geo.viewBox || { minX: 0, minY: 0, width: 800, height: 600 };
  const { minX, minY, width, height } = vb;

  // Build skeleton SVG
  const skeleton = layerManager.buildSvgSkeleton(vb, geo.width, geo.height);

  // Parse skeleton to inject content
  const parser = new DOMParser();
  const doc = parser.parseFromString(skeleton, 'image/svg+xml');

  // 1. Inject LOCKED dieline layer
  const dielineGroup = doc.getElementById('dieline');
  if (dielineGroup) {
    const dieline = dielineEngine.buildDielineLayer();
    const tempDoc = parser.parseFromString(`<svg>${dieline}</svg>`, 'image/svg+xml');
    const dielineG = tempDoc.querySelector('g');
    if (dielineG) {
      // Copy children from the dieline SVG's content into the locked group
      const innerParser = parser.parseFromString(dielineEngine.originalSvg, 'image/svg+xml');
      const innerSvg = innerParser.documentElement;
      for (const child of Array.from(innerSvg.children)) {
        if (child.tagName !== 'defs') {
          dielineGroup.appendChild(doc.importNode(child, true));
        }
      }
    }
  }

  // 2. Render FRONT panel artwork
  if (panelMap?.front) {
    renderFrontPanel(doc, concept, productData, brandProfile, panelMap.front);
  } else {
    // If no panel map, render front panel covering left half of artboard
    const defaultFront = { x: minX, y: minY, w: width * 0.4, h: height };
    renderFrontPanel(doc, concept, productData, brandProfile, defaultFront);
  }

  // 3. Render BACK panel artwork
  if (panelMap?.back) {
    renderBackPanel(doc, concept, productData, brandProfile, panelMap.back);
  } else {
    const defaultBack = { x: minX + width * 0.5, y: minY, w: width * 0.4, h: height };
    renderBackPanel(doc, concept, productData, brandProfile, defaultBack);
  }

  // 4. Render side panels if available
  if (panelMap?.left) {
    renderSidePanel(doc, concept, productData, panelMap.left, 'left');
  }
  if (panelMap?.right) {
    renderSidePanel(doc, concept, productData, panelMap.right, 'right');
  }

  // Serialize
  const serializer = new XMLSerializer();
  return `<?xml version="1.0" encoding="utf-8"?>\n${serializer.serializeToString(doc)}`;
}

// ── Front Panel Renderer ──────────────────────────────────────

function renderFrontPanel(doc, concept, productData, brandProfile, panel) {
  const { x, y, w, h } = panel;
  const colors = concept.colorPalette;
  const typo = concept.typography;

  const frontBg    = doc.getElementById('front-bg');
  const frontLogo  = doc.getElementById('front-logo');
  const frontName  = doc.getElementById('front-name');
  const frontClaims = doc.getElementById('front-claims');
  const frontSize  = doc.getElementById('front-size');
  const frontGraphics = doc.getElementById('front-graphics');

  const ns = 'http://www.w3.org/2000/svg';

  // Background
  if (frontBg) {
    const bgType = concept.frontPanel?.bgType || 'solid';
    if (bgType === 'gradient') {
      const gradId = `front-bg-grad-${concept.id}`;
      const defs = doc.getElementById('defs') || doc.querySelector('defs') || doc.createElementNS(ns, 'defs');

      const grad = doc.createElementNS(ns, 'linearGradient');
      grad.setAttribute('id', gradId);
      grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
      grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '100%');

      const stop1 = doc.createElementNS(ns, 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', colors.primary || '#1a2235');
      grad.appendChild(stop1);

      const stop2 = doc.createElementNS(ns, 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', colors.background || '#0a0d14');
      grad.appendChild(stop2);

      defs.appendChild(grad);
      doc.documentElement.insertBefore(defs, doc.documentElement.firstChild);

      const rect = doc.createElementNS(ns, 'rect');
      rect.setAttribute('x', x); rect.setAttribute('y', y);
      rect.setAttribute('width', w); rect.setAttribute('height', h);
      rect.setAttribute('fill', `url(#${gradId})`);
      frontBg.appendChild(rect);
    } else {
      const rect = doc.createElementNS(ns, 'rect');
      rect.setAttribute('x', x); rect.setAttribute('y', y);
      rect.setAttribute('width', w); rect.setAttribute('height', h);
      rect.setAttribute('fill', colors.primary || '#1a2235');
      frontBg.appendChild(rect);
    }
  }

  // Decorative graphic element
  if (frontGraphics && concept.frontPanel?.graphicElement) {
    // Abstract geometric shape as a placeholder graphic
    const circle = doc.createElementNS(ns, 'circle');
    circle.setAttribute('cx', x + w * 0.5);
    circle.setAttribute('cy', y + h * 0.35);
    circle.setAttribute('r', Math.min(w, h) * 0.22);
    circle.setAttribute('fill', colors.accent || colors.secondary || '#f5a623');
    circle.setAttribute('opacity', '0.12');
    frontGraphics.appendChild(circle);

    const circle2 = doc.createElementNS(ns, 'circle');
    circle2.setAttribute('cx', x + w * 0.5);
    circle2.setAttribute('cy', y + h * 0.35);
    circle2.setAttribute('r', Math.min(w, h) * 0.18);
    circle2.setAttribute('fill', 'none');
    circle2.setAttribute('stroke', colors.accent || '#f5a623');
    circle2.setAttribute('stroke-width', '1.5');
    circle2.setAttribute('opacity', '0.3');
    frontGraphics.appendChild(circle2);
  }

  // Logo placeholder (will be replaced with real asset when available)
  if (frontLogo) {
    const logoH = h * 0.08;
    const logoY = y + h * 0.06;
    const logoX = x + w * 0.5 - (logoH * 2.5) / 2; // centered

    if (brandProfile?.logoAssetId) {
      // Placeholder — real asset injected by AssetVault in final render
      const logoRect = doc.createElementNS(ns, 'rect');
      logoRect.setAttribute('x', logoX);
      logoRect.setAttribute('y', logoY);
      logoRect.setAttribute('width', logoH * 2.5);
      logoRect.setAttribute('height', logoH);
      logoRect.setAttribute('fill', 'none');
      logoRect.setAttribute('stroke', colors.accent || '#f5a623');
      logoRect.setAttribute('stroke-width', '1');
      logoRect.setAttribute('stroke-dasharray', '3,2');
      logoRect.setAttribute('data-placeholder', 'logo');
      frontLogo.appendChild(logoRect);

      const logoText = doc.createElementNS(ns, 'text');
      logoText.setAttribute('x', x + w * 0.5);
      logoText.setAttribute('y', logoY + logoH * 0.65);
      logoText.setAttribute('text-anchor', 'middle');
      logoText.setAttribute('font-size', logoH * 0.45);
      logoText.setAttribute('fill', colors.accent || '#f5a623');
      logoText.setAttribute('font-family', typo?.heading || 'Inter');
      logoText.setAttribute('font-weight', '700');
      logoText.textContent = brandProfile.companyName || 'LOGO';
      frontLogo.appendChild(logoText);
    } else {
      // Show brand/company name as text logo
      const logoText = doc.createElementNS(ns, 'text');
      logoText.setAttribute('x', x + w * 0.5);
      logoText.setAttribute('y', logoY + logoH * 0.8);
      logoText.setAttribute('text-anchor', 'middle');
      logoText.setAttribute('font-size', logoH * 0.7);
      logoText.setAttribute('fill', colors.accent || '#f5a623');
      logoText.setAttribute('font-family', typo?.heading || 'Inter');
      logoText.setAttribute('font-weight', '800');
      logoText.setAttribute('letter-spacing', '2');
      logoText.textContent = (productData.brand || 'BRAND').toUpperCase();
      frontLogo.appendChild(logoText);
    }
  }

  // Product name (large, prominent)
  if (frontName && productData.productName) {
    const nameSize = Math.min(w * 0.12, h * 0.06);
    const nameY = y + h * 0.42;

    const nameText = doc.createElementNS(ns, 'text');
    nameText.setAttribute('x', x + w * 0.5);
    nameText.setAttribute('y', nameY);
    nameText.setAttribute('text-anchor', 'middle');
    nameText.setAttribute('font-size', nameSize);
    nameText.setAttribute('fill', colors.text || '#ffffff');
    nameText.setAttribute('font-family', typo?.heading || 'Inter');
    nameText.setAttribute('font-weight', '800');
    nameText.setAttribute('letter-spacing', '1');
    nameText.textContent = productData.productName.toUpperCase();
    frontName.appendChild(nameText);

    // Tagline
    if (productData.tagline) {
      const tagText = doc.createElementNS(ns, 'text');
      tagText.setAttribute('x', x + w * 0.5);
      tagText.setAttribute('y', nameY + nameSize * 1.4);
      tagText.setAttribute('text-anchor', 'middle');
      tagText.setAttribute('font-size', nameSize * 0.45);
      tagText.setAttribute('fill', colors.accent || '#f5a623');
      tagText.setAttribute('font-family', typo?.body || 'Inter');
      tagText.setAttribute('font-weight', '400');
      tagText.setAttribute('font-style', 'italic');
      tagText.textContent = productData.tagline;
      frontName.appendChild(tagText);
    }
  }

  // Claims (top 2 benefits)
  if (frontClaims && productData.keyBenefits?.en?.length > 0) {
    const benefits = productData.keyBenefits.en.slice(0, 2);
    const claimSize = Math.min(w * 0.06, h * 0.032);
    const claimStartY = y + h * 0.56;

    benefits.forEach((benefit, i) => {
      const claimText = doc.createElementNS(ns, 'text');
      claimText.setAttribute('x', x + w * 0.5);
      claimText.setAttribute('y', claimStartY + i * claimSize * 1.6);
      claimText.setAttribute('text-anchor', 'middle');
      claimText.setAttribute('font-size', claimSize);
      claimText.setAttribute('fill', colors.text || '#e2e8f0');
      claimText.setAttribute('font-family', typo?.body || 'Inter');
      claimText.setAttribute('font-weight', '400');
      claimText.textContent = benefit.length > 40 ? benefit.slice(0, 37) + '...' : benefit;
      frontClaims.appendChild(claimText);
    });
  }

  // Size / net content
  if (frontSize) {
    const sizeStr = [productData.weight, productData.volume, productData.netContent]
      .filter(Boolean).join(' / ');
    if (sizeStr) {
      const sizeText = doc.createElementNS(ns, 'text');
      sizeText.setAttribute('x', x + w * 0.5);
      sizeText.setAttribute('y', y + h * 0.88);
      sizeText.setAttribute('text-anchor', 'middle');
      sizeText.setAttribute('font-size', Math.min(w * 0.065, h * 0.035));
      sizeText.setAttribute('fill', colors.accent || '#f5a623');
      sizeText.setAttribute('font-family', typo?.body || 'Inter');
      sizeText.setAttribute('font-weight', '600');
      sizeText.textContent = sizeStr;
      frontSize.appendChild(sizeText);
    }
  }
}

// ── Back Panel Renderer ───────────────────────────────────────

function renderBackPanel(doc, concept, productData, brandProfile, panel) {
  const { x, y, w, h } = panel;
  const colors = concept.colorPalette;
  const typo = concept.typography;
  const ns = 'http://www.w3.org/2000/svg';

  const backBg = doc.getElementById('back-bg');
  const backEn = doc.getElementById('back-english');
  const backAr = doc.getElementById('back-arabic');
  const backFixed = doc.getElementById('back-fixed-info');
  const backBarcode = doc.getElementById('back-barcode');

  // Background
  if (backBg) {
    const rect = doc.createElementNS(ns, 'rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y);
    rect.setAttribute('width', w); rect.setAttribute('height', h);
    rect.setAttribute('fill', concept.backPanel?.bgColor || colors.background || '#f8f9fa');
    backBg.appendChild(rect);
  }

  // Helper to create a section block (heading + content)
  const sectionFontSize = Math.min(w * 0.045, h * 0.025, 8);
  const headingFontSize = sectionFontSize * 0.9;
  let currentY = y + h * 0.04;
  const margin = w * 0.06;
  const textWidth = w - margin * 2;
  const textColor = colors.primary || '#1a2235';
  const headingColor = colors.primary || '#1a2235';
  const accentColor = colors.accent || '#f5a623';

  // ── ENGLISH CONTENT FIRST (strict rule) ──────────────────
  if (backEn) {
    // Description
    if (productData.productDescription?.en) {
      appendSection(doc, backEn, ns,
        'DESCRIPTION', productData.productDescription.en,
        x + margin, currentY, textWidth,
        headingFontSize, sectionFontSize,
        headingColor, textColor, accentColor, typo, 'ltr');
      currentY += sectionFontSize * (Math.ceil(productData.productDescription.en.length / 50) + 3.5);
    }

    // Directions
    if (productData.directions?.en) {
      appendSection(doc, backEn, ns,
        'DIRECTIONS FOR USE', productData.directions.en,
        x + margin, currentY, textWidth,
        headingFontSize, sectionFontSize,
        headingColor, textColor, accentColor, typo, 'ltr');
      currentY += sectionFontSize * (Math.ceil(productData.directions.en.length / 50) + 3.5);
    }

    // Ingredients
    if (productData.ingredients?.en) {
      appendSection(doc, backEn, ns,
        'INGREDIENTS', productData.ingredients.en,
        x + margin, currentY, textWidth,
        headingFontSize, sectionFontSize,
        headingColor, textColor, accentColor, typo, 'ltr');
      currentY += sectionFontSize * (Math.ceil(productData.ingredients.en.length / 50) + 3.5);
    }

    // Warnings
    if (productData.warnings?.en) {
      appendSection(doc, backEn, ns,
        'WARNINGS', productData.warnings.en,
        x + margin, currentY, textWidth,
        headingFontSize, sectionFontSize,
        '#c00', textColor, '#c00', typo, 'ltr');
      currentY += sectionFontSize * (Math.ceil(productData.warnings.en.length / 50) + 3.5);
    }

    // Storage
    if (productData.storage?.en) {
      appendSection(doc, backEn, ns,
        'STORAGE', productData.storage.en,
        x + margin, currentY, textWidth,
        headingFontSize, sectionFontSize,
        headingColor, textColor, accentColor, typo, 'ltr');
      currentY += sectionFontSize * 3;
    }
  }

  // Divider between English and Arabic
  if (backEn && backAr) {
    const divider = doc.createElementNS(ns, 'line');
    divider.setAttribute('x1', x + margin);
    divider.setAttribute('y1', currentY);
    divider.setAttribute('x2', x + w - margin);
    divider.setAttribute('y2', currentY);
    divider.setAttribute('stroke', accentColor);
    divider.setAttribute('stroke-width', '0.5');
    divider.setAttribute('opacity', '0.4');
    backEn.appendChild(divider);
    currentY += sectionFontSize;
  }

  // ── ARABIC CONTENT SECOND (strict rule, RTL) ──────────────
  if (backAr) {
    const arX = x + w - margin; // RTL starts from right
    let arY = currentY;

    if (productData.productDescription?.ar) {
      appendSection(doc, backAr, ns,
        'الوصف', productData.productDescription.ar,
        arX, arY, textWidth,
        headingFontSize, sectionFontSize,
        headingColor, textColor, accentColor, typo, 'rtl');
      arY += sectionFontSize * (Math.ceil(productData.productDescription.ar.length / 50) + 3.5);
    }

    if (productData.directions?.ar) {
      appendSection(doc, backAr, ns,
        'طريقة الاستخدام', productData.directions.ar,
        arX, arY, textWidth,
        headingFontSize, sectionFontSize,
        headingColor, textColor, accentColor, typo, 'rtl');
      arY += sectionFontSize * (Math.ceil(productData.directions.ar.length / 50) + 3.5);
    }

    if (productData.ingredients?.ar) {
      appendSection(doc, backAr, ns,
        'المكونات', productData.ingredients.ar,
        arX, arY, textWidth,
        headingFontSize, sectionFontSize,
        headingColor, textColor, accentColor, typo, 'rtl');
      arY += sectionFontSize * (Math.ceil(productData.ingredients.ar.length / 50) + 3.5);
    }

    if (productData.warnings?.ar) {
      appendSection(doc, backAr, ns,
        'تحذيرات', productData.warnings.ar,
        arX, arY, textWidth,
        headingFontSize, sectionFontSize,
        '#c00', textColor, '#c00', typo, 'rtl');
      arY += sectionFontSize * (Math.ceil(productData.warnings.ar.length / 50) + 3.5);
    }

    if (productData.storage?.ar) {
      appendSection(doc, backAr, ns,
        'التخزين', productData.storage.ar,
        arX, arY, textWidth,
        headingFontSize, sectionFontSize,
        headingColor, textColor, accentColor, typo, 'rtl');
      arY += sectionFontSize * 2.5;
    }

    currentY = arY;
  }

  // ── Fixed Company Information ─────────────────────────────
  if (backFixed && brandProfile?.companyInfo) {
    const infoY = y + h * 0.82;
    const infoText = doc.createElementNS(ns, 'text');
    infoText.setAttribute('x', x + margin);
    infoText.setAttribute('y', infoY);
    infoText.setAttribute('font-size', sectionFontSize * 0.75);
    infoText.setAttribute('fill', textColor);
    infoText.setAttribute('font-family', typo?.body || 'Inter');
    infoText.setAttribute('opacity', '0.7');
    infoText.textContent = brandProfile.companyInfo;
    backFixed.appendChild(infoText);
  }

  // ── Barcode placeholder ───────────────────────────────────
  if (backBarcode) {
    const bcW = w * 0.28;
    const bcH = bcW * 0.6;
    const bcX = x + w - margin - bcW;
    const bcY = y + h - margin - bcH;

    const bcRect = doc.createElementNS(ns, 'rect');
    bcRect.setAttribute('x', bcX); bcRect.setAttribute('y', bcY);
    bcRect.setAttribute('width', bcW); bcRect.setAttribute('height', bcH);
    bcRect.setAttribute('fill', '#ffffff');
    bcRect.setAttribute('stroke', textColor);
    bcRect.setAttribute('stroke-width', '0.5');
    bcRect.setAttribute('data-placeholder', 'barcode');
    backBarcode.appendChild(bcRect);

    const bcLabel = doc.createElementNS(ns, 'text');
    bcLabel.setAttribute('x', bcX + bcW / 2);
    bcLabel.setAttribute('y', bcY + bcH / 2 + sectionFontSize * 0.35);
    bcLabel.setAttribute('text-anchor', 'middle');
    bcLabel.setAttribute('font-size', sectionFontSize * 0.7);
    bcLabel.setAttribute('fill', '#666');
    bcLabel.setAttribute('font-family', typo?.body || 'Inter');
    bcLabel.textContent = 'BARCODE';
    backBarcode.appendChild(bcLabel);
  }
}

// ── Side Panel Renderer ───────────────────────────────────────

function renderSidePanel(doc, concept, productData, panel, side) {
  const { x, y, w, h } = panel;
  const colors = concept.colorPalette;
  const ns = 'http://www.w3.org/2000/svg';
  const sideBg = doc.getElementById('side-text');

  if (!sideBg) return;

  // Background
  const rect = doc.createElementNS(ns, 'rect');
  rect.setAttribute('x', x); rect.setAttribute('y', y);
  rect.setAttribute('width', w); rect.setAttribute('height', h);
  rect.setAttribute('fill', colors.secondary || colors.primary || '#1a2235');
  sideBg.appendChild(rect);

  // Brand name rotated
  const brandText = doc.createElementNS(ns, 'text');
  brandText.setAttribute('x', x + w / 2);
  brandText.setAttribute('y', y + h / 2);
  brandText.setAttribute('text-anchor', 'middle');
  brandText.setAttribute('font-size', Math.min(w * 0.4, h * 0.05));
  brandText.setAttribute('fill', colors.accent || '#f5a623');
  brandText.setAttribute('font-family', concept.typography?.heading || 'Inter');
  brandText.setAttribute('font-weight', '700');
  brandText.setAttribute('transform', `rotate(-90, ${x + w / 2}, ${y + h / 2})`);
  brandText.textContent = (productData.brand || productData.productName || '').toUpperCase();
  sideBg.appendChild(brandText);
}

// ── Section Helper ────────────────────────────────────────────

function appendSection(doc, group, ns, heading, content, x, y, width,
                        headingSize, bodySize, headingColor, textColor, accentColor,
                        typo, direction) {
  const isRTL = direction === 'rtl';
  const anchor = isRTL ? 'end' : 'start';
  const fontFamily = isRTL
    ? (typo?.body || 'Noto Naskh Arabic')
    : (typo?.body || 'Inter');

  // Section heading
  const headEl = doc.createElementNS(ns, 'text');
  headEl.setAttribute('x', x);
  headEl.setAttribute('y', y);
  headEl.setAttribute('text-anchor', anchor);
  headEl.setAttribute('font-size', headingSize);
  headEl.setAttribute('fill', headingColor);
  headEl.setAttribute('font-family', typo?.heading || 'Inter');
  headEl.setAttribute('font-weight', '700');
  headEl.setAttribute('direction', direction);
  headEl.textContent = heading;
  group.appendChild(headEl);

  // Accent underline
  const lineW = Math.min(heading.length * headingSize * 0.6, width * 0.5);
  const lineX = isRTL ? x - lineW : x;
  const lineEl = doc.createElementNS(ns, 'line');
  lineEl.setAttribute('x1', lineX);
  lineEl.setAttribute('y1', y + headingSize * 0.25);
  lineEl.setAttribute('x2', lineX + lineW);
  lineEl.setAttribute('y2', y + headingSize * 0.25);
  lineEl.setAttribute('stroke', accentColor);
  lineEl.setAttribute('stroke-width', '0.5');
  group.appendChild(lineEl);

  // Content text (simple single-line; multiline requires foreignObject or tspan per line)
  const maxLen = Math.floor(width / (bodySize * 0.55));
  const words = content.split(' ');
  let line = '';
  let lineY = y + headingSize * 1.5;
  const lineH = bodySize * 1.4;

  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word;
    if (testLine.length > maxLen && line) {
      const textEl = doc.createElementNS(ns, 'text');
      textEl.setAttribute('x', x);
      textEl.setAttribute('y', lineY);
      textEl.setAttribute('text-anchor', anchor);
      textEl.setAttribute('font-size', bodySize);
      textEl.setAttribute('fill', textColor);
      textEl.setAttribute('font-family', fontFamily);
      textEl.setAttribute('direction', direction);
      textEl.textContent = line;
      group.appendChild(textEl);
      line = word;
      lineY += lineH;
    } else {
      line = testLine;
    }
  }

  // Final line
  if (line) {
    const textEl = doc.createElementNS(ns, 'text');
    textEl.setAttribute('x', x);
    textEl.setAttribute('y', lineY);
    textEl.setAttribute('text-anchor', anchor);
    textEl.setAttribute('font-size', bodySize);
    textEl.setAttribute('fill', textColor);
    textEl.setAttribute('font-family', fontFamily);
    textEl.setAttribute('direction', direction);
    textEl.textContent = line;
    group.appendChild(textEl);
  }
}
