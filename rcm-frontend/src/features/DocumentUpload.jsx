import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, CheckCircle } from 'lucide-react';

const DocumentUpload = ({ onFileUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        alert("Bhai, for now, please upload PDF files only!");
      }
    }
  };

  // Handle manual file selection
  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        alert("Bhai, for now, please upload PDF files only!");
      }
    }
  };

  // Trigger file input click
  const onButtonClick = () => {
    inputRef.current.click();
  };

  // Remove selected file
  const removeFile = () => {
    setSelectedFile(null);
  };

  // Submit to parent (or backend)
  const handleProcess = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Upload Medical Record</h2>
        <p className="text-slate-500 text-sm mt-1">
          Securely import discharge summaries, bills, or lab reports (PDF only) for AI extraction.
        </p>
      </div>

      {/* Drag & Drop Zone */}
      {!selectedFile ? (
        <div
          className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ease-in-out ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleChange}
          />
          <UploadCloud className={`w-12 h-12 mb-4 ${dragActive ? 'text-blue-500' : 'text-slate-400'}`} />
          <p className="mb-2 text-sm text-slate-600">
            <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-slate-500">PDF documents only (Max 10MB)</p>
        </div>
      ) : (
        /* File Preview State */
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center space-x-3 text-emerald-700">
              <FileText className="w-8 h-8" />
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs opacity-80">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button 
              onClick={removeFile}
              className="p-1 text-emerald-700 hover:bg-emerald-200 rounded-full transition-colors"
              title="Remove file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={handleProcess}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Process Document with AI Engine</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;