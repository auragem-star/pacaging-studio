/**
 * StepIndicator.js
 * Visual progress bar for multi-step wizards.
 */

/**
 * Render a step indicator.
 * @param {string[]} steps - Array of step names
 * @param {number} currentStepIndex - 0-based index of current step
 * @returns {HTMLElement}
 */
export function createStepIndicator(steps, currentStepIndex) {
  const container = document.createElement('div');
  container.className = 'step-indicator';

  steps.forEach((stepName, i) => {
    // Step item
    const item = document.createElement('div');
    item.className = 'step-item';
    if (i === currentStepIndex) item.classList.add('active');
    if (i < currentStepIndex) item.classList.add('completed');
    
    // Number circle
    const num = document.createElement('div');
    num.className = 'step-num';
    num.textContent = i < currentStepIndex ? '✓' : (i + 1);
    
    // Optional label (hidden on small screens, or we can rely on title)
    item.title = stepName;
    item.appendChild(num);
    container.appendChild(item);
    
    // Connector line (except after last step)
    if (i < steps.length - 1) {
      const connector = document.createElement('div');
      connector.className = 'step-connector';
      if (i < currentStepIndex) connector.classList.add('active');
      container.appendChild(connector);
    }
  });

  return container;
}
