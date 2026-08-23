/**
 * LayerManager.js
 * Manages the SVG layer (group) hierarchy for the packaging canvas.
 * Creates, controls, and serializes the layer structure.
 *
 * Layer order (bottom to top):
 *   DIELINE - LOCKED  (always at bottom, locked)
 *   BACK ARTWORK
 *   SIDE PANELS
 *   FRONT ARTWORK
 *   BRAND ASSETS
 *   PRODUCT CONTENT
 *   GRAPHICS
 */

export const LAYER_DEFS = [
  { id: 'dieline',            label: 'DIELINE - LOCKED',    locked: true,  visible: true, order: 0 },
  { id: 'back-artwork',       label: 'BACK ARTWORK',         locked: false, visible: true, order: 1 },
  { id: 'back-bg',            label: '↳ Background',         locked: false, visible: true, order: 1, parent: 'back-artwork' },
  { id: 'back-english',       label: '↳ English Content',    locked: false, visible: true, order: 2, parent: 'back-artwork' },
  { id: 'back-arabic',        label: '↳ Arabic Content',     locked: false, visible: true, order: 3, parent: 'back-artwork' },
  { id: 'back-icons',         label: '↳ Icons',              locked: false, visible: true, order: 4, parent: 'back-artwork' },
  { id: 'back-fixed-info',    label: '↳ Fixed Company Info', locked: false, visible: true, order: 5, parent: 'back-artwork' },
  { id: 'back-barcode',       label: '↳ Barcode',            locked: false, visible: true, order: 6, parent: 'back-artwork' },
  { id: 'side-panels',        label: 'SIDE PANELS',          locked: false, visible: true, order: 2 },
  { id: 'side-text',          label: '↳ Text',               locked: false, visible: true, order: 1, parent: 'side-panels' },
  { id: 'side-graphics',      label: '↳ Graphics',           locked: false, visible: true, order: 2, parent: 'side-panels' },
  { id: 'front-artwork',      label: 'FRONT ARTWORK',        locked: false, visible: true, order: 3 },
  { id: 'front-bg',           label: '↳ Background',         locked: false, visible: true, order: 1, parent: 'front-artwork' },
  { id: 'front-product-img',  label: '↳ Product Image',      locked: false, visible: true, order: 2, parent: 'front-artwork' },
  { id: 'front-logo',         label: '↳ Logo',               locked: false, visible: true, order: 3, parent: 'front-artwork' },
  { id: 'front-name',         label: '↳ Product Name',       locked: false, visible: true, order: 4, parent: 'front-artwork' },
  { id: 'front-claims',       label: '↳ Claims',             locked: false, visible: true, order: 5, parent: 'front-artwork' },
  { id: 'front-size',         label: '↳ Product Size',       locked: false, visible: true, order: 6, parent: 'front-artwork' },
  { id: 'front-graphics',     label: '↳ Graphics',           locked: false, visible: true, order: 7, parent: 'front-artwork' },
  { id: 'brand-assets',       label: 'BRAND ASSETS',         locked: false, visible: true, order: 4 },
  { id: 'product-content',    label: 'PRODUCT CONTENT',      locked: false, visible: true, order: 5 },
  { id: 'graphics',           label: 'GRAPHICS',             locked: false, visible: true, order: 6 },
];

export class LayerManager {
  constructor() {
    this._state = new Map(); // id → { locked, visible }
    for (const def of LAYER_DEFS) {
      this._state.set(def.id, { locked: def.locked, visible: def.visible });
    }
    this._listeners = [];
  }

  onChange(fn) { this._listeners.push(fn); }
  _notify() { this._listeners.forEach(fn => fn(this.getLayers())); }

  getLayers() {
    return LAYER_DEFS.map(def => ({
      ...def,
      ...this._state.get(def.id),
    }));
  }

  getTopLevelLayers() {
    return this.getLayers().filter(l => !l.parent);
  }

  isLocked(layerId) {
    return this._state.get(layerId)?.locked ?? false;
  }

  isVisible(layerId) {
    return this._state.get(layerId)?.visible ?? true;
  }

  setLocked(layerId, locked) {
    if (layerId === 'dieline' && !locked) {
      // Warn but allow — user can unlock dieline manually
      console.warn('[LayerManager] Unlocking DIELINE layer — structural protection removed!');
    }
    const s = this._state.get(layerId);
    if (s) { s.locked = locked; this._notify(); }
  }

  setVisible(layerId, visible) {
    const s = this._state.get(layerId);
    if (s) { s.visible = visible; this._notify(); }
  }

  /**
   * Build a skeleton SVG wrapper with all layers as empty <g> elements.
   * The dieline content will be injected separately.
   */
  buildSvgSkeleton(viewBox, width, height) {
    const vb = viewBox
      ? `viewBox="${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}"`
      : `viewBox="0 0 ${width} ${height}"`;

    const wAttr = width  ? `width="${width}"`  : '';
    const hAttr = height ? `height="${height}"` : '';

    // Only top-level layers as direct children of SVG
    const topLayers = LAYER_DEFS.filter(l => !l.parent);
    const subLayers = LAYER_DEFS.filter(l => !!l.parent);

    const buildSubLayers = (parentId) => {
      return subLayers
        .filter(l => l.parent === parentId)
        .map(l => `    <g id="${l.id}" inkscape:label="${l.label}" data-layer="true"></g>`)
        .join('\n');
    };

    const layerGroups = topLayers.map(l => {
      const lockedAttr  = l.locked  ? ' data-locked="true"' : '';
      const pEvents     = l.locked  ? ' style="pointer-events:none;"' : '';
      const subs = buildSubLayers(l.id);
      return `  <g id="${l.id}" inkscape:label="${l.label}" data-layer="true"${lockedAttr}${pEvents}>\n${subs}\n  </g>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     ${vb} ${wAttr} ${hAttr}>
  <title>Packaging Design — PackStudio</title>
  <defs id="defs"></defs>
${layerGroups}
</svg>`;
  }

  /**
   * Given an element node and a target layer id, check if placement is allowed.
   */
  canPlaceIn(layerId) {
    return !this.isLocked(layerId);
  }
}

export const layerManager = new LayerManager();
