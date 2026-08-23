/**
 * AssetVault.js
 * Manages fixed brand assets: logo, barcode, QR code.
 *
 * ABSOLUTE RULES enforced here:
 *  - Logo is NEVER regenerated, redrawn, or modified by AI
 *  - Barcode is NEVER regenerated or distorted
 *  - Assets are embedded as original data URIs
 *  - Proportions are always preserved
 */

import { saveAsset, getAsset, deleteAsset, fileToDataUri } from './Storage.js';

export const ASSET_TYPES = {
  LOGO:           'logo',
  BARCODE:        'barcode',
  QR_CODE:        'qr_code',
  PRODUCT_IMAGE:  'product_image',
  REFERENCE:      'reference',
  CERT_MARK:      'cert_mark',
  SOCIAL_ICON:    'social_icon',
};

export class AssetVault {
  constructor() {
    this._cache = new Map(); // assetId → asset object
  }

  /**
   * Store a fixed brand asset from a File object.
   * Returns the asset record.
   */
  async storeFromFile(file, type, brandProfileId = null, meta = {}) {
    const dataUri = await fileToDataUri(file);
    const dimensions = await this._getImageDimensions(dataUri);

    const asset = {
      type,
      brandProfileId,
      name: file.name,
      mimeType: file.type,
      dataUri,
      originalWidth: dimensions.width,
      originalHeight: dimensions.height,
      aspectRatio: dimensions.width / dimensions.height,
      meta,
      // Fixed assets are marked as protected
      isFixed: [ASSET_TYPES.LOGO, ASSET_TYPES.BARCODE, ASSET_TYPES.QR_CODE, ASSET_TYPES.CERT_MARK].includes(type),
    };

    const saved = await saveAsset(asset);
    this._cache.set(saved.id, saved);
    return saved;
  }

  /**
   * Load an asset by ID (from cache or DB).
   */
  async load(assetId) {
    if (this._cache.has(assetId)) return this._cache.get(assetId);
    const asset = await getAsset(assetId);
    if (asset) this._cache.set(assetId, asset);
    return asset;
  }

  /**
   * Remove an asset.
   */
  async remove(assetId) {
    this._cache.delete(assetId);
    await deleteAsset(assetId);
  }

  /**
   * Generate an SVG <image> element for a fixed asset.
   * PRESERVES original aspect ratio — never distorts.
   *
   * @param {string} assetId
   * @param {number} x  - Target x position
   * @param {number} y  - Target y position
   * @param {number} maxWidth  - Maximum width (height auto-computed from ratio)
   * @param {string} layerId   - Target layer id
   * @returns {string} SVG <image> element string
   */
  async buildSvgElement(assetId, x, y, maxWidth, layerId = null) {
    const asset = await this.load(assetId);
    if (!asset) throw new Error(`Asset ${assetId} not found in vault.`);

    // Validate: fixed assets cannot be placed in dieline layer
    if (layerId === 'dieline') {
      throw new Error('Fixed brand assets cannot be placed inside the dieline layer.');
    }

    // Compute dimensions preserving aspect ratio
    const ratio = asset.aspectRatio || 1;
    const w = maxWidth;
    const h = w / ratio;

    const protectedAttr = asset.isFixed ? ' data-fixed="true" data-ai-locked="true"' : '';
    const titleEl = asset.isFixed ? `<title>${asset.type} — FIXED ASSET — DO NOT MODIFY</title>` : '';

    return `<image id="asset-${assetId}" 
              data-asset-id="${assetId}"
              data-asset-type="${asset.type}"
              ${protectedAttr}
              x="${x}" y="${y}" 
              width="${w.toFixed(2)}" height="${h.toFixed(2)}"
              preserveAspectRatio="xMidYMid meet"
              href="${asset.dataUri}"
              xlink:href="${asset.dataUri}">${titleEl}</image>`;
  }

  /**
   * Build a barcode placement element with safety checks.
   * Ensures barcode is never scaled non-proportionally.
   */
  async buildBarcodeElement(assetId, x, y, targetWidth) {
    const asset = await this.load(assetId);
    if (!asset) throw new Error('Barcode asset not found.');
    if (asset.type !== ASSET_TYPES.BARCODE) throw new Error('Asset is not a barcode.');

    return this.buildSvgElement(assetId, x, y, targetWidth, 'back-barcode');
  }

  /**
   * Build a logo placement element.
   */
  async buildLogoElement(assetId, x, y, targetWidth, layerId = 'front-logo') {
    const asset = await this.load(assetId);
    if (!asset) throw new Error('Logo asset not found.');
    if (asset.type !== ASSET_TYPES.LOGO) throw new Error('Asset is not a logo.');

    return this.buildSvgElement(assetId, x, y, targetWidth, layerId);
  }

  // ── Helpers ───────────────────────────────────────────────

  _getImageDimensions(dataUri) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: 100, height: 100 }); // fallback
      img.src = dataUri;
    });
  }
}

export const assetVault = new AssetVault();
