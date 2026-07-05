// Central Config for Jilo Frontend

export const API_BASE = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : 'https://jilo.onrender.com');

console.log("Jilo Frontend connecting to Backend API:", API_BASE);
