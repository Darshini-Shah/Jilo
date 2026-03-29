import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  FileSearch, 
  ShieldCheck, 
  Calculator, 
  CirclePlus, 
  ClipboardList,
  Plus,
  Stethoscope,
  X,
  Trash2,
  PencilLine,
  IndianRupee,
  Loader2,
  Zap,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const AdmittedStageWorkspace = ({ 
  patient, 
  onUploadClick, 
  onProcessBatch,
  onAddPatientAmount,
  onDeletePatientAmount,
  onRefreshPatient
}) => {
  const [isEnhancementOpen, setIsEnhancementOpen] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newAmt, setNewAmt] = useState('');
  const [isAddingAmount, setIsAddingAmount] = useState(false);
  const [deletingKey, setDeletingKey] = useState(null);
  const docs = patient.documents || [];
  const amounts = patient.amount || {};
  
  // ── ADMITTED categories (core admission documents) ──
  const admittedCategories = [
    { id: 'bill', label: 'Hospital Bill', Icon: Calculator, prefix: 'admit_bill__' },
    { id: 'report', label: 'Clinical Reports', Icon: ClipboardList, prefix: 'admit_report__' },
  ];

  // ── ENHANCEMENT categories ──
  const enhancementCategories = [
    { id: 'enhancement', label: 'Enhancement Docs', Icon: CirclePlus, prefix: 'admit_enhancement__' },
    { id: 'enh_bill', label: 'Enhancement Bill', Icon: Calculator, prefix: 'enhance_bill__' },
    { id: 'enh_report', label: 'Enhancement Report', Icon: ClipboardList, prefix: 'enhance_report__' },
  ];

  const getDocsForCategory = (prefix) => {
    return docs.filter(d => d.stage === 'admitted' && d.name.includes(prefix));
  };

  // All admitted-prefix docs (for pipeline processing)
  const allAdmittedDocs = docs.filter(d => d.stage === 'admitted' && !d.name.includes('admit_enhancement__') && !d.name.includes('enhance_'));
  const allEnhancementDocs = docs.filter(d => d.stage === 'admitted' && (d.name.includes('admit_enhancement__') || d.name.includes('enhance_')));
  const approvalDocs = docs.filter(d => d.stage === 'admitted' && d.name.includes('admit_approved__'));

  const totalEnhancementDocs = enhancementCategories.reduce(
    (sum, cat) => sum + getDocsForCategory(cat.prefix).length, 0
  );

  const totalAmount = Object.values(amounts).reduce((sum, v) => sum + (Number(v) || 0), 0);

  const handleAddAmount = async () => {
    if (!newDesc.trim() || !newAmt) return;
    setIsAddingAmount(true);
    await onAddPatientAmount(patient.id, newDesc.trim(), Number(newAmt));
    setNewDesc('');
    setNewAmt('');
    setIsAddingAmount(false);
  };

  const handleDeleteAmount = async (desc) => {
    setDeletingKey(desc);
    await onDeletePatientAmount(patient.id, desc);
    setDeletingKey(null);
  };

  const renderCategoryCard = (cat) => {
    const { Icon, label, id, prefix } = cat;
    const catDocs = getDocsForCategory(prefix);
    return (
      <div key={id} className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center">
            <Icon className="w-3.5 h-3.5 mr-2" /> {label}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground opacity-50">{catDocs.length}</span>
        </div>
        
        <div 
          onClick={() => onUploadClick(cat.prefix)}
          className="border-2 border-dashed border-muted rounded-lg p-4 flex flex-col items-center justify-center hover:bg-muted/30 hover:border-primary/30 transition-all cursor-pointer group h-32"
        >
          {catDocs.length === 0 ? (
            <>
              <UploadCloud className="w-6 h-6 text-muted-foreground group-hover:text-primary mb-2 transition-colors" />
              <span className="text-[9px] uppercase font-bold text-muted-foreground group-hover:text-primary">Upload PDF</span>
            </>
          ) : (
            <div className="w-full space-y-2">
              {catDocs.slice(0, 2).map(d => (
                <div key={d.id} className="flex items-center gap-2 bg-background border rounded p-1">
                  <FileText className="w-3 h-3 text-primary shrink-0" />
                  <span className="text-[9px] font-bold truncate max-w-[80px]">{d.name.replace(cat.prefix, '')}</span>
                </div>
              ))}
              {catDocs.length > 2 && <span className="text-[8px] text-muted-foreground ml-1">+{catDocs.length - 2} more</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ╔══════════════════════════════════════════════╗
          ║  SECTION 1: ADMITTED / BILLING WORKSPACE      ║
          ╚══════════════════════════════════════════════╝ */}
      <Card className="border-blue-500/30 ring-1 ring-blue-500/10 overflow-hidden shadow-xl bg-card">
        <div className="p-4 border-b flex items-center justify-between bg-blue-500/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-foreground leading-none">Billing & Admission</h4>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Core Admission Documents</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 py-1 uppercase font-bold tracking-widest">
            Admission Active
          </Badge>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {admittedCategories.map(renderCategoryCard)}
        </div>

        {/* Process Admitted Pipeline Button */}
        <div className="p-4 bg-muted/20 border-t">
          <Button 
            size="sm"
            className="w-full font-black text-[10px] uppercase tracking-[0.2em] h-10 shadow-lg shadow-blue-500/10 gap-2"
            onClick={onProcessBatch}
            disabled={allAdmittedDocs.length === 0}
          >
            <Zap className="w-4 h-4" /> Process Admitted Pipeline ({allAdmittedDocs.length} files)
          </Button>
        </div>

        <div className="px-6 py-2 bg-muted/5 border-t">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic">
            Runs the 4-step AI extraction pipeline on uploaded admission documents (OCR → Retrieval → FHIR → Validation).
          </p>
        </div>
      </Card>

      {/* ╔══════════════════════════════════════════════╗
          ║  SECTION 2: ENHANCEMENT (Collapsible)         ║
          ╚══════════════════════════════════════════════╝ */}
      <Card className={`overflow-hidden transition-all duration-500 ${
        isEnhancementOpen 
          ? 'border-amber-500/40 ring-1 ring-amber-500/15 shadow-xl shadow-amber-500/5' 
          : 'border-dashed border-2 border-muted-foreground/20 hover:border-amber-500/30 shadow-sm'
      }`}>
        <div 
          className={`p-4 flex items-center justify-between cursor-pointer transition-all duration-300 select-none ${
            isEnhancementOpen ? 'bg-amber-500/5 border-b' : 'bg-muted/5 hover:bg-amber-500/5'
          }`}
          onClick={() => setIsEnhancementOpen(!isEnhancementOpen)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              isEnhancementOpen ? 'bg-amber-500/15' : 'bg-muted/30'
            }`}>
              {isEnhancementOpen 
                ? <Stethoscope className="w-4 h-4 text-amber-500" /> 
                : <Plus className="w-4 h-4 text-muted-foreground" />
              }
            </div>
            <div>
              <h4 className={`text-sm font-black uppercase tracking-widest leading-none transition-colors ${
                isEnhancementOpen ? 'text-foreground' : 'text-muted-foreground'
              }`}>Enhancement</h4>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">
                {isEnhancementOpen ? 'Additional condition / disease files' : 'Click to add files for additional conditions'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {totalEnhancementDocs > 0 && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 uppercase font-bold tracking-widest text-[9px]">
                {totalEnhancementDocs} file{totalEnhancementDocs !== 1 ? 's' : ''}
              </Badge>
            )}
            <Button 
              variant={isEnhancementOpen ? "ghost" : "outline"}
              size="sm"
              className={`font-black text-[10px] uppercase tracking-[0.15em] px-4 py-1 transition-all duration-300 ${
                isEnhancementOpen 
                  ? 'text-muted-foreground hover:text-foreground' 
                  : 'border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:border-amber-500/50'
              }`}
              onClick={(e) => { e.stopPropagation(); setIsEnhancementOpen(!isEnhancementOpen); }}
            >
              {isEnhancementOpen ? (
                <><X className="w-3 h-3 mr-1.5" /> Close</>
              ) : (
                <><CirclePlus className="w-3 h-3 mr-1.5" /> Open Enhancement</>
              )}
            </Button>
          </div>
        </div>

        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isEnhancementOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {enhancementCategories.map(renderCategoryCard)}
          </div>

          {/* Process Enhancement Pipeline Button */}
          <div className="p-4 bg-amber-500/5 border-t">
            <Button 
              size="sm"
              className="w-full font-black text-[10px] uppercase tracking-[0.2em] h-10 shadow-lg shadow-amber-500/10 gap-2 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={onProcessBatch}
              disabled={allEnhancementDocs.length === 0}
            >
              <Zap className="w-4 h-4" /> Process Enhancement Pipeline ({allEnhancementDocs.length} files)
            </Button>
          </div>

          <div className="px-6 py-2 bg-muted/5 border-t">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic flex items-center gap-2">
              <Stethoscope className="w-3 h-3 text-amber-500/60" />
              Enhancement docs are for new conditions discovered during admission. Processed separately from primary records.
            </p>
          </div>
        </div>
      </Card>

      {/* ╔══════════════════════════════════════════════╗
          ║  SECTION 3: AMOUNT LEDGER                     ║
          ╚══════════════════════════════════════════════╝ */}
      <Card className="border-emerald-500/30 ring-1 ring-emerald-500/10 overflow-hidden shadow-xl bg-card">
        <div className="p-4 border-b flex items-center justify-between bg-emerald-500/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-foreground leading-none">Amount Ledger</h4>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Service Charges & Line Items</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 py-1 uppercase font-bold tracking-widest text-xs">
            <IndianRupee className="w-3 h-3 mr-1" />{totalAmount.toLocaleString('en-IN')}
          </Badge>
        </div>

        {/* Amount Table */}
        <div className="divide-y divide-border">
          {Object.keys(amounts).length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground font-medium">
              No amount entries yet. Add items below or run the Admitted Pipeline to auto-populate.
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-12 px-4 py-2 bg-muted/30 text-[9px] uppercase font-black tracking-widest text-muted-foreground">
                <span className="col-span-7">Description</span>
                <span className="col-span-3 text-right">Amount (₹)</span>
                <span className="col-span-2 text-center">Action</span>
              </div>
              {/* Table Rows */}
              {Object.entries(amounts).map(([desc, amt]) => (
                <div key={desc} className="grid grid-cols-12 px-4 py-3 items-center bg-background hover:bg-muted/30 transition-colors group">
                  <span className="col-span-7 text-xs font-bold text-foreground truncate pr-3">{desc}</span>
                  <span className="col-span-3 text-xs font-bold text-right text-emerald-600 font-mono">₹{Number(amt).toLocaleString('en-IN')}</span>
                  <div className="col-span-2 flex justify-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteAmount(desc)}
                      disabled={deletingKey === desc}
                    >
                      {deletingKey === desc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              ))}
              {/* Total Row */}
              <div className="grid grid-cols-12 px-4 py-3 items-center bg-emerald-500/5 border-t-2 border-emerald-500/20">
                <span className="col-span-7 text-xs font-black uppercase tracking-widest text-foreground">Total</span>
                <span className="col-span-3 text-sm font-black text-right text-emerald-600 font-mono">₹{totalAmount.toLocaleString('en-IN')}</span>
                <span className="col-span-2"></span>
              </div>
            </>
          )}
        </div>

        {/* Add New Amount Row */}
        <div className="p-4 bg-muted/10 border-t flex gap-3 items-end">
          <div className="flex-[3] flex flex-col gap-1">
            <label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Description</label>
            <input 
              type="text" 
              value={newDesc} 
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="e.g. Room Charges, Surgery Fee..."
              className="h-9 px-3 text-xs font-bold border rounded bg-background text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
            />
          </div>
          <div className="flex-[1] flex flex-col gap-1">
            <label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Amount (₹)</label>
            <input 
              type="number" 
              value={newAmt} 
              onChange={(e) => setNewAmt(e.target.value)}
              placeholder="0"
              className="h-9 px-3 text-xs font-bold border rounded bg-background text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all font-mono"
            />
          </div>
          <Button 
            size="sm" 
            className="h-9 px-4 font-black text-[10px] uppercase tracking-widest gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/10"
            onClick={handleAddAmount}
            disabled={isAddingAmount || !newDesc.trim() || !newAmt}
          >
            {isAddingAmount ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            Add
          </Button>
        </div>
      </Card>

      {/* ╔══════════════════════════════════════════════╗
          ║  SECTION 4: APPROVAL LETTER UPLOAD            ║
          ╚══════════════════════════════════════════════╝ */}
      <Card className="border-violet-500/30 ring-1 ring-violet-500/10 overflow-hidden shadow-lg bg-card">
        <div className="p-4 border-b flex items-center justify-between bg-violet-500/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-foreground leading-none">Approval Letter</h4>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Upload review approval document</p>
            </div>
          </div>
          {approvalDocs.length > 0 && (
            <Badge variant="outline" className="bg-violet-500/10 text-violet-600 border-violet-500/20 uppercase font-bold tracking-widest text-[9px]">
              <CheckCircle2 className="w-3 h-3 mr-1" /> {approvalDocs.length} uploaded
            </Badge>
          )}
        </div>

        <div className="p-6">
          {approvalDocs.length > 0 ? (
            <div className="space-y-2 mb-4">
              {approvalDocs.map(d => (
                <div key={d.id} className="flex items-center gap-3 bg-muted/30 border rounded-lg p-3">
                  <FileText className="w-4 h-4 text-violet-500 shrink-0" />
                  <span className="text-xs font-bold truncate flex-1">{d.name.replace('admit_approved__', '')}</span>
                  <Badge variant="outline" className="text-[9px] uppercase tracking-widest h-5 rounded-sm bg-violet-500/5 text-violet-600">
                    <CheckCircle2 className="w-2.5 h-2.5 mr-1" />Stored
                  </Badge>
                </div>
              ))}
            </div>
          ) : null}

          <div 
            onClick={() => onUploadClick('admit_approved__')}
            className="border-2 border-dashed border-violet-500/20 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-violet-500/5 hover:border-violet-500/40 transition-all cursor-pointer group"
          >
            <Upload className="w-8 h-8 text-muted-foreground group-hover:text-violet-500 mb-2 transition-colors" />
            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground group-hover:text-violet-500 transition-colors">
              {approvalDocs.length > 0 ? 'Upload Another Approval Letter' : 'Upload Approval Letter'}
            </span>
            <span className="text-[9px] text-muted-foreground/60 mt-1">PDF format • Review approval from insurer</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdmittedStageWorkspace;
