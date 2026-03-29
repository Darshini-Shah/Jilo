import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Download, CheckCircle2, ClipboardList, Eye, Lightbulb, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const PreAuthDashboard = ({ files = [], apiResults = [], isBatch = false, onConfirm, onBack, patient }) => {
  const currentAiData = apiResults[0] || {};
  const preauthForm = currentAiData?.preauth_form_json;

  const [previewHtmlUrl, setPreviewHtmlUrl] = useState(null);
  const [loadingMedi, setLoadingMedi] = useState(false);

  useEffect(() => {
    const generatePreview = async () => {
      if (!preauthForm) return;
      setLoadingMedi(true);
      try {
        const resp = await fetch('http://localhost:8000/pipeline/export-html', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(preauthForm)
        });

        if (resp.ok) {
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          setPreviewHtmlUrl(url);
        } else {
          console.error('Failed to export HTML from backend');
        }
      } catch (err) {
        console.error("Backend connection failed", err);
      } finally {
        setLoadingMedi(false);
      }
    };

    generatePreview();

    // Cleanup blob URL
    return () => {
      if (previewHtmlUrl) {
        URL.revokeObjectURL(previewHtmlUrl);
      }
    };
  }, [preauthForm]);

  const handleDownloadHtml = () => {
    if (!previewHtmlUrl) return;
    const a = document.createElement('a');
    a.href = previewHtmlUrl;
    a.download = `MediAssist_${preauthForm?.patient?.name || 'Form'}.html`;
    a.click();
  };

  const handleDownloadJson = () => {
    if (!preauthForm) return;
    const blob = new Blob([JSON.stringify(preauthForm, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MediAssist_${preauthForm?.patient?.name || 'Data'}.json`;
    a.click();
  };

  const renderKVGrid = (obj, title) => {
    if (!obj || typeof obj !== 'object') return null;
    const entries = Object.entries(obj).filter(([, v]) => v !== '' && v !== null && v !== undefined && v !== false && !Array.isArray(v) && typeof v !== 'object');
    if (entries.length === 0) return null;
    return (
      <div className="mb-4">
        {title && <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">{title}</h4>}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-3 bg-muted/20 border rounded-sm">
          {entries.map(([key, val]) => (
            <div key={key} className="flex flex-col">
              <span className="text-[10px] text-muted-foreground capitalize font-semibold">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</span>
              <span className="text-xs font-bold text-foreground truncate" title={String(val)}>{String(val)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">

      {/* HEADER: Matching ExtractionDashboard Layout to fix padding overlaps */}
      <div className="flex items-center justify-between py-1 px-4 bg-muted/30 shrink-0 border-b">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground font-bold h-7 px-2 text-xs">
          <ArrowLeft className="w-3.5 h-2 mr-1.5" />
          Back
        </Button>

        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" onClick={handleDownloadJson} className="h-7 text-[10px] uppercase font-bold px-3">
            <Download className="w-3.5 h-3.5 mr-1" /> Raw JSON
          </Button>
          <Button size="sm" onClick={handleDownloadHtml} className="h-7 text-[10px] uppercase font-bold px-3 shadow-md bg-foreground text-background">
            <Download className="w-3.5 h-3.5 mr-1" /> Export Form
          </Button>
          <Button size="sm" onClick={onConfirm} variant="outline" className="h-7 font-bold shadow-sm">
            View FHIR Bundle
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] min-h-[600px] mt-4 px-4 w-full">

        {/* LEFT PANEL: Form Data Mapping */}
        <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar h-full pb-8">

          {/* AI Recommendations Card */}
          {currentAiData?.recommendations && (
            <Card className="shadow-sm border-l-4 border-l-amber-500 shrink-0 h-auto">
              <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 border-b">
                <CardTitle className="text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" /> AI Recommendations
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold">
                  Rule Engine
                </Badge>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {currentAiData.recommendations.recommended && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Suggested Action</h4>
                    <p className="text-xs font-semibold leading-relaxed text-foreground p-3 bg-amber-500/5 border border-amber-500/20 rounded-sm">
                      {currentAiData.recommendations.recommended}
                    </p>
                  </div>
                )}
                {currentAiData.recommendations.attached_files && currentAiData.recommendations.attached_files.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Required Attachments</h4>
                    <ul className="list-disc list-inside text-xs font-semibold text-foreground space-y-1 p-3 bg-muted/20 border rounded-sm">
                      {currentAiData.recommendations.attached_files.map((file, idx) => (
                        <li key={idx} className="text-muted-foreground"><span className="text-foreground">{file}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {preauthForm ? (
            <Card className="shadow-sm border-l-4 border-l-blue-500 shrink-0 h-auto">
              <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 border-b">
                <CardTitle className="text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" /> Pre-Auth Form Data Map
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold">
                  <CheckCircle2 className="w-3 h-3 mr-1.5 text-blue-500" /> Auto-Mapped
                </Badge>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {renderKVGrid(preauthForm.patient, "Patient Details")}
                {renderKVGrid(preauthForm.doctor, "Doctor / Treatment")}
                {renderKVGrid(preauthForm.admission, "Admission Details")}
                {renderKVGrid(preauthForm.costs, "Cost Estimates")}
                {renderKVGrid(preauthForm.hospital, "Hospital Info")}
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center p-8 border rounded-lg bg-muted/20">
              <p className="text-muted-foreground text-sm font-medium">No mapped form data available.</p>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Extracted Form Preview via Iframe */}
        <Card className="lg:col-span-7 shadow-sm flex flex-col overflow-hidden bg-zinc-100/50 h-full border border-border">
          {/* <CardHeader className="bg-white p-3 border-b flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-background border rounded flex items-center justify-center">
                <FileText className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-wide">MediAssist Form Output</CardTitle>
                <CardDescription className="text-xs">HTML Auto-Generated Document</CardDescription>
              </div>
            </div>
          </CardHeader> */}

          <CardContent className="flex-grow p-0 relative sm:p-2">
            {loadingMedi ? (
              <div className="flex flex-col items-center justify-center p-20 gap-3 h-full">
                <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Generating Live Form...</p>
              </div>
            ) : previewHtmlUrl ? (
              <iframe
                src={previewHtmlUrl}
                className="w-full h-full bg-white rounded shadow-sm border"
                title="Generated MediAssist Form"
              />
            ) : (
              <div className="flex items-center justify-center p-12 h-full text-center">
                <p className="text-muted-foreground text-sm font-medium">Failed to load preview. Please export.</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default PreAuthDashboard;
