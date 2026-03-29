import React, { useState } from 'react';
import { FileText, ArrowRight, ArrowLeft, Activity, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ExtractionDashboard = ({ files = [], apiResults = [], isBatch = false, onConfirm, onBack }) => {
  const [activeFileId, setActiveFileId] = useState(`file-0`);



  return (
    <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">

      {/* TOP NAVIGATION BAR */}
      <div className="flex items-center justify-between mt-0 mb-1 pb-1 border-b">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground font-bold h-7 px-2 text-xs">
          <ArrowLeft className="w-3.5 h-2 mr-1.5" />
          Back
        </Button>

        <div className="flex gap-2">
          <Button size="sm" onClick={onConfirm} className="h-7 font-bold shadow-md shadow-foreground/10 text-xs">
            Approve ({files.length})
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </div>

      <Tabs value={activeFileId} onValueChange={setActiveFileId} className="w-full flex-grow flex flex-col">
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
          const currentAiData = isBatch ? (apiResults[0] || {}) : (apiResults[idx] || {});
          const pdfUrl = currentFile ? (currentFile.url || URL.createObjectURL(currentFile)) : null;
          const confidenceScore = currentAiData?.confidence_score || 0;

          return (
            <TabsContent key={idx} value={`file-${idx}`} className="mt-0 h-full">
              {/* MAIN SPLIT VIEW */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-320px)] min-h-[450px]">

                {/* LEFT PANEL: Document Preview */}
                <Card className="flex flex-col overflow-hidden shadow-sm h-full">
                  <div className="bg-muted p-3 border-b flex items-center justify-between">
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
                  <CardContent className="flex-grow p-0 relative">
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
                <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">



                  {/* Header Info */}
                  <Card className="shadow-sm border-2 border-foreground shrink-0">
                    <CardHeader className="p-5 pb-0">
                      <CardTitle className="text-xs font-bold uppercase tracking-wide border-b pb-2">Claim Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 pt-4">
                      <div className="grid grid-cols-2 gap-y-5 gap-x-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-1">Hospital / Provider</p>
                          <p className="font-bold text-foreground">{currentAiData?.hospital_name || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-1">Invoice Date</p>
                          <p className="font-bold text-foreground">{currentAiData?.invoice_date || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-1">Patient Name</p>
                          <p className="font-bold text-foreground">{currentAiData?.patient?.name || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-1">Invoice #</p>
                          <p className="font-bold text-foreground">{currentAiData?.invoice_number || '-'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Services & Coding Table */}
                  <Card className="shadow-sm flex-grow shrink-0 mb-4">
                    <CardHeader className="p-5 flex flex-row items-center justify-between pb-2 border-b">
                      <CardTitle className="text-xs font-bold uppercase tracking-wide">Coded Services</CardTitle>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold">
                        <CheckCircle2 className="w-3 h-3 mr-1.5" /> {isBatch ? 'BATCH RECONCILIATION ACTIVE' : 'RAG ACTIVE'}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-[45%] text-xs font-bold">Description</TableHead>
                            <TableHead className="text-xs font-bold">Amt (₹)</TableHead>
                            <TableHead className="text-xs font-bold">CPT</TableHead>
                            <TableHead className="text-xs font-bold">ICD-10</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentAiData?.patient?.services && currentAiData.patient.services.length > 0 ? (
                            currentAiData.patient.services.map((svc, sIdx) => (
                              <TableRow key={sIdx}>
                                <TableCell className="font-medium text-xs">{svc.description}</TableCell>
                                <TableCell className="font-bold text-xs">{svc.amount}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-primary bg-primary/5 font-mono">{svc.cpt_code}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-secondary bg-secondary/5 font-mono">{svc.icd_10}</Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
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