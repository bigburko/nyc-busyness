// Used to render a React application to the web page.

import React from 'react';
// Import ReactDOM to mount React elements onto the real DOM.
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);