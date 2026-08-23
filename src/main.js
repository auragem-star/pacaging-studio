/**
 * main.js
 * Application entry point and router.
 */

import { Dashboard } from './views/Dashboard.js';
import { ProjectWizard } from './views/ProjectWizard.js';
import { ConceptPicker } from './views/ConceptPicker.js';
import { DesignEditor } from './views/DesignEditor.js';
import { ValidationReport } from './views/ValidationReport.js';

class App {
  constructor() {
    this.container = document.getElementById('app');
    this.currentView = null;
    
    // Simple router
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.route) {
        this.navigate(e.state.route, e.state.params, false);
      } else {
        this.navigate('dashboard', {}, false);
      }
    });
  }

  /**
   * Navigate to a view.
   * @param {string} route 
   * @param {object} params 
   * @param {boolean} pushState 
   */
  async navigate(route, params = {}, pushState = true) {
    if (pushState) {
      window.history.pushState({ route, params }, '', `#${route}`);
    }

    // Clean up current view if needed
    if (this.currentView && typeof this.currentView.destroy === 'function') {
      this.currentView.destroy();
    }

    this.container.innerHTML = '';
    
    try {
      switch (route) {
        case 'dashboard':
          this.currentView = new Dashboard(this.container, params);
          break;
        case 'wizard':
          this.currentView = new ProjectWizard(this.container, params);
          break;
        case 'concept':
          if (!params.projectId) throw new Error('Missing projectId');
          this.currentView = new ConceptPicker(this.container, params);
          break;
        case 'editor':
          if (!params.projectId) throw new Error('Missing projectId');
          this.currentView = new DesignEditor(this.container, params);
          break;
        case 'validation':
          if (!params.projectId) throw new Error('Missing projectId');
          this.currentView = new ValidationReport(this.container, params);
          break;
        default:
          this.currentView = new Dashboard(this.container, params);
      }

      await this.currentView.render();
      
    } catch (err) {
      console.error('Navigation error:', err);
      this.container.innerHTML = `
        <div style="padding:40px;text-align:center">
          <h2 style="color:var(--error)">Application Error</h2>
          <p>${err.message}</p>
          <button class="btn btn-primary" onclick="window.app.navigate('dashboard')">Return to Dashboard</button>
        </div>
      `;
    }
  }

  start() {
    const hash = window.location.hash.slice(1);
    const route = hash || 'dashboard';
    this.navigate(route, {}, true);
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.app.start();
});
