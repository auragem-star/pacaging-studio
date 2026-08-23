/**
 * HistoryManager.js
 * Undo/Redo stack for the canvas editor.
 * Works by snapshotting the SVG string state on changes.
 */

export class HistoryManager {
  constructor(canvasEditor, maxStates = 50) {
    this.editor = canvasEditor;
    this.maxStates = maxStates;
    this.undoStack = [];
    this.redoStack = [];
    this._listeners = [];
    this._isRestoring = false;
  }

  onChange(fn) {
    this._listeners.push(fn);
  }

  _notify() {
    this._listeners.forEach(fn => fn({
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }));
  }

  canUndo() { return this.undoStack.length > 0; }
  canRedo() { return this.redoStack.length > 0; }

  /**
   * Save a snapshot of the current state.
   */
  pushState(svgString) {
    if (this._isRestoring) return;
    
    // Don't push if it's identical to current top of stack
    if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === svgString) {
      return;
    }

    this.undoStack.push(svgString);
    if (this.undoStack.length > this.maxStates) {
      this.undoStack.shift(); // drop oldest
    }
    
    // Clear redo stack on new action
    this.redoStack = [];
    this._notify();
  }

  /**
   * Undo to previous state.
   */
  undo(currentSvgString) {
    if (!this.canUndo()) return null;
    
    this._isRestoring = true;
    const previousState = this.undoStack.pop();
    
    // Save current state to redo stack
    if (currentSvgString) {
      this.redoStack.push(currentSvgString);
    }
    
    this._notify();
    this._isRestoring = false;
    return previousState;
  }

  /**
   * Redo to next state.
   */
  redo(currentSvgString) {
    if (!this.canRedo()) return null;
    
    this._isRestoring = true;
    const nextState = this.redoStack.pop();
    
    // Save current state to undo stack
    if (currentSvgString) {
      this.undoStack.push(currentSvgString);
    }
    
    this._notify();
    this._isRestoring = false;
    return nextState;
  }
}
