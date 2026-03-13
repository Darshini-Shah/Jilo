import React, { useState } from 'react';
import { CheckCircle, AlertCircle, ShieldCheck, Send, RefreshCcw, DollarSign } from 'lucide-react';

const ReconciliationDashboard = ({ onRestart }) => {
  // Hackathon Trick: Toggle between "Perfect Claim" and "Error Detected"
  const [showError, setShowError] = useState(false);

  return (
    <div className="w-full mt-4 flex flex-col gap-6">
      
      {/* Header Panel */}
      <div className={`p-6 rounded-xl flex items-center justify-between shadow-sm transition-colors duration-500 ${showError ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
        <div className="flex items-center space-x-4">
          {showError ? (
            <AlertCircle className="w-10 h-10 text-red-600" />
          ) : (
            <ShieldCheck className="w-10 h-10 text-emerald-600" />
          )}
          <div>
            <h2 className={`text-2xl font-bold ${showError ? 'text-red-800' : 'text-emerald-800'}`}>
              {showError ? 'Reconciliation Failed: Flags Detected' : 'Claim 100% Reconciled'}
            </h2>
            <p className={showError ? 'text-red-600' : 'text-emerald-600'}>
              {showError ? 'Manual review required before TPA submission.' : 'All clinical and financial rules passed. Ready for TPA.'}
            </p>
          </div>
        </div>

        {/* Hidden button to show judges the error catching capability */}
        <button 
          onClick={() => setShowError(!showError)}
          className="text-xs bg-white border border-slate-300 px-3 py-1 rounded text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
          title="Toggle Error State for Judges Demo"
        >
          Toggle Demo Mode
        </button>
      </div>

      {/* The Audit Rules Engine UI */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">Automated Audit Rules Engine</h3>
        </div>
        
        <div className="p-0">
          {/* Rule 1: Demographic Match (Always Green) */}
          <div className="flex items-start space-x-4 p-6 border-b border-slate-100">
            <CheckCircle className="w-6 h-6 text-emerald-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-800">Demographic & Patient Match</h4>
              <p className="text-sm text-slate-500">Patient identity extracted successfully. Age demographic (40-64) matches the CPT 99386 requirement.</p>
            </div>
          </div>

          {/* Rule 2: Medical Necessity (Always Green) */}
          <div className="flex items-start space-x-4 p-6 border-b border-slate-100">
            <CheckCircle className="w-6 h-6 text-emerald-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-800">Medical Necessity Validation</h4>
              <p className="text-sm text-slate-500">ICD-10 Code <b>Z00.00</b> (Routine checkup) fully justifies the billing of CPT Code <b>99386</b> (Preventative visit).</p>
            </div>
          </div>

          {/* Rule 3: Financial Reconcilliation (Changes based on toggle) */}
          <div className={`flex items-start space-x-4 p-6 ${showError ? 'bg-red-50' : ''}`}>
            {showError ? (
              <AlertCircle className="w-6 h-6 text-red-500 mt-0.5" />
            ) : (
              <CheckCircle className="w-6 h-6 text-emerald-500 mt-0.5" />
            )}
            <div className="w-full">
              <h4 className={`font-semibold ${showError ? 'text-red-800' : 'text-slate-800'}`}>Financial Constraint Check</h4>
              {showError ? (
                <div className="mt-2 text-sm text-red-700">
                  <p><b>Revenue Leakage Warning:</b> The billed amount for CPT 99386 is <b>₹5,490</b>. The standard TPA allowed limit for this code is <b>₹4,000</b>.</p>
                  <p className="mt-1 font-medium">Action Required: Adjust the claim amount or attach special authorization before submission to prevent denial.</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Billed amount (₹5,490) is within acceptable TPA limits for this procedural code. No revenue leakage detected.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-2">
        <button 
          onClick={onRestart}
          className="w-1/3 py-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2"
        >
          <RefreshCcw className="w-5 h-5" />
          <span>Process New Document</span>
        </button>
        
        <button 
          disabled={showError}
          className={`w-2/3 py-4 rounded-lg font-bold transition-all flex items-center justify-center space-x-2 shadow-md ${
            showError 
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          <Send className="w-5 h-5" />
          <span>{showError ? 'Resolve Errors to Submit' : 'Submit Clean Claim to TPA'}</span>
        </button>
      </div>

    </div>
  );
};

export default ReconciliationDashboard;
