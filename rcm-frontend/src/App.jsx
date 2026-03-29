import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './features/LandingPage';
import Auth from './features/Auth';
import OfficerDashboard from './features/OfficerDashboard';
import ProcessingPipeline from './features/ProcessingPipeline';
import SettlementDashboard from './features/SettlementDashboard';
import { ThemeProvider } from '@/components/ui/theme_provider';
import { PatientProvider } from './context/PatientContext';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="rcm-ui-theme">
    <PatientProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/dashboard" element={<OfficerDashboard />} />
          <Route path="/process" element={<ProcessingPipeline />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/settlement" element={<SettlementDashboard />} />
        </Routes>
      </BrowserRouter>
      
      </PatientProvider>
    </ThemeProvider>
  );
}

export default App;