/**
 * ProjectWizard.js
 * Multi-step wizard to create a new project.
 * 1. Setup (Name, Brand)
 * 2. Upload Dieline
 * 3. Upload Content (Word Doc)
 * 4. AI Analysis & Confirmation
 */

import { saveProject } from '../core/Storage.js';
import { assetVault, ASSET_TYPES } from '../core/AssetVault.js';
import { parseSvgDieline } from '../parsers/SvgDielineParser.js';
import { parseDocx, extractProductDataFromText } from '../parsers/DocxParser.js';
import { analyzeProductData } from '../ai/ProductAnalyzer.js';
import { performMarketResearch } from '../ai/MarketResearcher.js';
import { createStepIndicator } from '../components/StepIndicator.js';
import { createFileDropZone } from '../components/FileDropZone.js';
import { showToast } from '../components/Toast.js';
import { gemini } from '../ai/GeminiClient.js';
import { icon } from '../components/Icons.js';

const STEPS = ['Setup', 'Dieline', 'Content'];

export class ProjectWizard {
  constructor(appContainer) {
    this.appContainer = appContainer;
    this.currentStep = 0;
    
    // Project state being built
    this.projectData = {
      name: '',
      brandProfileId: null,
      dielineFile: null,
      dielineAnalysis: null,
      docFile: null,
      rawDocText: '',
      productData: null,
      marketResearch: null,
    };
  }

  render() {
    this.appContainer.innerHTML = '';
    
    const container = document.createElement('div');
    container.className = 'wizard-container animate-fade-in';
    
    // Header
    const header = document.createElement('div');
    header.style.marginBottom = '40px';
    header.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
        <button class="btn-icon" onclick="window.app.navigate('dashboard')">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <h1 style="margin:0;font-size:24px">New Project</h1>
      </div>
    `;
    
    this.indicatorContainer = document.createElement('div');
    header.appendChild(this.indicatorContainer);
    container.appendChild(header);

    // Body
    this.bodyContainer = document.createElement('div');
    this.bodyContainer.className = 'wizard-body';
    container.appendChild(this.bodyContainer);

    // Footer
    this.footerContainer = document.createElement('div');
    this.footerContainer.className = 'wizard-footer';
    container.appendChild(this.footerContainer);

    this.appContainer.appendChild(container);

    this._renderStep();
  }

  _renderStep() {
    // Update indicator
    this.indicatorContainer.innerHTML = '';
    this.indicatorContainer.appendChild(createStepIndicator(STEPS, this.currentStep));
    
    this.bodyContainer.innerHTML = '';
    this.footerContainer.innerHTML = '';

    switch (this.currentStep) {
      case 0: this._renderStepSetup(); break;
      case 1: this._renderStepDieline(); break;
      case 2: this._renderStepContent(); break;
    }
  }

  // ── Step 1: Setup ───────────────────────────────────────────

  _renderStepSetup() {
    this.bodyContainer.innerHTML = `
      <h2>Project Details</h2>
      <p style="color:var(--text-muted);margin-bottom:24px">Give your project a name.</p>
      
      <div class="form-group">
        <label>Project Name</label>
        <input type="text" id="proj-name" class="form-control" placeholder="e.g. Premium Night Cream" value="${this.projectData.name}">
      </div>
    `;

    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-primary';
    nextBtn.textContent = 'Next Step';
    nextBtn.onclick = () => {
      const name = document.getElementById('proj-name').value.trim();
      if (!name) return showToast('Please enter a project name', 'warning');
      this.projectData.name = name;
      this.currentStep++;
      this._renderStep();
    };
    
    this.footerContainer.style.justifyContent = 'flex-end';
    this.footerContainer.appendChild(nextBtn);
  }

  // ── Step 2: Dieline ─────────────────────────────────────────

  _renderStepDieline() {
    this.bodyContainer.innerHTML = `
      <h2>Structural Dieline</h2>
      <p style="color:var(--text-muted);margin-bottom:24px">Upload the exact vector dieline. This will be locked as the structural source of truth.</p>
    `;

    const dropZone = createFileDropZone({
      title: 'Upload Dieline (SVG)',
      subtitle: 'SVG files provide the best fidelity',
      accept: '.svg,.pdf',
      onFile: async (file) => {
        if (!file.name.endsWith('.svg')) {
          showToast('Currently only SVG dielines are supported in the MVP', 'warning');
          return;
        }
        
        try {
          const analysis = await parseSvgDieline(file);
          this.projectData.dielineFile = file;
          this.projectData.dielineAnalysis = analysis;
          
          dropZone.innerHTML = `
            <div style="text-align:center">
              ${icon('check')}
              <div style="margin-top:8px;font-weight:500">${file.name}</div>
              <div style="font-size:12px;color:var(--success)">Valid dieline loaded</div>
            </div>
          `;
          dropZone.style.borderColor = 'var(--success)';
          
          document.getElementById('btn-next').disabled = false;
        } catch (err) {
          showToast(`Error parsing dieline: ${err.message}`, 'error');
        }
      }
    });

    this.bodyContainer.appendChild(dropZone);

    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn btn-secondary';
    prevBtn.textContent = 'Back';
    prevBtn.onclick = () => { this.currentStep--; this._renderStep(); };

    const nextBtn = document.createElement('button');
    nextBtn.id = 'btn-next';
    nextBtn.className = 'btn btn-primary';
    nextBtn.textContent = 'Next Step';
    nextBtn.disabled = !this.projectData.dielineFile;
    nextBtn.onclick = () => { this.currentStep++; this._renderStep(); };

    this.footerContainer.appendChild(prevBtn);
    this.footerContainer.appendChild(nextBtn);
  }

  // ── Step 3: Content ─────────────────────────────────────────

  _renderStepContent() {
    this.bodyContainer.innerHTML = `
      <h2>Product Content</h2>
      <p style="color:var(--text-muted);margin-bottom:24px">Upload the Word document (.docx) containing the front and back panel text (English & Arabic).</p>
    `;

    const dropZone = createFileDropZone({
      title: 'Upload Content (.docx)',
      accept: '.docx',
      onFile: async (file) => {
        try {
          const result = await parseDocx(file);
          this.projectData.docFile = file;
          this.projectData.rawDocText = result.text;
          
          dropZone.innerHTML = `
            <div style="text-align:center">
              ${icon('check')}
              <div style="margin-top:8px;font-weight:500">${file.name}</div>
              <div style="font-size:12px;color:var(--success)">Document parsed successfully</div>
            </div>
          `;
          dropZone.style.borderColor = 'var(--success)';
          
          document.getElementById('btn-next').disabled = false;
        } catch (err) {
          showToast(`Error parsing document: ${err.message}`, 'error');
        }
      }
    });

    this.bodyContainer.appendChild(dropZone);

    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn btn-secondary';
    prevBtn.textContent = 'Back';
    prevBtn.onclick = () => { this.currentStep--; this._renderStep(); };

    const nextBtn = document.createElement('button');
    nextBtn.id = 'btn-next';
    nextBtn.className = 'btn btn-primary';
    nextBtn.textContent = 'Generate Concepts';
    nextBtn.disabled = !this.projectData.docFile;
    nextBtn.onclick = async () => {
      nextBtn.disabled = true;
      nextBtn.innerHTML = `${icon('spinner', '16px')} Analyzing...`;
      try {
        const prodData = await analyzeProductData(this.projectData.rawDocText);
        this.projectData.productData = prodData;
        await this._finishWizard();
      } catch (err) {
        showToast(`Analysis Failed: ${err.message}`, 'error');
        nextBtn.disabled = false;
        nextBtn.textContent = 'Generate Concepts';
      }
    };

    this.footerContainer.appendChild(prevBtn);
    this.footerContainer.appendChild(nextBtn);
  }

  // ── (Review step removed as per user request) ────────────────

  async _finishWizard() {
    try {
      // Save project to IndexedDB
      const project = await saveProject({
        name: this.projectData.name,
        productData: this.projectData.productData,
        marketResearch: this.projectData.marketResearch,
        dielineText: this.projectData.dielineAnalysis?.geometry?.rawSvg,
        status: 'concepting'
      });

      // Navigate to Concept Picker
      window.app.navigate('concept', { projectId: project.id });
      
    } catch (err) {
      showToast(`Error saving project: ${err.message}`, 'error');
    }
  }
}
