import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n.js';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { FontSizeProvider } from './context/FontSizeContext.jsx';
import { FontWeightProvider } from './context/FontWeightContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <FontSizeProvider>
        <FontWeightProvider>
          <App />
        </FontWeightProvider>
      </FontSizeProvider>
    </ThemeProvider>
  </React.StrictMode>
);
