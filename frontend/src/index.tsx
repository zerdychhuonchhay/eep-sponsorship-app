import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

async function enableMocking() {
  // Control mocking via an environment variable for explicit activation.
  if (import.meta.env.VITE_API_MOCKING !== 'enabled') {
    return;
  }
 
  console.log('%cAPI MOCKING ENABLED', 'color: orange; font-weight: bold; font-size: 14px;');

  const { worker } = await import('./mocks/browser.ts');
  
  // `onUnhandledRequest: 'bypass'` prevents MSW from logging warnings for API calls
  // that don't have a corresponding mock handler, which is useful during development.
  return worker.start({ onUnhandledRequest: 'bypass' });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);

enableMocking().then(() => {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
          <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
});

// Register the service worker for PWA capabilities.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(err => {
        console.error('Service Worker registration failed:', err);
      });
  });
}
