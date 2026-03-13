import React from 'react';
import { CheckCircle, AlertTriangle, FileText, ArrowRight } from 'lucide-react';

const ExtractionDashboard = ({ file, onConfirm }) => {
  // Mocking the AI response we built in the Python backend
  const mockAiData = {
    invoice_number: "2602196",
    invoice_date: "2021-07-25",
    hospital_name: "Expedient Healthcare Marketing Pvt Ltd",
    patient: {
      name: "Pandurang Khamitkar",
      services: [
        {
          description: "Healthy India 2021 Full Body Checkup With Vitamin Screening",
          amount: 5490.00,
          cpt_code: "99386",
          icd_10: "Z00.00",
          match_confidence: "98%"
        }
      ]
    }
  };

  // Safe object URL for PDF preview (if available)
  const pdfUrl = file ? URL.createObjectURL(file) : null;

  return (
    <div className="w-full h-[85vh] flex gap-6 mt-4">
      {/* LEFT PANEL: Document Preview */}
      <div className="w-1/2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-slate-500" />
            <h3 className="font-semibold text-slate-700">Source Document</h3>
          </div>
          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">Read-only</span>
        </div>
        <div className="flex-grow bg-slate-100 p-4">
          {pdfUrl ? (
            <iframe src={pdfUrl} className="w-full h-full rounded border border-slate-300" title="PDF Preview" />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-slate-400">
              No document available for preview
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: AI Extracted Data */}
      <div className="w-1/2 flex flex-col gap-4 overflow-y-auto">
        {/* Header Info */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Extracted Invoice Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Hospital/Provider</p>
              <p className="font-medium text-slate-800">{mockAiData.hospital_name}</p>
            </div>
            <div>
              <p className="text-slate-500">Invoice Date</p>
              <p className="font-medium text-slate-800">{mockAiData.invoice_date}</p>
            </div>
            <div>
              <p className="text-slate-500">Patient Name</p>
              <p className="font-medium text-slate-800">{mockAiData.patient.name}</p>
            </div>
          </div>
        </div>

        {/* Services & Coding Table */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">Coded Services (RAG Engine)</h3>
            <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
              <CheckCircle className="w-3 h-3 mr-1" /> AI Confident
            </span>
          </div>
          
          {mockAiData.patient.services.map((svc, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <p className="text-sm font-medium text-slate-800 mb-3">{svc.description}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-2 border border-slate-200 rounded">
                  <p className="text-xs text-slate-500">Amount</p>
                  <p className="font-bold text-slate-700">₹{svc.amount}</p>
                </div>
                <div className="bg-white p-2 border border-blue-200 rounded">
                  <p className="text-xs text-blue-600 font-semibold">CPT Code</p>
                  <p className="font-bold text-slate-800">{svc.cpt_code}</p>
                </div>
                <div className="bg-white p-2 border border-purple-200 rounded">
                  <p className="text-xs text-purple-600 font-semibold">ICD-10 (Diag)</p>
                  <p className="font-bold text-slate-800">{svc.icd_10}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="mt-auto pt-4">
          <button 
            onClick={onConfirm}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center space-x-2 shadow-md"
          >
            <span>Approve & Generate FHIR Bundle</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtractionDashboard;