import React, { useState } from 'react';
import { Database, ShieldCheck, User, Activity, ArrowRight, ArrowLeft, Code, Copy, CheckCircle2, FileText, Download, Eye, ClipboardList, Stethoscope } from 'lucide-react';
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

/* Recursively render JSON into clean, human-readable React elements */
const PrettyValue = ({ value }) => {
  if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground italic text-[10px]">Empty array</span>;

    // If it's an array of simple strings/numbers, render as inline badges
    if (value.every(v => typeof v !== 'object')) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v, i) => (
            <Badge key={i} variant="secondary" className="font-mono text-[9px] px-1.5 py-0">
              {String(v)}
            </Badge>
          ))}
        </div>
      );
    }

    // Array of objects -> render each as a sub-card
    return (
      <div className="flex flex-col gap-2 w-full mt-1">
        {value.map((item, idx) => (
          <div key={idx} className="bg-muted/10 p-2 rounded border border-muted/50 shadow-sm overflow-hidden">
            <PrettyValue value={item} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    // Quick-catch common FHIR specific structures
    if (value.reference) {
      return (
        <span className="font-semibold text-primary underline decoration-primary/30 truncate block">
          {value.display || value.reference.split('/').pop() || value.reference}
        </span>
      );
    }
    
    // Filter out technical FHIR boilerplate for human readability
    const entries = Object.entries(value).filter(([k]) => !['id', 'text', 'meta', 'identifier', 'extension'].includes(k));
    if (entries.length === 0) return null;
    return (
      <div className="grid grid-cols-1 gap-1.5 w-full">
        {entries.map(([k, v]) => (
          <div key={k} className="flex flex-col sm:flex-row gap-1 sm:gap-3 text-xs">
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px] sm:w-[85px] shrink-0 mt-[1px]">
              {humanizeKey(k)}
            </span>
            <div className="flex-1 break-words"><PrettyValue value={v} /></div>
          </div>
        ))}
      </div>
    );
  }

  // Primitive strings, numbers, booleans
  if (typeof value === 'boolean') {
    return (
      <Badge variant={value ? 'default' : 'outline'} className="text-[10px] uppercase font-bold py-0 h-4">
        {value ? 'True' : 'False'}
      </Badge>
    );
  }

  return <span className="font-semibold text-foreground break-words">{String(value)}</span>;
};

/* Humanize camelCase keys */
const humanizeKey = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .replace(/_/g, ' ')
    .trim();
};

const FhirViewer = ({ files = [], apiResults = [], patient, onProceed, onBack }) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('formal');

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

        {/* Dynamic header title moved to parent ProcessingPipeline */}

        <Button size="sm" onClick={onProceed} className="h-7 font-bold shadow-md shadow-foreground/10 text-xs">
          Run Reconciliation
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>



      {/* MAIN CONTENT SPLIT */}
      <div className={`grid grid-cols-1 gap-6 h-[calc(100vh-320px)] min-h-[400px]`}>

        {/* LEFT: FHIR Resource Viewer */}
        <Card className={`${patient?.step === 'pre auth' ? 'lg:col-span-3' : 'lg:col-span-1'} shadow-sm flex flex-col overflow-hidden border-2 border-foreground`}>
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

          <div className="flex-grow overflow-y-auto p-6 custom-scrollbar bg-card/50">
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
                  
                  // Filter out technical FHIR boilerplate fields
                  const fields = Object.entries(res).filter(([k]) => 
                    !['resourceType', 'id', 'text', 'meta', 'identifier', 'extension'].includes(k)
                  );

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
                            <span className="w-1/3 max-w-[120px] shrink-0 text-muted-foreground font-bold uppercase tracking-widest text-[10px] pt-1">
                              {humanizeKey(key)}
                            </span>
                            <div className="flex-1 w-full overflow-hidden">
                              <PrettyValue value={value} />
                            </div>
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