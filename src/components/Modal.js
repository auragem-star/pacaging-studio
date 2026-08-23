/**
 * Modal.js
 * Programmatic modal dialog system.
 */

import { icon } from './Icons.js';

let _container = null;

function getContainer() {
  if (!_container) _container = document.getElementById('modal-container');
  return _container;
}

/**
 * Open a modal dialog.
 * @param {object} options
 * @param {string} options.title - Modal title
 * @param {HTMLElement|string} options.content - Modal body content
 * @param {Array} options.buttons - Array of button configs { text, type, onClick }
 * @param {boolean} options.closeOnOverlay - Close when clicking overlay (default true)
 * @returns {object} Modal handle with close() method
 */
export function showModal(options) {
  const container = getContainer();
  if (!container) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn-icon';
  closeBtn.style.margin = '0 -8px 0 0';
  closeBtn.appendChild(icon('x'));
  
  const closeModal = () => {
    overlay.style.animation = 'fadeOut 0.2s ease forwards';
    setTimeout(() => overlay.remove(), 200);
  };

  closeBtn.onclick = closeModal;

  if (options.closeOnOverlay !== false) {
    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };
  }

  // Header
  const header = document.createElement('div');
  header.className = 'modal-header';
  const title = document.createElement('h3');
  title.textContent = options.title || '';
  header.appendChild(title);
  header.appendChild(closeBtn);
  modal.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.className = 'modal-body';
  if (typeof options.content === 'string') {
    body.innerHTML = options.content;
  } else if (options.content instanceof HTMLElement) {
    body.appendChild(options.content);
  }
  modal.appendChild(body);

  // Footer
  if (options.buttons && options.buttons.length > 0) {
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    
    options.buttons.forEach(btnConf => {
      const btn = document.createElement('button');
      btn.className = `btn ${btnConf.type === 'primary' ? 'btn-primary' : 'btn-secondary'}`;
      btn.textContent = btnConf.text;
      btn.onclick = () => {
        if (btnConf.onClick) {
          const keepOpen = btnConf.onClick();
          if (keepOpen !== true) closeModal();
        } else {
          closeModal();
        }
      };
      footer.appendChild(btn);
    });
    
    modal.appendChild(footer);
  }

  overlay.appendChild(modal);
  container.appendChild(overlay);

  return { close: closeModal };
}

/**
 * Helper for simple confirmation dialog.
 */
export function confirm(title, message, onConfirm, confirmText = 'Confirm', confirmType = 'primary') {
  return showModal({
    title,
    content: `<p>${message}</p>`,
    buttons: [
      { text: 'Cancel', type: 'secondary' },
      { text: confirmText, type: confirmType, onClick: onConfirm }
    ]
  });
}
