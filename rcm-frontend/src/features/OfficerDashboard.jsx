import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboardLogic } from './dashboard/useDashboardLogic';
import { Progress } from '@/components/ui/progress';

// Modular Components
import DashboardHeader from './dashboard/DashboardHeader';
import RegistryGrid from './dashboard/RegistryGrid';
import PatientDetailModal from './dashboard/PatientDetailModal';
import NewPatientModal from './dashboard/NewPatientModal';
import OnboardingModal from './dashboard/OnboardingModal';



/**
 * OfficerDashboard
 * Simplified coordinator for the TPA/Hospital Officer view.
 * Logic is abstracted to useDashboardLogic to keep this under 200 lines.
 */
export default function OfficerDashboard() {
  const {
    patients, loading, activePatientId, setActivePatientId, 
    isNewPatientOpen, setIsNewPatientOpen, userProfile, isOnboardingOpen,
    processingStatus, processingProgress, processingStartTime,
    patientForm, setPatientForm, hospitalForm, setHospitalForm,
    handleOnboardingSubmit, handleCreatePatient, handleFileAttached, processBatch,
    handleLogout
  } = useDashboardLogic();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <DashboardHeader 
        userProfile={userProfile} 
        onLogout={handleLogout} 
      />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight uppercase">Master Registry</h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium uppercase tracking-widest">
                {patients.length} Open Workflows
              </p>
            </div>
            <NewPatientModal 
              isOpen={isNewPatientOpen} 
              onOpenChange={setIsNewPatientOpen} 
              formData={patientForm} 
              onChange={(e) => setPatientForm({ 
                ...patientForm, 
                [e.target.id]: e.target.type === 'checkbox' ? e.target.checked : e.target.value 
              })} 
              onSubmit={handleCreatePatient} 
            />
          </div>

          {/* Animated Processing Overlay has been moved to PatientDetailModal */}

          <RegistryGrid 
            patients={patients} 
            loading={loading && !processingStatus} 
            onSelectPatient={setActivePatientId} 
          />
        </div>
      </main>

      <PatientDetailModal 
        patient={patients.find(p => p.id === activePatientId)} 
        isOpen={!!activePatientId} 
        onClose={() => setActivePatientId(null)} 
        onFileAttached={handleFileAttached} 
        onProcessBatch={processBatch}
        loading={loading}
        processingStatus={processingStatus}
        processingProgress={processingProgress}
        processingStartTime={processingStartTime}
      />

      <OnboardingModal 
        isOpen={isOnboardingOpen} 
        formData={hospitalForm} 
        onChange={(e) => setHospitalForm({ ...hospitalForm, [e.target.id]: e.target.value })} 
        onSubmit={handleOnboardingSubmit} 
      />
    </div>
  );
}
