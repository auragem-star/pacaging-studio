/**
 * TextEditor.js
 * Inline text editing for SVG <text> elements.
 * Creates an overlay textarea exactly over the SVG text.
 */

export class TextEditor {
  constructor(svgContainer) {
    this.container = svgContainer;
    this.activeElement = null;
    this.overlay = null;
    this.onSave = null; // Callback when edit completes
  }

  /**
   * Start editing a text element.
   */
  startEditing(textElement, onSaveCallback) {
    if (this.activeElement) this.stopEditing();

    this.activeElement = textElement;
    this.onSave = onSaveCallback;

    // Get screen coordinates of the text element
    const rect = textElement.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();

    // Create textarea overlay
    this.overlay = document.createElement('textarea');
    this.overlay.className = 'text-editor-overlay';
    this.overlay.value = textElement.textContent;
    
    // Match styles
    const style = window.getComputedStyle(textElement);
    this.overlay.style.position = 'absolute';
    this.overlay.style.left = `${rect.left - containerRect.left}px`;
    this.overlay.style.top = `${rect.top - containerRect.top}px`;
    this.overlay.style.width = `${Math.max(rect.width + 40, 100)}px`;
    this.overlay.style.height = `${Math.max(rect.height + 20, 40)}px`;
    this.overlay.style.fontFamily = style.fontFamily;
    this.overlay.style.fontSize = style.fontSize;
    this.overlay.style.fontWeight = style.fontWeight;
    this.overlay.style.color = style.fill;
    this.overlay.style.direction = textElement.getAttribute('direction') || 'ltr';
    this.overlay.style.textAlign = textElement.getAttribute('text-anchor') === 'middle' ? 'center' : 
                                  (textElement.getAttribute('text-anchor') === 'end' ? 'right' : 'left');
    
    // Hide original text temporarily
    this.activeElement.style.visibility = 'hidden';

    // Add to DOM
    this.container.appendChild(this.overlay);
    this.overlay.focus();
    this.overlay.select();

    // Event listeners for stopping edit
    this.overlay.addEventListener('blur', () => this.stopEditing(true));
    this.overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.stopEditing(false); // cancel
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.stopEditing(true); // save
      }
    });
  }

  /**
   * Stop editing and optionally save changes.
   */
  stopEditing(save = true) {
    if (!this.activeElement || !this.overlay) return;

    if (save) {
      const newText = this.overlay.value.trim();
      if (newText !== this.activeElement.textContent) {
        this.activeElement.textContent = newText;
        if (this.onSave) this.onSave(this.activeElement);
      }
    }

    this.activeElement.style.visibility = '';
    this.overlay.remove();
    this.overlay = null;
    this.activeElement = null;
    this.onSave = null;
  }
}
