import Dashboard from './dashboard.jsx';
import React from 'react';
import { createRoot } from 'react-dom/client';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<Dashboard />);
}