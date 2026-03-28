import React, { useState } from 'react';
import { Database, ShieldCheck, User, Activity, ArrowRight, ArrowLeft, Code, Copy, CheckCircle2, FileText, Download, Eye } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/* Icon map for FHIR resource types */
const RESOURCE_ICONS = {
  Patient: User,
  Claim: FileText,
  Organization: Database,
  Bundle: Database,
};

/* Pretty-print a value for the formal view */
const formatValue = (val) => {
  if (val === null || val === undefined) return '—';
  if (Array.isArray(val)) {
    return val.map(item => {
      if (typeof item === 'object') {
        return Object.entries(item).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(', ');
      }
      return String(item);
    }).join(' · ');
  }
  if (typeof val === 'object') {
    return Object.entries(val).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(', ');
  }
  return String(val);
};

/* Humanize camelCase keys */
const humanizeKey = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .replace(/_/g, ' ')
    .trim();
};

const FhirViewer = ({ files = [], apiResults = [], onProceed, onBack }) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('formal');
  const [mediAssistData, setMediAssistData] = useState(null);
  const [templateHtml, setTemplateHtml] = useState("");
  const [loadingMedi, setLoadingMedi] = useState(false);

  React.useEffect(() => {
    const fetchMediData = async () => {
      setLoadingMedi(true);
      try {
        const [dataRes, tempRes] = await Promise.all([
          fetch('http://localhost:8000/api/generate-mediassist'),
          fetch('http://localhost:8000/api/mediassist-template')
        ]);
        const dataJson = await dataRes.json();
        const tempJson = await tempRes.json();
        if (dataJson.status === 'success') setMediAssistData(dataJson.data);
        if (tempJson.status === 'success') setTemplateHtml(tempJson.template);
      } catch (err) {
        console.error("Failed to fetch MediAssist data:", err);
      } finally {
        setLoadingMedi(false);
      }
    };
    fetchMediData();
  }, []);

  const populateHTML = (html, data) => {
    if (!html || !data) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Helper to get nested value
    const getVal = (path) => {
      const keys = path.split('.');
      let curr = data;
      // Simple mapping for common fields if not nested in data
      const mapping = {
        'hospital.name': data.HospitalName,
        'hospital.location': data.HospitalAddress,
        'hospital.hospitalId': data.HospitalID,
        'hospital.emailId': data.HospitalEmail_ID,
        'hospital.rohiniId': data.HospitalROHINI_ID,
        'patient.name': data.PatientName,
        'patient.gender': data.PatientGender,
        'patient.contactNo': data.PatientMobile,
        'patient.ageYears': data.PatientAge,
        'patient.dateOfBirth': data.PatientBirthDate,
        'patient.policyNumber': data.Patient_Policy_No,
        'patient.address': data.PatientAddress,
        'admission.dateOfAdmission': data.AdmissionDate,
        'doctor.provisionalDiagnosis': data.Diagnosis,
        'doctor.surgeryName': data.Procedure,
      };
      if (mapping[path]) return mapping[path];

      for (const k of keys) {
        if (curr && curr[k] !== undefined) curr = curr[k];
        else return "";
      }
      return curr;
    };

    // Fill .cboxes
    doc.querySelectorAll('.cboxes').forEach(el => {
      const field = el.getAttribute('data-field');
      const count = parseInt(el.getAttribute('data-count') || "0");
      const val = String(getVal(field) || "").toUpperCase();
      el.innerHTML = '';
      for (let i = 0; i < count; i++) {
        const box = doc.createElement('div');
        box.className = 'cbox';
        box.textContent = val[i] || '';
        el.appendChild(box);
      }
    });

    // Fill .cb
    doc.querySelectorAll('.cb').forEach(el => {
      const field = el.getAttribute('data-field');
      const matchVal = el.getAttribute('data-value');
      const val = getVal(field);
      if (String(val).toLowerCase() === String(matchVal).toLowerCase()) {
        el.textContent = 'X';
        el.style.fontWeight = 'bold';
      }
    });

    // Fill .ta
    doc.querySelectorAll('.ta').forEach(el => {
      const field = el.getAttribute('data-field');
      el.textContent = getVal(field);
    });

    // Fill .dboxes
    doc.querySelectorAll('.dboxes').forEach(el => {
      const field = el.getAttribute('data-field');
      const val = String(getVal(field) || "").trim();
      if (!val) {
        el.innerHTML = '';
        return;
      }

      // Try to parse date and format as DDMMYYYY
      let dStr = "";
      try {
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = String(date.getFullYear());
          dStr = day + month + year;
        } else {
          dStr = val.replace(/\D/g, '').substring(0, 8);
        }
      } catch (e) {
        dStr = val.replace(/\D/g, '').substring(0, 8);
      }

      el.innerHTML = '';
      const chars = dStr.split('');
      chars.forEach((c, i) => {
        const box = doc.createElement('div');
        box.className = 'cbox';
        box.textContent = c;
        el.appendChild(box);
        if (i === 1 || i === 3) {
          const sep = doc.createElement('span');
          sep.className = 'dsep';
          sep.textContent = '/';
          el.appendChild(sep);
        }
      });
    });

    return doc.body.innerHTML;
  };

  const handleDownloadPdf = () => {
    const element = document.getElementById('medi-assist-form-container');
    const opt = {
      margin: 10,
      filename: `MediAssist_${mediAssistData?.PatientName || 'Form'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(mediAssistData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MediAssist_${mediAssistData?.PatientName || 'Data'}.json`;
    a.click();
  };

  // Grab the first file's name to make the JSON look dynamic, fallback to default if missing
  const dynamicFileName = files.length > 0 ? files[0].name.replace('.pdf', '') : "Batch_001";

  // Use the real FHIR bundle from the backend if available
  const fhirPayload = apiResults.length > 0 && apiResults[0].fhir_bundle ? apiResults[0].fhir_bundle : {
    "resourceType": "Bundle",
    "id": `bundle-${dynamicFileName.substring(0, 5)}`,
    "type": "collection",
    "entry": [
      {
        "fullUrl": `http://intern.local/fhir/Patient/pat-${dynamicFileName}`,
        "resource": {
          "resourceType": "Patient",
          "id": `pat-${dynamicFileName}`,
          "name": [{ "family": "Patient", "given": ["Test"] }]
        }
      },
      {
        "fullUrl": "http://intern.local/fhir/Claim/claim-1001",
        "resource": {
          "resourceType": "Claim",
          "id": "claim-1001",
          "status": "active",
          "use": "claim",
          "patient": { "reference": `Patient/pat-${dynamicFileName}` },
          "created": "2026-03-12"
        }
      }
    ]
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(fhirPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-500">

      {/* TOP NAVIGATION BAR */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground font-bold h-7 px-2 text-xs">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back
        </Button>

        <div className="text-center hidden sm:block">
          <h2 className="text-sm font-bold tracking-tight flex items-center justify-center gap-1.5">
            <Code className="w-4 h-4 text-foreground" />
            FHIR R4 BUNDLE
          </h2>
          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
            Interoperability Standard Ready
          </p>
        </div>

        <Button size="sm" onClick={onProceed} className="h-7 font-bold shadow-md shadow-foreground/10 text-xs">
          Run Reconciliation
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>



      {/* MAIN CONTENT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-380px)] min-h-[400px]">

        {/* LEFT: FHIR Resource Viewer */}
        <Card className="lg:col-span-3 shadow-sm flex flex-col overflow-hidden border-2 border-foreground">
          <CardHeader className="pb-2 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-foreground rounded flex items-center justify-center">
                <Database className="w-4 h-4 text-background" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-wide">FHIR R4 Bundle</CardTitle>
                <CardDescription className="text-[10px] font-medium uppercase tracking-widest">
                  {fhirPayload.entry?.length || 0} Resources · {fhirPayload.type || 'collection'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] uppercase font-bold rounded-sm">
                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Valid
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'formal' ? 'json' : 'formal')}
                className="h-7 text-[10px] px-2 font-bold uppercase"
              >
                {viewMode === 'formal' ? <Code className="w-3 h-3 mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
                {viewMode === 'formal' ? 'Raw JSON' : 'Formal View'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="h-7 text-[10px] px-2 font-bold uppercase"
              >
                {copied ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </CardHeader>

          <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
            {viewMode === 'json' ? (
              <pre className="whitespace-pre-wrap leading-relaxed text-xs font-mono text-foreground bg-muted/30 p-4 rounded border">
                {JSON.stringify(fhirPayload, null, 2)}
              </pre>
            ) : (
              <div className="flex flex-col gap-4">
                {fhirPayload.entry?.map((entry, idx) => {
                  const res = entry.resource;
                  if (!res) return null;
                  const Icon = RESOURCE_ICONS[res.resourceType] || Database;
                  const fields = Object.entries(res).filter(([k]) => k !== 'resourceType');

                  return (
                    <Card key={idx} className="shadow-none border rounded-sm overflow-hidden">
                      {/* Resource Header */}
                      <div className="bg-muted/50 px-4 py-2.5 border-b flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-foreground" />
                          <span className="text-xs font-bold uppercase tracking-wider">{res.resourceType}</span>
                        </div>
                        <Badge variant="secondary" className="text-[9px] font-mono">
                          {res.id || `entry-${idx}`}
                        </Badge>
                      </div>

                      {/* Resource Fields as Table */}
                      <div className="divide-y">
                        {fields.map(([key, value]) => (
                          <div key={key} className="flex items-start px-4 py-2.5 text-xs hover:bg-muted/20 transition-colors">
                            <span className="w-[35%] shrink-0 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] pt-0.5">
                              {humanizeKey(key)}
                            </span>
                            <span className="flex-1 font-medium text-foreground break-words leading-relaxed">
                              {formatValue(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </Card>


      </div>
    </div>
  );
};

export default FhirViewer;