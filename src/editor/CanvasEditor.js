/**
 * CanvasEditor.js
 * The main interactive SVG canvas orchestrator.
 * Wraps the SVG, manages panning/zooming, integrates selection and history.
 */

import { SelectionManager } from './SelectionManager.js';
import { HistoryManager } from './HistoryManager.js';
import { TextEditor } from './TextEditor.js';
import { showToast } from '../components/Toast.js';

export class CanvasEditor {
  constructor(container) {
    this.container = container;
    
    // Create wrapper for panning/zooming
    this.viewport = document.createElement('div');
    this.viewport.className = 'canvas-viewport';
    this.container.appendChild(this.viewport);

    this.svgContainer = document.createElement('div');
    this.svgContainer.className = 'svg-container';
    this.viewport.appendChild(this.svgContainer);

    this.svg = null;
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };

    this.selectionManager = null;
    this.historyManager = new HistoryManager(this);
    this.textEditor = new TextEditor(this.svgContainer);

    this._bindViewportEvents();
  }

  /**
   * Load an SVG string into the canvas.
   */
  loadSvg(svgString) {
    this.svgContainer.innerHTML = svgString;
    this.svg = this.svgContainer.querySelector('svg');
    
    if (!this.svg) {
      throw new Error('Invalid SVG content');
    }

    // Ensure it fits the container via CSS
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.svg.style.display = 'block';

    // Initialize managers
    this.selectionManager = new SelectionManager(this.svg, this.svgContainer);
    
    // Bind text editing
    this.svg.addEventListener('dblclick', (e) => {
      const textEl = e.target.closest('text, tspan');
      if (textEl && !this.selectionManager._isProtected(textEl)) {
        this.textEditor.startEditing(textEl, () => {
          this.historyManager.pushState(this.getSvgString());
        });
      }
    });

    // Reset view
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this._updateTransform();
    
    // Initial history state
    this.historyManager.pushState(this.getSvgString());
  }

  /**
   * Get the current SVG string (without editor artifacts).
   */
  getSvgString() {
    if (!this.svg) return '';
    const clone = this.svg.cloneNode(true);
    const overlay = clone.getElementById('editor-overlay');
    if (overlay) overlay.remove();
    return new XMLSerializer().serializeToString(clone);
  }

  // ── Panning & Zooming ──────────────────────────────────────

  _bindViewportEvents() {
    // Zoom on wheel
    this.viewport.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.setZoom(this.zoom + delta, e.clientX, e.clientY);
      } else {
        // Pan
        this.panX -= e.deltaX;
        this.panY -= e.deltaY;
        this._updateTransform();
      }
    }, { passive: false });

    // Middle click pan
    this.viewport.addEventListener('mousedown', (e) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle click or Alt+Click
        e.preventDefault();
        this.isDragging = true;
        this.dragStart = { x: e.clientX - this.panX, y: e.clientY - this.panY };
        this.viewport.style.cursor = 'grabbing';
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.panX = e.clientX - this.dragStart.x;
      this.panY = e.clientY - this.dragStart.y;
      this._updateTransform();
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.viewport.style.cursor = '';
      }
    });
  }

  setZoom(newZoom, originX, originY) {
    const oldZoom = this.zoom;
    this.zoom = Math.max(0.1, Math.min(5, newZoom));

    // Optional: Zoom toward mouse cursor (omitted for brevity, zooming center)
    
    this._updateTransform();
    
    // Update selection overlay
    if (this.selectionManager) {
      this.selectionManager.update();
    }
  }

  zoomIn() { this.setZoom(this.zoom + 0.2); }
  zoomOut() { this.setZoom(this.zoom - 0.2); }
  resetView() {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this._updateTransform();
    if (this.selectionManager) this.selectionManager.update();
  }

  _updateTransform() {
    this.svgContainer.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
  }
}
