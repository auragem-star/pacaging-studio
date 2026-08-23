/**
 * Dashboard.js
 * First view the user sees. Lists recent projects and brand profiles.
 */

import { getAllProjects, getAllBrandProfiles, saveBrandProfile } from '../core/Storage.js';
import { icon } from '../components/Icons.js';
import { showModal } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';
import { gemini } from '../ai/GeminiClient.js';

export class Dashboard {
  constructor(appContainer) {
    this.appContainer = appContainer;
  }

  async render() {
    this.appContainer.innerHTML = '';
    
    const container = document.createElement('div');
    container.className = 'dashboard-view animate-fade-in';
    container.style.padding = '40px';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';

    // Header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '40px';
    header.innerHTML = `
      <div>
        <h1 style="margin:0;font-size:32px;font-weight:700;letter-spacing:-1px">PackStudio AI</h1>
        <p style="margin:8px 0 0;color:var(--text-muted)">Professional Packaging Design Engine</p>
      </div>
      <div>
        <button id="btn-settings" class="btn btn-secondary" style="margin-right:12px">
          ${icon('settings')} Settings
        </button>
        <button id="btn-new-project" class="btn btn-primary">
          ${icon('newProject')} New Project
        </button>
      </div>
    `;
    container.appendChild(header);

    // Main grid layout
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = '2fr 1fr';
    grid.style.gap = '32px';

    // Projects Column
    const projCol = document.createElement('div');
    projCol.innerHTML = `<h2 style="font-size:18px;margin-bottom:20px;display:flex;align-items:center;gap:8px">${icon('layers')} Recent Projects</h2>`;
    const projList = document.createElement('div');
    projList.id = 'projects-list';
    projList.style.display = 'flex';
    projList.style.flexDirection = 'column';
    projList.style.gap = '16px';
    projCol.appendChild(projList);
    grid.appendChild(projCol);

    // Brands Column
    const brandCol = document.createElement('div');
    brandCol.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <h2 style="font-size:18px;margin:0;display:flex;align-items:center;gap:8px">${icon('brand')} Brand Profiles</h2>
        <button id="btn-new-brand" class="btn-icon" title="Add Brand">${icon('newProject')}</button>
      </div>
    `;
    const brandList = document.createElement('div');
    brandList.id = 'brands-list';
    brandList.style.display = 'flex';
    brandList.style.flexDirection = 'column';
    brandList.style.gap = '16px';
    brandCol.appendChild(brandList);
    grid.appendChild(brandCol);

    container.appendChild(grid);
    this.appContainer.appendChild(container);

    // Bind events
    document.getElementById('btn-new-project').onclick = () => window.app.navigate('wizard');
    document.getElementById('btn-settings').onclick = () => this._showSettingsModal();
    document.getElementById('btn-new-brand').onclick = () => this._showBrandModal();

    // Load data
    await this._loadProjects();
    await this._loadBrands();

    // Check Gemini API key on startup
    if (!gemini.isConfigured()) {
      showToast('Welcome! Please configure your Gemini API key in Settings.', 'warning', 0);
    }
  }

  async _loadProjects() {
    const list = document.getElementById('projects-list');
    const projects = await getAllProjects();

    if (projects.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <p>No projects yet.</p>
          <button class="btn btn-secondary" onclick="document.getElementById('btn-new-project').click()">Create your first project</button>
        </div>
      `;
      return;
    }

    list.innerHTML = '';
    projects.forEach(p => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';
      card.style.cursor = 'pointer';
      
      const date = new Date(p.updatedAt).toLocaleDateString();
      card.innerHTML = `
        <div>
          <h3 style="margin:0 0 4px;font-size:16px">${p.name || 'Untitled Project'}</h3>
          <p style="margin:0;font-size:13px;color:var(--text-muted)">Last edited: ${date}</p>
        </div>
        ${icon('chevronRight')}
      `;
      card.onclick = () => window.app.navigate('editor', { projectId: p.id });
      list.appendChild(card);
    });
  }

  async _loadBrands() {
    const list = document.getElementById('brands-list');
    const brands = await getAllBrandProfiles();

    if (brands.length === 0) {
      list.innerHTML = `<div class="empty-state"><p>No brand profiles.</p></div>`;
      return;
    }

    list.innerHTML = '';
    brands.forEach(b => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<h3 style="margin:0;font-size:15px">${b.name}</h3>`;
      // Clicking could open the brand edit modal (omitted for brevity)
      list.appendChild(card);
    });
  }

  _showSettingsModal() {
    const currentKey = gemini.apiKey;
    
    const content = `
      <div class="form-group">
        <label>Gemini API Key</label>
        <input type="password" id="input-api-key" class="form-control" value="${currentKey}" placeholder="AIzaSy...">
        <p class="form-hint">Required for product analysis and creative generation. Stored locally.</p>
      </div>
    `;

    showModal({
      title: 'Settings',
      content,
      buttons: [
        { text: 'Cancel', type: 'secondary' },
        { 
          text: 'Save', 
          type: 'primary',
          onClick: () => {
            const val = document.getElementById('input-api-key').value.trim();
            gemini.setApiKey(val);
            showToast('Settings saved', 'success');
          }
        }
      ]
    });
  }

  _showBrandModal() {
    const content = `
      <div class="form-group">
        <label>Brand Name</label>
        <input type="text" id="brand-name" class="form-control" placeholder="e.g. Acme Corp">
      </div>
      <div class="form-group">
        <label>Company Information (Back Panel)</label>
        <textarea id="brand-info" class="form-control" rows="3" placeholder="Manufactured by... Address..."></textarea>
      </div>
    `;

    showModal({
      title: 'New Brand Profile',
      content,
      buttons: [
        { text: 'Cancel', type: 'secondary' },
        { 
          text: 'Save Profile', 
          type: 'primary',
          onClick: async () => {
            const name = document.getElementById('brand-name').value.trim();
            if (!name) return true; // keep open
            
            await saveBrandProfile({
              name,
              companyInfo: document.getElementById('brand-info').value.trim()
            });
            this._loadBrands();
            showToast('Brand created', 'success');
          }
        }
      ]
    });
  }
}
