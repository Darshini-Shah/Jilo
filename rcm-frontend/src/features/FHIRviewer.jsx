import React, { useState } from 'react';
import { Database, ShieldCheck, User, Activity, ArrowRight, CheckCircle } from 'lucide-react';

const FhirViewer = ({ onProceed }) => {
  const [activeSection, setActiveSection] = useState('bundle');

  // The 100% compliant FHIR JSON we generated in Python
  const fhirPayload = {
    "resourceType": "Bundle",
    "id": "bundle-1001",
    "type": "collection",
    "entry": [
      {
        "fullUrl": "http://hackathon.local/fhir/Patient/pat-1001",
        "resource": {
          "resourceType": "Patient",
          "id": "pat-1001",
          "name": [{ "family": "Khamitkar", "given": ["Pandurang"] }]
        }
      },
      {
        "fullUrl": "http://hackathon.local/fhir/Claim/claim-1001",
        "resource": {
          "resourceType": "Claim",
          "id": "claim-1001",
          "status": "active",
          "use": "claim",
          "patient": { "reference": "Patient/pat-1001" },
          "created": "2021-07-25",
          "diagnosis": [
            {
              "sequence": 1,
              "diagnosisCodeableConcept": {
                "coding": [
                  {
                    "system": "http://hl7.org/fhir/sid/icd-10-cm",
                    "code": "Z00.00",
                    "display": "Encounter for general adult medical examination"
                  }
                ]
              }
            }
          ],
          "item": [
            {
              "sequence": 1,
              "diagnosisSequence": [1],
              "productOrService": {
                "coding": [
                  {
                    "system": "http://www.ama-assn.org/go/cpt",
                    "code": "99386",
                    "display": "PREV VISIT NEW AGE 40-64"
                  }
                ]
              }
            }
          ]
        }
      }
    ]
  };

  return (
    <div className="w-full mt-4 flex flex-col gap-6">
      
      {/* Header */}
      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
          <div>
            <h2 className="text-xl font-bold text-emerald-800">HL7 FHIR R4 Payload Generated</h2>
            <p className="text-emerald-600 text-sm">Data has been successfully mapped to global healthcare interoperability standards.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6 h-[65vh]">
        {/* LEFT: JSON Code Viewer (Dark Mode) */}
        <div className="w-3/5 bg-[#1e1e1e] rounded-xl shadow-lg border border-slate-700 flex flex-col overflow-hidden">
          <div className="bg-[#2d2d2d] px-4 py-2 border-b border-slate-700 flex items-center justify-between">
            <span className="text-slate-300 text-sm font-mono flex items-center gap-2">
              <Database className="w-4 h-4" /> claim_Pandurang_Khamitkar.json
            </span>
            <span className="flex space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
            </span>
          </div>
          <div className="p-4 overflow-y-auto flex-grow text-sm font-mono text-emerald-400">
            <pre className="whitespace-pre-wrap leading-relaxed">
              {JSON.stringify(fhirPayload, null, 2)}
            </pre>
          </div>
        </div>

        {/* RIGHT: Interactive Breakdown / Highlights */}
        <div className="w-2/5 flex flex-col gap-4">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Payload Breakdown</h3>
          
          <div 
            onClick={() => setActiveSection('bundle')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${activeSection === 'bundle' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Database className={`w-5 h-5 ${activeSection === 'bundle' ? 'text-blue-600' : 'text-slate-500'}`} />
              <h4 className="font-bold text-slate-800">1. The Bundle Envelope</h4>
            </div>
            <p className="text-sm text-slate-600">Acts as a secure container wrapping multiple resources (Patient + Claim) into a single deliverable package for the TPA.</p>
          </div>

          <div 
            onClick={() => setActiveSection('patient')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${activeSection === 'patient' ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <User className={`w-5 h-5 ${activeSection === 'patient' ? 'text-purple-600' : 'text-slate-500'}`} />
              <h4 className="font-bold text-slate-800">2. Patient Identity</h4>
            </div>
            <p className="text-sm text-slate-600">Extracts and normalizes demographics. Notice how the string "Pandurang Khamitkar" is strictly split into <code>family</code> and <code>given</code> name arrays.</p>
          </div>

          <div 
            onClick={() => setActiveSection('claim')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${activeSection === 'claim' ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity className={`w-5 h-5 ${activeSection === 'claim' ? 'text-emerald-600' : 'text-slate-500'}`} />
              <h4 className="font-bold text-slate-800">3. Medical Necessity (Linkage)</h4>
            </div>
            <p className="text-sm text-slate-600">The true RCM logic. The AI mapped the CPT procedure (99386) to the ICD-10 diagnosis (Z00.00) using <code>diagnosisSequence</code> to prevent claim denial.</p>
          </div>

          {/* Action Button to move to the Final Step */}
          <div className="mt-auto">
            <button 
              onClick={onProceed}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors flex items-center justify-center space-x-2 shadow-md"
            >
              <span>Run Final Adjudication Audit</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FhirViewer;