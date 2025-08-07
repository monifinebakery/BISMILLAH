import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom'; // 1. Impor Router
import App from './App.tsx';
import './index.css';


// 2. Bungkus komponen <App /> dengan <Router>
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
