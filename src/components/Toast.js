/**
 * Toast.js
 * Non-blocking notification toasts.
 */

let _container = null;

function getContainer() {
  if (!_container) _container = document.getElementById('toast-container');
  return _container;
}

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'warning'|'error'|'info'} type
 * @param {number} duration - ms, 0 = persistent
 */
export function showToast(message, type = 'info', duration = 4000) {
  const container = getContainer();
  if (!container) { console.log(`[Toast] ${type}: ${message}`); return; }

  const icons = {
    success: '✅',
    warning: '⚠️',
    error:   '❌',
    info:    'ℹ️',
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span style="font-size:1.1em">${icons[type] || ''}</span>
    <span style="flex:1">${message}</span>
    <button onclick="this.closest('.toast').remove()" 
            style="background:none;border:none;color:inherit;cursor:pointer;opacity:0.5;font-size:1.1em;padding:0 0 0 8px"
            aria-label="Dismiss">×</button>
  `;

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  return toast;
}

export function clearToasts() {
  const container = getContainer();
  if (container) container.innerHTML = '';
}
