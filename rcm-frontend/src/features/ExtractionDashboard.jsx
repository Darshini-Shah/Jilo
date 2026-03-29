import React, { useState } from 'react';
import { FileText, ArrowRight, ArrowLeft, Activity, ShieldCheck, CheckCircle2, Stethoscope, ClipboardList } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ExtractionDashboard = ({ files = [], apiResults = [], isBatch = false, onConfirm, onAction, onBack, stage, patient }) => {
  const [activeFileId, setActiveFileId] = useState(`file-0`);





  return (
    <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">

      {/* TOP NAVIGATION BAR */}
      <div className="flex items-center justify-between py-1 px-4 bg-muted/30 shrink-0">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground font-bold h-7 px-2 text-xs">
          <ArrowLeft className="w-3.5 h-2 mr-1.5" />
          Back
        </Button>

        <div className="flex gap-2 items-center">

          {stage === 'preAuth' ? (
            <>
              <Button size="sm" onClick={() => onAction('admit')} className="font-semibold cursor-pointer text-white bg-black shadow-md shadow-green-900/20">
                Admit Patient
              </Button>
              <Button size="sm" onClick={() => onAction('discharge')} variant="destructive" className="font-bold shadow-md">
                Discharge
              </Button>
              <Button size="sm" onClick={onConfirm} variant="outline" className="font-bold shadow-sm">
                View Pre-Auth Form
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            </>
          ) : stage === 'admitted' ? (
            <>
              <Button size="sm" onClick={onConfirm} variant="outline" className="font-bold shadow-sm">
                View FHIR Bundle
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
              <Button size="sm" onClick={() => onAction('discharge')} variant="destructive" className="font-bold shadow-md">
                Discharge Patient
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={onConfirm} className="font-bold shadow-md shadow-foreground/10">
              Approve Batch ({files.length})
              <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeFileId} onValueChange={setActiveFileId} className="w-full grow flex flex-col">
        {files.length > 1 && (
          <TabsList className="mb-4 h-auto flex flex-wrap justify-start items-center p-1 bg-muted/50 w-full overflow-x-auto">
            {files.map((file, idx) => (
              <TabsTrigger
                key={idx}
                value={`file-${idx}`}
                className="flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="truncate max-w-[120px] text-xs font-semibold">{file.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        {files.map((currentFile, idx) => {
          // 1. Safely get the data
          const currentAiData = isBatch ? (apiResults[0] || {}) : (apiResults[idx] || {});

          // 2. Use Optional Chaining (?.) for EVERYTHING
          // Guard: only call createObjectURL on real File/Blob instances.
          // Files routed from the dashboard are plain { name, url } objects — calling
          // createObjectURL on them throws a TypeError and crashes the component.
          const pdfUrl = currentFile
            ? (currentFile.url || (currentFile instanceof Blob ? URL.createObjectURL(currentFile) : null))
            : null;
          const confidenceScore = currentAiData?.confidence_score || 0;

          // These lines were likely causing the crash:
          const diagnoses = currentAiData?.patient?.diagnoses || [];
          const services = currentAiData?.patient?.services || [];
          const preauthForm = currentAiData?.preauth_form_json;

          return (
            <TabsContent key={idx} value={`file-${idx}`} className="mt-0 h-full">
              {/* MAIN SPLIT VIEW */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] min-h-[600px]">

                {/* LEFT PANEL: Document Preview */}
                <Card className="lg:col-span-7 flex flex-col overflow-hidden shadow-sm h-full">
                  <div className="bg-muted p-3 border-b flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-background border rounded-md flex items-center justify-center text-foreground">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-foreground">Source Document</h3>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{currentFile?.name}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                      Read-only
                    </Badge>
                  </div>
                  <CardContent className="grow p-0 relative">
                    {pdfUrl ? (
                      <iframe src={pdfUrl} className="w-full h-full absolute inset-0 bg-white" title="PDF Preview" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-muted-foreground text-sm font-medium">
                        No document available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* RIGHT PANEL: AI Extracted Data */}
                <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar h-full pb-8">

                  {/* Services & Coding Table */}
                  <Card className="shadow-sm shrink-0 border-l-4 border-l-blue-500">
                    <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 border-b">
                      <CardTitle className="text-xs font-bold uppercase tracking-wide">Highlighting Amounts</CardTitle>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold">
                        <CheckCircle2 className="w-3 h-3 mr-1.5" /> RAG ACTIVE
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-0"> {/* Changed to p-0 for a cleaner table-to-edge look */}
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="text-xs font-bold px-4">Description</TableHead>
                            <TableHead className="text-xs font-bold px-4 text-right w-[120px]">Amt (₹)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Use optional chaining and a fallback empty array to prevent crashes */}
                          {services?.length > 0 ? (
                            services.map((svc, sIdx) => (
                              <TableRow key={sIdx}>
                                <TableCell className="font-medium text-xs px-4">
                                  {svc?.description || "Unknown Service"}
                                </TableCell>
                                <TableCell className="font-bold text-xs px-4 text-right">
                                  {svc?.amount ?? "0"}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={2} className="h-24 text-center text-muted-foreground text-xs">
                                No services extracted.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default ExtractionDashboard;