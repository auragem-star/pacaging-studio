/**
 * DesignEditor.js
 * The main layout for the editor.
 * Combines CanvasEditor, LayerPanel, InspectorPanel, and the AI chat prompt.
 */

import { getProject, saveProject } from '../core/Storage.js';
import { CanvasEditor } from '../editor/CanvasEditor.js';
import { LayerPanel } from '../components/LayerPanel.js';
import { InspectorPanel } from '../components/InspectorPanel.js';
import { AiEditor } from '../ai/AiEditor.js';
import { dielineEngine } from '../core/DielectricEngine.js';
import { icon } from '../components/Icons.js';
import { showToast } from '../components/Toast.js';
import { validator } from '../core/Validator.js';
import { svgExporter } from '../core/SvgExporter.js';

export class DesignEditor {
  constructor(appContainer, params) {
    this.appContainer = appContainer;
    this.projectId = params.projectId;
    this.project = null;
    this.canvas = null;
    this.aiEditor = null;
  }

  async render() {
    this.appContainer.innerHTML = '';
    
    try {
      this.project = await getProject(this.projectId);
      if (!this.project) throw new Error('Project not found');

      // Load dieline engine
      if (!dielineEngine.isLoaded && this.project.dielineText) {
        dielineEngine.loadFromSvgString(this.project.dielineText);
      }

      this._buildLayout();
      this._initializeComponents();
      
    } catch (err) {
      console.error(err);
      showToast('Failed to load editor', 'error');
      window.app.navigate('dashboard');
    }
  }

  _buildLayout() {
    const layout = document.createElement('div');
    layout.className = 'editor-layout animate-fade-in';
    
    // Header
    const header = document.createElement('header');
    header.className = 'editor-header';
    header.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px">
        <button class="btn-icon" onclick="window.app.navigate('dashboard')">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <div style="font-weight:600">${this.project.name || 'Untitled'}</div>
        <div class="pill" style="font-size:11px;background:rgba(255,255,255,0.1)">${this.project.selectedConcept?.theme || 'Custom'}</div>
      </div>
      
      <div class="editor-toolbar">
        <button id="btn-undo" class="btn-icon" title="Undo">${icon('undo', '16px')}</button>
        <button id="btn-redo" class="btn-icon" title="Redo">${icon('redo', '16px')}</button>
        <div style="width:1px;height:16px;background:var(--border);margin:0 8px"></div>
        <button id="btn-zoom-out" class="btn-icon" title="Zoom Out">${icon('zoomOut', '16px')}</button>
        <button id="btn-zoom-in" class="btn-icon" title="Zoom In">${icon('zoomIn', '16px')}</button>
      </div>

      <div style="display:flex;gap:8px">
        <button id="btn-validate" class="btn btn-secondary">${icon('validate')} Validate</button>
        <button id="btn-export" class="btn btn-primary">${icon('download')} Export</button>
      </div>
    `;
    layout.appendChild(header);

    // Main workspace area
    const workspace = document.createElement('div');
    workspace.className = 'editor-workspace';

    // Left Sidebar (Layers)
    const leftSidebar = document.createElement('div');
    leftSidebar.className = 'editor-sidebar';
    leftSidebar.id = 'sidebar-left';
    workspace.appendChild(leftSidebar);

    // Center Canvas Area
    const centerArea = document.createElement('div');
    centerArea.style.flex = '1';
    centerArea.style.display = 'flex';
    centerArea.style.flexDirection = 'column';
    centerArea.style.position = 'relative';
    
    const canvasContainer = document.createElement('div');
    canvasContainer.id = 'canvas-container';
    canvasContainer.style.flex = '1';
    canvasContainer.style.position = 'relative';
    canvasContainer.style.overflow = 'hidden';
    centerArea.appendChild(canvasContainer);

    // AI Chat/Command Bar
    const aiBar = document.createElement('div');
    aiBar.className = 'ai-command-bar';
    aiBar.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px">
        <div style="color:var(--accent)">${icon('ai', '20px')}</div>
        <input type="text" id="ai-input" class="form-control" style="flex:1;background:transparent;border:none;padding:0;font-size:14px" placeholder="Describe changes (e.g., 'Make the product name larger' or 'Change background to dark blue')">
        <button id="btn-ai-submit" class="btn btn-primary" style="padding:6px 16px;min-height:32px">Apply</button>
      </div>
    `;
    centerArea.appendChild(aiBar);
    workspace.appendChild(centerArea);

    // Right Sidebar (Properties)
    const rightSidebar = document.createElement('div');
    rightSidebar.className = 'editor-sidebar';
    rightSidebar.id = 'sidebar-right';
    workspace.appendChild(rightSidebar);

    layout.appendChild(workspace);
    this.appContainer.appendChild(layout);
  }

  _initializeComponents() {
    // 1. Canvas
    const canvasContainer = document.getElementById('canvas-container');
    this.canvas = new CanvasEditor(canvasContainer);
    
    if (this.project.currentSvg) {
      this.canvas.loadSvg(this.project.currentSvg);
      
      // Auto-zoom to fit based on dieline geometry
      if (dielineEngine.geometry?.width) {
        const cw = canvasContainer.clientWidth;
        const dw = dielineEngine.geometry.width;
        if (cw > 0 && dw > 0) {
          this.canvas.setZoom(Math.min((cw - 100) / dw, 1));
        }
      }
    }

    // 2. Sidebars
    new LayerPanel(document.getElementById('sidebar-left'));
    new InspectorPanel(document.getElementById('sidebar-right'), this.canvas.selectionManager);

    // 3. AI Editor
    this.aiEditor = new AiEditor(this.canvas);
    
    const aiInput = document.getElementById('ai-input');
    const aiBtn = document.getElementById('btn-ai-submit');
    
    const submitAi = async () => {
      const val = aiInput.value.trim();
      if (!val) return;
      
      aiInput.disabled = true;
      aiBtn.disabled = true;
      aiBtn.innerHTML = icon('spinner', '16px');
      
      const currentSvg = this.canvas.getSvgString();
      const newSvg = await this.aiEditor.processCommand(val, currentSvg, {
        productData: this.project.productData,
        concept: this.project.selectedConcept
      });
      
      if (newSvg !== currentSvg) {
        this.canvas.loadSvg(newSvg);
        this.canvas.historyManager.pushState(newSvg);
        this._saveProjectThrottled();
      }
      
      aiInput.value = '';
      aiInput.disabled = false;
      aiBtn.disabled = false;
      aiBtn.textContent = 'Apply';
      aiInput.focus();
    };

    aiBtn.onclick = submitAi;
    aiInput.onkeydown = (e) => {
      if (e.key === 'Enter') submitAi();
    };

    // 4. Toolbar
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');
    
    this.canvas.historyManager.onChange(state => {
      undoBtn.style.opacity = state.canUndo ? '1' : '0.3';
      redoBtn.style.opacity = state.canRedo ? '1' : '0.3';
      this._saveProjectThrottled();
    });

    undoBtn.onclick = () => {
      const svg = this.canvas.historyManager.undo(this.canvas.getSvgString());
      if (svg) this.canvas.loadSvg(svg);
    };
    redoBtn.onclick = () => {
      const svg = this.canvas.historyManager.redo(this.canvas.getSvgString());
      if (svg) this.canvas.loadSvg(svg);
    };

    document.getElementById('btn-zoom-in').onclick = () => this.canvas.zoomIn();
    document.getElementById('btn-zoom-out').onclick = () => this.canvas.zoomOut();

    // 5. Validation & Export
    document.getElementById('btn-validate').onclick = () => {
      this._saveProjectThrottled();
      window.app.navigate('validation', { projectId: this.projectId });
    };
    
    document.getElementById('btn-export').onclick = () => {
      const svgText = svgExporter.buildExportSvg(this.canvas.svg, this.project.name);
      svgExporter.downloadSvg(svgText, `${this.project.name || 'packaging'}.svg`);
    };

    // Auto-save setup
    this.saveTimeout = null;
  }

  _saveProjectThrottled() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(async () => {
      this.project.currentSvg = this.canvas.getSvgString();
      await saveProject(this.project);
    }, 1000);
  }
}
