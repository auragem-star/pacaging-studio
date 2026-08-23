/**
 * FileDropZone.js
 * Drag and drop file upload component.
 */

import { icon } from './Icons.js';

/**
 * Create a drag and drop file upload zone.
 * @param {object} options
 * @param {string} options.title - Main text
 * @param {string} options.subtitle - Sub text (e.g. "SVG, PDF up to 10MB")
 * @param {string} options.accept - Input accept attribute (e.g. ".svg,.pdf")
 * @param {function} options.onFile - Callback when file is selected: (file) => {}
 * @returns {HTMLElement}
 */
export function createFileDropZone(options) {
  const zone = document.createElement('div');
  zone.className = 'drop-zone';

  const iconEl = document.createElement('div');
  iconEl.className = 'drop-zone-icon';
  iconEl.appendChild(icon('upload', '48px'));
  
  const title = document.createElement('div');
  title.className = 'drop-zone-title';
  title.textContent = options.title || 'Drag and drop file here';
  
  const subtitle = document.createElement('div');
  subtitle.className = 'drop-zone-sub';
  subtitle.textContent = options.subtitle || 'or click to browse';
  
  const input = document.createElement('input');
  input.type = 'file';
  if (options.accept) input.accept = options.accept;
  
  zone.appendChild(iconEl);
  zone.appendChild(title);
  zone.appendChild(subtitle);
  zone.appendChild(input);

  // Event handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  zone.addEventListener('dragenter', (e) => {
    handleDrag(e);
    zone.classList.add('dragover');
  });

  zone.addEventListener('dragleave', (e) => {
    handleDrag(e);
    zone.classList.remove('dragover');
  });

  zone.addEventListener('dragover', handleDrag);

  zone.addEventListener('drop', (e) => {
    handleDrag(e);
    zone.classList.remove('dragover');
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      input.files = e.dataTransfer.files;
      if (options.onFile) options.onFile(e.dataTransfer.files[0]);
    }
  });

  input.addEventListener('change', () => {
    if (input.files && input.files.length > 0) {
      if (options.onFile) options.onFile(input.files[0]);
    }
  });

  return zone;
}
