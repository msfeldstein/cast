import './index.css';
import { App } from './App';
import { appStateManager } from './persistence';

// Check for reset parameter
if (window.location.search.includes('reset')) {
  appStateManager.clear();
  window.location.href = window.location.pathname;
}

// Get the root element
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

// Create and start the app
const app = new App(container);
app.start().catch((error) => {
  console.error('Failed to start app:', error);
  container.innerHTML = `<div class="app-error">Failed to start: ${error.message}</div>`;
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  app.dispose();
});
