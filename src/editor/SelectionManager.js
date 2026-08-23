/**
 * SelectionManager.js
 * Manages the selection state of SVG elements in the canvas.
 * Draws bounding box handles and handles click-to-select.
 */

export class SelectionManager {
  constructor(svgElement, editorContainer) {
    this.svg = svgElement;
    this.container = editorContainer;
    this.selectedElement = null;
    this._listeners = [];

    // Create selection overlay layer if it doesn't exist
    this.overlay = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.overlay.id = 'editor-overlay';
    this.overlay.setAttribute('data-editor-only', 'true');
    this.overlay.style.pointerEvents = 'none'; // let clicks pass through
    this.svg.appendChild(this.overlay);

    this.box = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    this.box.className = 'selection-box';
    this.box.setAttribute('fill', 'none');
    this.box.setAttribute('stroke', 'var(--accent)');
    this.box.setAttribute('stroke-width', '1.5');
    this.box.setAttribute('stroke-dasharray', '4,2');
    this.box.style.display = 'none';
    this.overlay.appendChild(this.box);

    this._bindEvents();
  }

  onChange(fn) { this._listeners.push(fn); }

  select(element) {
    if (this.selectedElement === element) return;
    
    // Check if element is selectable
    if (element && this._isProtected(element)) {
      // Can select, but styling might reflect locked state
    }

    this.selectedElement = element;
    this._updateOverlay();
    this._listeners.forEach(fn => fn(this.selectedElement));
  }

  clear() {
    this.select(null);
  }

  update() {
    this._updateOverlay();
  }

  _isProtected(element) {
    if (!element) return false;
    if (element.closest('#dieline')) return true;
    if (element.getAttribute('data-fixed') === 'true') return true;
    if (element.closest('[data-locked="true"]')) return true;
    return false;
  }

  _bindEvents() {
    this.svg.addEventListener('mousedown', (e) => {
      // Find closest selectable element (not SVG root, not overlay)
      const target = e.target;
      if (target === this.svg || target.closest('#editor-overlay')) {
        this.clear();
        return;
      }
      
      // Navigate up to find a valid graphic element
      const el = target.closest('rect, circle, path, text, image, g[data-layer="true"] > g');
      if (el) {
        this.select(el);
      } else {
        this.clear();
      }
    });

    // Update overlay on scroll/resize just in case
    window.addEventListener('resize', () => this._updateOverlay());
  }

  _updateOverlay() {
    if (!this.selectedElement) {
      this.box.style.display = 'none';
      return;
    }

    try {
      // getBBox returns coordinates in the current SVG coordinate system
      const bbox = this.selectedElement.getBBox();
      if (bbox.width === 0 && bbox.height === 0) {
        this.box.style.display = 'none';
        return;
      }

      // We need to transform the bbox if the element has transforms
      // For a robust editor, we'd calculate the transformed CTM.
      // For this MVP, we'll draw a simple box using getBoundingClientRect mapped back to SVG coords
      
      const pt = this.svg.createSVGPoint();
      const rect = this.selectedElement.getBoundingClientRect();
      const svgRect = this.svg.getBoundingClientRect();

      // Convert from screen coords to SVG coords
      // (Simplified approach assuming no complex viewBox scaling issues for now)
      const ctm = this.svg.getScreenCTM().inverse();
      
      pt.x = rect.left; pt.y = rect.top;
      const tl = pt.matrixTransform(ctm);
      
      pt.x = rect.right; pt.y = rect.bottom;
      const br = pt.matrixTransform(ctm);

      const padding = 2;
      this.box.setAttribute('x', tl.x - padding);
      this.box.setAttribute('y', tl.y - padding);
      this.box.setAttribute('width', br.x - tl.x + padding * 2);
      this.box.setAttribute('height', br.y - tl.y + padding * 2);
      
      if (this._isProtected(this.selectedElement)) {
        this.box.setAttribute('stroke', '#ff3b30'); // Red for locked
      } else {
        this.box.setAttribute('stroke', 'var(--accent)');
      }
      
      this.box.style.display = '';
    } catch (e) {
      // SVG might not be in DOM yet or getBBox failed
      this.box.style.display = 'none';
    }
  }
}
