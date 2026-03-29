import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const PatientContext = createContext();

const API_BASE = 'http://localhost:8000';

export function PatientProvider({ children }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: cur } }) => {
      setSession(cur);
      if (cur) fetchPatients(cur);
      else setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) fetchPatients(s);
      else setPatients([]);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchPatients = async (s) => {
    if (patients.length > 0) return; // Prevent refetching if already loaded
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/patients/`, { headers: { 'Authorization': `Bearer ${s.access_token}` } });
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      
      const enhanced = await Promise.all(data.map(async (pat) => {
        const dRes = await fetch(`${API_BASE}/documents/?patient_id=${pat.id}`, { headers: { 'Authorization': `Bearer ${s.access_token}` } });
        let docs = [];
        if (dRes.ok) {
          const raw = await dRes.json();
          docs = raw.map(d => {
            const stage = d.file_name?.includes('__') ? d.file_name.split('__')[0] : 'admitted';
            const name = d.file_name?.includes('__') ? d.file_name.split('__').slice(1).join('__') : (d.file_name || 'Doc.pdf');
            return { ...d, name, stage, status: 'pending', url: d.file_url };
          });
        }
        return { ...pat, documents: docs };
      }));
      setPatients(enhanced);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const addPatient = (patient) => {
    setPatients(prev => [patient, ...prev]);
  };

  const updatePatientDocs = (patientId, newDocs) => {
    setPatients(prev => prev.map(p => 
      p.id === patientId 
        ? { ...p, documents: [...p.documents, ...newDocs] } 
        : p
    ));
  };

  const syncPatientDoc = (patientId, fileName, stage, updatedDocData) => {
    setPatients(prev => prev.map(p => 
      p.id === patientId 
        ? { 
            ...p, 
            documents: p.documents.map(d => 
              (d.name === fileName && d.stage === stage) 
                ? { ...d, ...updatedDocData } 
                : d
            ) 
          } 
        : p
    ));
  };

  return (
    <PatientContext.Provider value={{ 
      patients, loading, setPatients, fetchPatients, 
      addPatient, updatePatientDocs, syncPatientDoc 
    }}>
      {children}
    </PatientContext.Provider>
  );
}

export const usePatientContext = () => useContext(PatientContext);
