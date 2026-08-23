/**
 * ValidationReport.js
 * Pre-export validation view. Checks print safety, dieline integrity, etc.
 */

import { getProject } from '../core/Storage.js';
import { validator, STATUS } from '../core/Validator.js';
import { dielineEngine } from '../core/DielectricEngine.js';
import { icon } from '../components/Icons.js';
import { svgExporter } from '../core/SvgExporter.js';

export class ValidationReport {
  constructor(appContainer, params) {
    this.appContainer = appContainer;
    this.projectId = params.projectId;
  }

  async render() {
    this.appContainer.innerHTML = '';
    
    const project = await getProject(this.projectId);
    if (!project) return window.app.navigate('dashboard');

    // Load dieline if needed
    if (!dielineEngine.isLoaded && project.dielineText) {
      dielineEngine.loadFromSvgString(project.dielineText);
    }

    // Run validation
    const report = validator.validate(project.currentSvg, project);

    const container = document.createElement('div');
    container.className = 'animate-fade-in';
    container.style.padding = '40px';
    container.style.maxWidth = '800px';
    container.style.margin = '0 auto';

    // Header
    const header = document.createElement('div');
    header.style.marginBottom = '32px';
    header.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
        <button class="btn-icon" onclick="window.app.navigate('editor', { projectId: '${this.projectId}' })">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <h1 style="margin:0;font-size:24px">Pre-Export Validation</h1>
      </div>
      
      <div class="card" style="display:flex;align-items:center;justify-content:space-between;border-left:4px solid ${
        report.canExport ? 'var(--success)' : 'var(--error)'
      }">
        <div style="display:flex;align-items:center;gap:12px">
          ${report.canExport ? icon('check', '24px') : icon('x', '24px')}
          <span style="font-size:18px;font-weight:500">${report.summary}</span>
        </div>
        ${report.canExport ? `<button id="btn-export-pdf" class="btn btn-primary">${icon('download')} Export PDF</button>` : ''}
      </div>
    `;
    container.appendChild(header);

    // Group checks by category
    const categories = {};
    report.checks.forEach(check => {
      if (!categories[check.category]) categories[check.category] = [];
      categories[check.category].push(check);
    });

    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '24px';

    Object.entries(categories).forEach(([category, checks]) => {
      const catBlock = document.createElement('div');
      
      const catTitle = document.createElement('h3');
      catTitle.style.margin = '0 0 12px';
      catTitle.style.fontSize = '14px';
      catTitle.style.textTransform = 'uppercase';
      catTitle.style.letterSpacing = '1px';
      catTitle.style.color = 'var(--text-muted)';
      catTitle.textContent = category;
      catBlock.appendChild(catTitle);

      const items = document.createElement('div');
      items.className = 'card';
      items.style.padding = '0';
      items.style.display = 'flex';
      items.style.flexDirection = 'column';

      checks.forEach((check, i) => {
        const item = document.createElement('div');
        item.style.padding = '16px';
        if (i > 0) item.style.borderTop = '1px solid var(--border)';
        item.style.display = 'flex';
        item.style.gap = '16px';

        let iconEl, color;
        if (check.status === STATUS.PASS) { iconEl = icon('check'); color = 'var(--success)'; }
        else if (check.status === STATUS.WARNING) { iconEl = icon('info'); color = 'var(--accent)'; }
        else { iconEl = icon('x'); color = 'var(--error)'; }

        item.innerHTML = `
          <div style="color:${color};flex-shrink:0;margin-top:2px">${iconEl.outerHTML}</div>
          <div>
            <div style="font-weight:600;margin-bottom:4px;color:var(--text)">${check.label}</div>
            <div style="font-size:13px;color:var(--text-muted);line-height:1.5">${check.detail}</div>
          </div>
        `;
        items.appendChild(item);
      });

      catBlock.appendChild(items);
      list.appendChild(catBlock);
    });

    container.appendChild(list);
    this.appContainer.appendChild(container);

    if (report.canExport) {
      document.getElementById('btn-export-pdf').onclick = async () => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(project.currentSvg, 'image/svg+xml');
        const btn = document.getElementById('btn-export-pdf');
        btn.disabled = true;
        btn.innerHTML = `${icon('spinner')} Generating PDF...`;
        
        // Use jsPDF for PDF generation
        await svgExporter.exportPdf(doc.documentElement, `${project.name || 'packaging'}.pdf`, {
          title: project.name,
          author: project.productData?.brand
        });
        
        btn.disabled = false;
        btn.innerHTML = `${icon('download')} Export PDF`;
      };
    }
  }
}
