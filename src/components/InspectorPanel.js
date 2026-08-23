/**
 * InspectorPanel.js
 * Shows properties of the currently selected element in the canvas.
 */

export class InspectorPanel {
  constructor(container, selectionManager) {
    this.container = container;
    this.container.className = 'inspector-panel';
    this.selectionManager = selectionManager;
    
    // Header
    const header = document.createElement('div');
    header.className = 'panel-header';
    header.innerHTML = `
      <h3 style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">
        Properties
      </h3>
    `;
    this.container.appendChild(header);

    // Content area
    this.content = document.createElement('div');
    this.content.className = 'inspector-content';
    this.content.style.padding = '16px';
    this.container.appendChild(this.content);

    // Subscribe to selection changes
    this.selectionManager.onChange(el => this.render(el));
    this.render(null);
  }

  render(element) {
    this.content.innerHTML = '';
    
    if (!element) {
      this.content.innerHTML = `<div class="empty-state">No element selected</div>`;
      return;
    }

    const tag = element.tagName.toLowerCase();
    
    // Element info
    const infoHeader = document.createElement('div');
    infoHeader.style.marginBottom = '16px';
    infoHeader.style.paddingBottom = '16px';
    infoHeader.style.borderBottom = '1px solid var(--border)';
    
    let typeLabel = tag.toUpperCase();
    if (element.getAttribute('data-placeholder')) typeLabel = element.getAttribute('data-placeholder').toUpperCase() + ' PLACEHOLDER';
    if (element.getAttribute('data-asset-type')) typeLabel = element.getAttribute('data-asset-type').toUpperCase().replace('_', ' ') + ' ASSET';
    
    infoHeader.innerHTML = `
      <div style="font-weight:600;color:var(--text);margin-bottom:4px">${typeLabel}</div>
      <div style="font-size:12px;color:var(--text-muted)">ID: ${element.id || 'none'}</div>
    `;
    this.content.appendChild(infoHeader);

    // Protection warning
    if (element.getAttribute('data-fixed') === 'true' || element.closest('#dieline')) {
      const warning = document.createElement('div');
      warning.style.padding = '8px 12px';
      warning.style.background = 'rgba(245, 166, 35, 0.1)';
      warning.style.borderLeft = '3px solid var(--accent)';
      warning.style.borderRadius = '0 4px 4px 0';
      warning.style.marginBottom = '16px';
      warning.style.fontSize = '12px';
      warning.style.color = 'var(--text)';
      warning.textContent = 'This is a protected element. Some properties cannot be modified.';
      this.content.appendChild(warning);
    }

    // Colors
    this._renderPropertyBlock('Colors', [
      { label: 'Fill', attr: 'fill', type: 'color' },
      { label: 'Stroke', attr: 'stroke', type: 'color' }
    ], element);

    // Typography
    if (tag === 'text' || tag === 'tspan') {
      this._renderPropertyBlock('Typography', [
        { label: 'Font Family', attr: 'font-family', type: 'text' },
        { label: 'Font Size', attr: 'font-size', type: 'number', step: 0.5 },
        { label: 'Weight', attr: 'font-weight', type: 'select', options: ['300','400','500','600','700','800'] },
        { label: 'Letter Spacing', attr: 'letter-spacing', type: 'number', step: 0.1 }
      ], element);
    }
  }

  _renderPropertyBlock(title, props, element) {
    const block = document.createElement('div');
    block.style.marginBottom = '24px';
    
    const h = document.createElement('div');
    h.style.fontSize = '11px';
    h.style.textTransform = 'uppercase';
    h.style.letterSpacing = '1px';
    h.style.color = 'var(--text-muted)';
    h.style.marginBottom = '12px';
    h.textContent = title;
    block.appendChild(h);

    props.forEach(prop => {
      const val = element.getAttribute(prop.attr) || element.style[prop.attr] || '';
      
      const row = document.createElement('div');
      row.className = 'form-group';
      row.style.marginBottom = '12px';
      
      const label = document.createElement('label');
      label.textContent = prop.label;
      label.style.display = 'block';
      label.style.marginBottom = '4px';
      label.style.fontSize = '12px';
      row.appendChild(label);

      let input;
      if (prop.type === 'select') {
        input = document.createElement('select');
        input.className = 'form-control';
        prop.options.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt; o.textContent = opt;
          if (val === opt) o.selected = true;
          input.appendChild(o);
        });
      } else {
        input = document.createElement('input');
        input.type = prop.type === 'color' ? 'text' : prop.type;
        input.className = 'form-control';
        input.value = val;
        if (prop.step) input.step = prop.step;
      }
      
      input.onchange = (e) => {
        // Simple write-back — robust implementation would use HistoryManager
        const newVal = e.target.value;
        if (newVal) element.setAttribute(prop.attr, newVal);
        else element.removeAttribute(prop.attr);
      };

      row.appendChild(input);
      block.appendChild(row);
    });

    this.content.appendChild(block);
  }
}
