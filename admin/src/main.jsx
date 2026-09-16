import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
// Gujarati challans; subsetted by unicode-range, so English-only users download nothing extra.
import '@fontsource-variable/noto-sans-gujarati';
import './styles/challan.css';
import './i18n';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
