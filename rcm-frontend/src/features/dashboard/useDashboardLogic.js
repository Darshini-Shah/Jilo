import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { usePatientContext } from '../../contexts/PatientContext';

const API_BASE = 'http://localhost:8000';

export function useDashboardLogic() {
  const navigate = useNavigate();
  const { patients, loading: patientsLoading, setPatients } = usePatientContext();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activePatientId, setActivePatientId] = useState(null);
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStartTime, setProcessingStartTime] = useState(null);

  const [patientForm, setPatientForm] = useState({
    name: "", gender: "", contact: "", dob: "", age: "", policy_number: "", employee_id: "", insurer_id: "", medical_claim: false, occupation: "", address: ""
  });

  const [hospitalForm, setHospitalForm] = useState({
    name: "", location: "", email_id: "", rohini_id: ""
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: cur } }) => {
      setSession(cur);
      if (cur) { fetchProfile(cur); }
      else { navigate('/'); }
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) { fetchProfile(s); }
      else { navigate('/'); }
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (s) => {
    const res = await fetch(`${API_BASE}/users/me`, { headers: { 'Authorization': `Bearer ${s.access_token}` } });
    if (res.ok) {
      const data = await res.json();
      setUserProfile(data);
      if (!data.hospital_id) setIsOnboardingOpen(true);
    }
  };

  // Patient data is now fetched in PatientContext

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    const hRes = await fetch(`${API_BASE}/hospitals/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify(hospitalForm)
    });
    const h = await hRes.json();
    await fetch(`${API_BASE}/users/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ hospital_id: h.id })
    });
    setIsOnboardingOpen(false);
    fetchProfile(session);
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/patients/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ ...patientForm, age: patientForm.age ? parseInt(patientForm.age) : null })
    });
    const newPat = await res.json();
    setPatients([{ ...newPat, documents: [] }, ...patients]);
    setIsNewPatientOpen(false);
    setPatientForm({ name: "", gender: "", contact: "", dob: "", age: "", policy_number: "", employee_id: "", insurer_id: "", medical_claim: false, occupation: "", address: "" });
  };

  const handleFileAttached = async (e, patientId, stage) => {
    const files = Array.from(e.target.files);
    const newDocs = files.map(f => ({ id: `t-${Math.random()}`, name: f.name, stage, status: 'pending', url: URL.createObjectURL(f), rawFile: f }));
    setPatients(ps => ps.map(p => p.id === patientId ? { ...p, documents: [...p.documents, ...newDocs] } : p));
    for (const f of files) {
      const fd = new FormData();
      fd.append("file", f, `${stage}__${f.name}`);
      const res = await fetch(`${API_BASE}/documents/?patient_id=${patientId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}` }, body: fd });
      const up = await res.json();
      setPatients(ps => ps.map(p => p.id === patientId ? { ...p, documents: p.documents.map(d => d.name === f.name && d.stage === stage ? { ...d, id: up.id, url: up.file_url, rawFile: f } : d) } : p));
    }
  };

  const processBatch = async (patient, stage) => {
    const sDocs = patient.documents.filter(d => d.stage === stage);
    setLoading(true);
    setProcessingProgress(0);
    setProcessingStartTime(Date.now());
    setProcessingStatus("Fetching Documents from Storage...");
    setProcessingProgress(10);

    const blobs = await Promise.all(sDocs.map(async d => {
      if (d.rawFile) return d.rawFile;
      const r = await fetch(d.url);
      const b = await r.blob();
      return new File([b], d.name, { type: 'application/pdf' });
    }));

    setProcessingStatus("Preprocessing & OCR Extraction...");
    setProcessingProgress(25);

    const bfd = new FormData();
    blobs.forEach(f => bfd.append("pdf_files", f));

    try {
      setProcessingStatus("Running AI Pipeline (this may take 1-3 min)...");
      setProcessingProgress(40);

      const res = await fetch(`${API_BASE}/process-pdfs`, { method: 'POST', body: bfd });

      setProcessingStatus("Generating FHIR Bundle & Validation...");
      setProcessingProgress(80);

      if (!res.ok) throw new Error("API failed");
      const data = await res.json();

      setProcessingStatus("Finalizing Results...");
      setProcessingProgress(95);

      // Small delay so user can see 95% before navigation
      await new Promise(r => setTimeout(r, 400));
      setProcessingProgress(100);

      navigate('/process', { state: { batchResult: data.results[0], results: data.results, files: blobs } });
    } catch (err) {
      console.error(err);
      alert("Batch processing failed. Check backend logs for tracebacks.");
    } finally {
      setLoading(false);
      setProcessingStatus("");
      setProcessingProgress(0);
      setProcessingStartTime(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return {
    patients, loading: loading || patientsLoading, activePatientId, setActivePatientId, 
    isNewPatientOpen, setIsNewPatientOpen, userProfile, isOnboardingOpen,
    processingStatus, processingProgress, processingStartTime,
    patientForm, setPatientForm, hospitalForm, setHospitalForm,
    handleOnboardingSubmit, handleCreatePatient, handleFileAttached, processBatch,
    handleLogout
  };
}
