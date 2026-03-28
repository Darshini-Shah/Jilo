import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './features/LandingPage';
import Auth from './features/Auth';
import OfficerDashboard from './features/OfficerDashboard';
import ProcessingPipeline from './features/ProcessingPipeline';
import { ThemeProvider } from '@/components/ui/theme_provider';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="rcm-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/dashboard" element={<OfficerDashboard />} />
          <Route path="/process" element={<ProcessingPipeline />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;