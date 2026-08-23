/**
 * ConceptPicker.js
 * Generates and displays creative concepts.
 * User selects one to proceed to the editor.
 */

import { getProject, saveProject } from '../core/Storage.js';
import { generateCreativeDirection, generateConceptVariations } from '../ai/CreativeDirector.js';
import { performMarketResearch } from '../ai/MarketResearcher.js';
import { renderConcept } from '../ai/ConceptGenerator.js';
import { dielineEngine } from '../core/DielectricEngine.js';
import { icon } from '../components/Icons.js';
import { showToast } from '../components/Toast.js';

export class ConceptPicker {
  constructor(appContainer, params) {
    this.appContainer = appContainer;
    this.projectId = params.projectId;
    this.project = null;
    this.concepts = [];
  }

  async render() {
    this.appContainer.innerHTML = `
      <div style="display:flex;height:100vh;align-items:center;justify-content:center;flex-direction:column">
        ${icon('spinner')}
        <h2 style="margin-top:24px">Generating Creative Concepts...</h2>
        <p style="color:var(--text-muted)">Synthesizing market research and product data.</p>
      </div>
    `;

    try {
      this.project = await getProject(this.projectId);
      if (!this.project) throw new Error('Project not found');

      // Load dieline engine if not already loaded (e.g. page refresh)
      if (!dielineEngine.isLoaded && this.project.dielineText) {
        dielineEngine.loadFromSvgString(this.project.dielineText);
      }

      // 0. Perform market research silently in the background
      if (!this.project.marketResearch) {
        this.project.marketResearch = await performMarketResearch(this.project.productData);
        await saveProject(this.project);
      }

      // 1. Generate core creative direction
      const direction = await generateCreativeDirection(
        this.project.productData,
        this.project.marketResearch
      );

      // 2. Generate 4 concept variations
      this.concepts = await generateConceptVariations(direction, 4);

      // 3. Render UI
      this._renderConceptsUi(direction);

    } catch (err) {
      console.error(err);
      this.appContainer.innerHTML = `
        <div style="padding:40px;max-width:600px;margin:0 auto">
          <h2>Error Generating Concepts</h2>
          <p>${err.message}</p>
          <button class="btn btn-secondary" onclick="window.app.navigate('dashboard')">Back to Dashboard</button>
        </div>
      `;
    }
  }

  _renderConceptsUi(direction) {
    this.appContainer.innerHTML = '';
    
    const container = document.createElement('div');
    container.className = 'animate-fade-in';
    container.style.padding = '40px';
    container.style.maxWidth = '1400px';
    container.style.margin = '0 auto';

    // Header
    const header = document.createElement('div');
    header.style.marginBottom = '40px';
    header.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:8px">
        <h1 style="margin:0;font-size:24px">Select a Creative Concept</h1>
      </div>
      <p style="color:var(--text-muted);margin:0;max-width:800px">
        Based on our analysis, we recommend: <strong>${direction.headline}</strong>.<br>
        Here are 4 distinct ways to execute this strategy. Select one to open the editor.
      </p>
    `;
    container.appendChild(header);

    // Concept Grid
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
    grid.style.gap = '24px';

    this.concepts.forEach(concept => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.cursor = 'pointer';
      card.style.transition = 'transform 0.2s, box-shadow 0.2s';
      
      card.onmouseenter = () => {
        card.style.transform = 'translateY(-4px)';
        card.style.boxShadow = '0 12px 24px rgba(0,0,0,0.2)';
      };
      card.onmouseleave = () => {
        card.style.transform = '';
        card.style.boxShadow = '';
      };

      // Thumbnail (simulate render)
      const thumb = document.createElement('div');
      thumb.style.height = '200px';
      thumb.style.background = concept.colorPalette.background || '#1a2235';
      thumb.style.borderRadius = '4px';
      thumb.style.marginBottom = '16px';
      thumb.style.display = 'flex';
      thumb.style.alignItems = 'center';
      thumb.style.justifyContent = 'center';
      thumb.style.position = 'relative';
      thumb.style.overflow = 'hidden';

      // Simple visual representation of concept
      const title = document.createElement('h3');
      title.style.color = concept.colorPalette.text || '#fff';
      title.style.fontFamily = concept.typography.heading;
      title.style.margin = '0';
      title.style.zIndex = '1';
      title.textContent = this.project.productData.productName || 'PRODUCT';
      
      if (concept.frontPanel?.bgType === 'gradient') {
         thumb.style.background = `linear-gradient(135deg, ${concept.colorPalette.primary}, ${concept.colorPalette.background})`;
      }

      thumb.appendChild(title);
      
      // Color swatches
      const swatches = document.createElement('div');
      swatches.style.display = 'flex';
      swatches.style.gap = '4px';
      swatches.style.marginBottom = '12px';
      (concept.colorPalette.all || [concept.colorPalette.primary, concept.colorPalette.accent, concept.colorPalette.background]).forEach(color => {
        const swatch = document.createElement('div');
        swatch.style.width = '24px';
        swatch.style.height = '24px';
        swatch.style.borderRadius = '50%';
        swatch.style.background = color;
        swatch.style.border = '1px solid rgba(255,255,255,0.1)';
        swatches.appendChild(swatch);
      });

      card.innerHTML = `
        <div style="flex:1">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--accent);margin-bottom:4px">
            ${concept.theme}
          </div>
          <h3 style="margin:0 0 8px;font-size:18px">${concept.name}</h3>
          <p style="margin:0 0 16px;font-size:13px;color:var(--text-muted);line-height:1.4">${concept.concept}</p>
        </div>
      `;
      
      card.insertBefore(thumb, card.firstChild);
      card.insertBefore(swatches, card.children[2]); // insert after thumb & header

      card.onclick = () => this._selectConcept(concept);
      grid.appendChild(card);
    });

    container.appendChild(grid);
    this.appContainer.appendChild(container);
  }

  async _selectConcept(concept) {
    showToast(`Generating SVG for "${concept.name}"...`, 'info', 0);
    
    try {
      // 1. Build initial SVG based on concept
      const initialSvgText = renderConcept(
        concept,
        this.project.productData,
        null, // brand profile placeholder
        this.project.dielineAnalysis?.panelAssignments || null
      );

      // 2. Save project state
      this.project.selectedConcept = concept;
      this.project.currentSvg = initialSvgText;
      this.project.status = 'editing';
      await saveProject(this.project);

      // 3. Navigate to editor
      document.querySelector('.toast')?.remove();
      window.app.navigate('editor', { projectId: this.project.id });
      
    } catch (err) {
      console.error(err);
      showToast(`Error generating concept SVG: ${err.message}`, 'error');
    }
  }
}
