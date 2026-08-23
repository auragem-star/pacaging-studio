/**
 * SvgDielineParser.js
 * Detailed SVG dieline analysis beyond what DielectricEngine provides.
 * Focused on panel bounding box computation and safe area detection.
 */

import { dielineEngine } from '../core/DielectricEngine.js';

/**
 * Parse and fully analyze an SVG dieline file.
 * Returns geometry + confidence score + panel map.
 *
 * @param {File} file - Uploaded SVG file
 * @returns {DielineAnalysis}
 */
export async function parseSvgDieline(file) {
  if (file.type !== 'image/svg+xml' && !file.name.endsWith('.svg')) {
    throw new Error('File must be an SVG (.svg) for reliable dieline parsing.');
  }

  const text = await file.text();
  const geometry = dielineEngine.loadFromSvgString(text);

  return buildAnalysis(geometry, file.name);
}

/**
 * Build a full analysis object from extracted geometry.
 */
export function buildAnalysis(geometry, filename = '') {
  // Assess confidence based on what we found
  let confidence = 'high';
  const warnings = [];

  if (geometry.panels.length === 0) {
    confidence = 'low';
    warnings.push({
      type: 'no-panels',
      message: 'No panels could be automatically detected. Please label panels manually.',
      requiresUserInput: true,
    });
  } else if (geometry.panels.length < 2) {
    confidence = 'medium';
    warnings.push({
      type: 'few-panels',
      message: `Only ${geometry.panels.length} panel(s) detected. You may need to identify additional panels manually.`,
      requiresUserInput: true,
    });
  }

  if (geometry.cutPaths.length === 0 && geometry.foldPaths.length === 0) {
    confidence = 'low';
    warnings.push({
      type: 'no-structural-paths',
      message: 'No cut or fold lines were detected. The dieline may use non-standard colors.',
      requiresUserInput: true,
    });
  }

  const unidentifiedPanels = geometry.unknownPaths.length;
  if (unidentifiedPanels > 0) {
    warnings.push({
      type: 'unknown-paths',
      message: `${unidentifiedPanels} path(s) could not be classified as cut or fold lines.`,
      requiresUserInput: false,
    });
  }

  // Build default panel assignments (user will confirm/override)
  const panelAssignments = buildDefaultPanelAssignments(geometry);

  return {
    filename,
    geometry,
    confidence,
    warnings,
    panelAssignments,
    requiresUserConfirmation: confidence !== 'high' || warnings.some(w => w.requiresUserInput),
  };
}

/**
 * Build panel type assignments. If automatic detection found panels, use them.
 * Otherwise return empty slots for the user to fill.
 */
function buildDefaultPanelAssignments(geometry) {
  const assignments = {
    front: null,
    back: null,
    left: null,
    right: null,
    top: null,
    bottom: null,
    flaps: [],
  };

  for (const panel of geometry.panels) {
    const t = panel.type;
    if (t === 'front' && !assignments.front) assignments.front = panel;
    else if (t === 'back'  && !assignments.back)  assignments.back  = panel;
    else if (t === 'left'  && !assignments.left)  assignments.left  = panel;
    else if (t === 'right' && !assignments.right) assignments.right = panel;
    else if (t === 'top'   && !assignments.top)   assignments.top   = panel;
    else if (t === 'bottom' && !assignments.bottom) assignments.bottom = panel;
    else if (t === 'flap') assignments.flaps.push(panel);
  }

  return assignments;
}

/**
 * Supported dieline formats with user messaging.
 */
export const DIELINE_FORMAT_INFO = {
  svg: {
    supported: true,
    recommended: true,
    message: 'SVG is the recommended format for dielines. Full fidelity, fully editable.',
  },
  pdf: {
    supported: true,
    recommended: false,
    message: 'PDF is supported with best-effort path extraction. SVG is recommended for best results.',
  },
  ai: {
    supported: false,
    recommended: false,
    message: 'Native Adobe Illustrator (.ai) files cannot be reliably parsed in the browser. Please export your dieline as SVG or PDF from Illustrator (File > Save As > SVG or File > Export > PDF).',
  },
};

export function getDielineFormatInfo(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.svg')) return DIELINE_FORMAT_INFO.svg;
  if (name.endsWith('.pdf')) return DIELINE_FORMAT_INFO.pdf;
  if (name.endsWith('.ai'))  return DIELINE_FORMAT_INFO.ai;
  return {
    supported: false,
    recommended: false,
    message: `Unsupported file format: ${file.name.split('.').pop().toUpperCase()}. Please use SVG (recommended) or PDF.`,
  };
}
