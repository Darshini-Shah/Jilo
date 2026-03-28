import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const API_BASE = 'http://localhost:8000';

export function useDashboardLogic() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePatientId, setActivePatientId] = useState(null);
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [isSubmittingPatient, setIsSubmittingPatient] = useState(false);
  const [patientError, setPatientError] = useState("");

  const [patientForm, setPatientForm] = useState({
    name: "", gender: "", contact: "", dob: "", age: "", policy_number: "", employee_id: "", insurer_id: "", medical_claim: false, occupation: "", address: ""
  });

  const [hospitalForm, setHospitalForm] = useState({
    name: "", location: "", email_id: "", rohini_id: ""
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: cur } }) => {
      setSession(cur);
      if (cur) { fetchProfile(cur); fetchPatients(cur); }
      else { setLoading(false); navigate('/', { replace: true }); }
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) { fetchProfile(s); fetchPatients(s); }
      else { navigate('/', { replace: true }); }
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

  const fetchPatients = async (s) => {
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
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

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
    if (!session) { setPatientError("Session expired. Please log in again."); return; }
    setIsSubmittingPatient(true);
    setPatientError("");
    try {
      const res = await fetch(`${API_BASE}/patients/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ ...patientForm, age: patientForm.age ? parseInt(patientForm.age) : null })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }
      const newPat = await res.json();
      setPatients([{ ...newPat, documents: [] }, ...patients]);
      setIsNewPatientOpen(false);
      setPatientForm({ name: "", gender: "", contact: "", dob: "", age: "", policy_number: "", employee_id: "", insurer_id: "", medical_claim: false, occupation: "", address: "" });
    } catch (err) {
      console.error("Patient create error:", err);
      setPatientError(err.message || "Failed to create patient. Check connection.");
    } finally {
      setIsSubmittingPatient(false);
    }
  };

  const updatePatientStep = async (patientId, newStep) => {
    if (!session) return;
    try {
      // Optimistic update
      setPatients(ps => ps.map(p => p.id === patientId ? { ...p, step: newStep } : p));
      
      const res = await fetch(`${API_BASE}/patients/${patientId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ step: newStep })
      });
      
      if (!res.ok) {
        // Revert on error
        fetchPatients(session);
        throw new Error("Failed to update patient step");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status. Check connection.");
    }
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
    if (!session) { alert("Session expired. Please log in again."); return; }
    const sDocs = patient.documents.filter(d => d.stage === stage);
    setLoading(true);
    setProcessingStatus("Aggregating Records...");
    const blobs = await Promise.all(sDocs.map(async d => {
      if (d.rawFile) return d.rawFile;
      const r = await fetch(d.url);
      const b = await r.blob();
      return new File([b], d.name, { type: 'application/pdf' });
    }));

    setProcessingStatus("Running AI Pipeline — This May Take A Moment...");
    const bfd = new FormData();
    blobs.forEach(f => bfd.append("pdf_files", f));

    try {
      const res = await fetch(`${API_BASE}/process-pdfs`, { method: 'POST', body: bfd });
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      setProcessingStatus("Finalizing Extraction...");
      navigate('/process', { 
        state: { 
          batchResult: data.results[0], 
          results: data.results, 
          files: sDocs.map(d => ({ name: d.name, url: d.url })),
          patient: patient
        } 
      });
    } catch (err) {
      console.error(err);
      alert("Batch processing failed. Check backend logs for tracebacks.");
    } finally {
      setLoading(false);
      setProcessingStatus("");
    }
  };

  return {
    patients: patients.filter(p => !['setteled', 'settled'].includes(p.step?.toLowerCase())), loading, activePatientId, setActivePatientId, 
    isNewPatientOpen, setIsNewPatientOpen, userProfile, isOnboardingOpen,
    processingStatus, patientForm, setPatientForm, hospitalForm, setHospitalForm,
    handleOnboardingSubmit, handleCreatePatient, handleFileAttached, processBatch,
    isSubmittingPatient, patientError, setPatientError, updatePatientStep
  };
}
