/**
 * LayerPanel.js
 * Renders the SVG layer hierarchy and visibility/lock toggles.
 */

import { layerManager } from '../core/LayerManager.js';
import { icon } from './Icons.js';

export class LayerPanel {
  constructor(container) {
    this.container = container;
    this.container.className = 'layer-panel';
    
    // Header
    const header = document.createElement('div');
    header.className = 'panel-header';
    header.innerHTML = `
      <h3 style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">
        Layers
      </h3>
    `;
    this.container.appendChild(header);

    // List container
    this.list = document.createElement('div');
    this.list.className = 'layer-list';
    this.container.appendChild(this.list);

    // Subscribe to changes
    layerManager.onChange(() => this.render());
  }

  render() {
    this.list.innerHTML = '';
    const layers = layerManager.getLayers();
    
    // Group by parent
    const topLayers = layers.filter(l => !l.parent).sort((a, b) => b.order - a.order); // Reverse order for top-to-bottom visual stacking
    
    topLayers.forEach(layer => {
      this.list.appendChild(this._createLayerItem(layer, 0));
      
      const children = layers
        .filter(l => l.parent === layer.id)
        .sort((a, b) => b.order - a.order);
        
      children.forEach(child => {
        this.list.appendChild(this._createLayerItem(child, 1));
      });
    });
  }

  _createLayerItem(layer, depth) {
    const item = document.createElement('div');
    item.className = 'layer-item';
    if (layer.id === 'dieline') item.classList.add('layer-dieline');
    item.style.paddingLeft = `${depth * 16 + 8}px`;

    // Vis toggle
    const visBtn = document.createElement('button');
    visBtn.className = 'btn-icon';
    visBtn.title = layer.visible ? 'Hide' : 'Show';
    visBtn.appendChild(icon(layer.visible ? 'eye' : 'eyeOff', '14px'));
    visBtn.onclick = () => {
      layerManager.setVisible(layer.id, !layer.visible);
      // Toggle actual SVG element visibility
      const svgEl = document.getElementById(layer.id);
      if (svgEl) svgEl.style.display = layer.visible ? 'none' : '';
    };

    // Label
    const label = document.createElement('span');
    label.className = 'layer-label';
    label.textContent = layer.label;

    // Lock toggle
    const lockBtn = document.createElement('button');
    lockBtn.className = 'btn-icon';
    lockBtn.title = layer.locked ? 'Unlock' : 'Lock';
    if (layer.locked) lockBtn.style.color = 'var(--accent)';
    lockBtn.appendChild(icon(layer.locked ? 'lock' : 'unlock', '14px'));
    lockBtn.onclick = () => {
      if (layer.id === 'dieline' && layer.locked) {
        if (!confirm('Warning: Unlocking the dieline allows it to be modified or deleted, which breaks print validation. Continue?')) {
          return;
        }
      }
      layerManager.setLocked(layer.id, !layer.locked);
      
      // Toggle actual SVG element pointer-events
      const svgEl = document.getElementById(layer.id);
      if (svgEl) {
        if (layer.locked) {
          svgEl.removeAttribute('data-locked');
          svgEl.style.pointerEvents = '';
        } else {
          svgEl.setAttribute('data-locked', 'true');
          svgEl.style.pointerEvents = 'none';
        }
      }
    };

    item.appendChild(visBtn);
    item.appendChild(label);
    item.appendChild(lockBtn);
    return item;
  }
}
