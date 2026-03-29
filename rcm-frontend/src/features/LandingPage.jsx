import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ui/themetoggle';
import {
  FolderOpen, ArrowRight, ShieldCheck, FileSearch, Cpu, Activity,
  ChevronRight, Database, Zap, Lock, FileText, CheckCircle2,
  BarChart3, Brain, Network, GitBranch, AlertCircle, Layers
} from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  {
    id: 1,
    icon: FileSearch,
    label: 'Ingestion & OCR',
    sublabel: 'Step 01',
    description:
      'Hospital PDFs are uploaded and converted to raw text using EasyOCR. Gemini 2.5 Flash then cleans and structures the output into labelled clinical sections — Patient Info, Billing, Medications, Diagnosis.',
    tags: ['EasyOCR', 'PDF2Image', 'Gemini 2.5 Flash'],
  },
  {
    id: 2,
    icon: Brain,
    label: 'RAG Retrieval',
    sublabel: 'Step 02',
    description:
      'Named medical entities are extracted from the structured text. A hybrid BGE vector + BM25 search fans out in parallel across the ICD-10 master database, with a MedCPT cross-encoder re-ranking the top results.',
    tags: ['BGE Embeddings', 'BM25', 'Cross-Encoder Rerank'],
  },
  {
    id: 3,
    icon: Layers,
    label: 'FHIR R4 Generation',
    sublabel: 'Step 03',
    description:
      'AI-structured patient, diagnosis, and service data is mapped onto HL7 FHIR R4 resource types — Patient, Claim, ClaimDiagnosis, ClaimItem — and packaged into a standards-compliant Bundle JSON.',
    tags: ['HL7 FHIR R4', 'Gemini Structured Output', 'Pydantic'],
  },
  {
    id: 4,
    icon: ShieldCheck,
    label: 'CMS Validation',
    sublabel: 'Step 04',
    description:
      'Every claim is automatically audited against CMS edits: MUE quantity limits, PTP unbundling rules, gender-specific procedure codes, and NCD medical necessity crosswalks. Anomalies surface in an OperationOutcome report.',
    tags: ['MUE Edits', 'PTP Unbundling', 'NCD Crosswalk'],
  },
];

const FEATURES = [
  {
    icon: Cpu,
    title: 'AI-Powered Extraction',
    description:
      'Gemini 2.5 Flash with structured JSON output schema enforces 100% Pydantic-validated data extraction — no hallucinations, no free-form drift.',
  },
  {
    icon: Network,
    title: 'Hybrid RAG Retrieval',
    description:
      'Parallel ThreadPoolExecutor searches combine dense vector similarity with BM25 sparse retrieval, fused via Reciprocal Rank Fusion and re-ranked by a cross-encoder.',
  },
  {
    icon: Database,
    title: 'CMS-Grade Ruleset',
    description:
      'Full coverage of Medicare PTP edits (4 xlsx files), MUE limits (3 service types), HCPCS gender codes, and NCD ICD-10 crosswalk — all loaded into O(1) in-memory dicts.',
  },
  {
    icon: Lock,
    title: 'Supabase AuthN/AuthZ',
    description:
      'JWT Bearer authentication via Supabase. Service-role server-side client for admin operations; anon-key client-side for session management. All data scoped by TPA ID.',
  },
  {
    icon: GitBranch,
    title: 'Modular MVC Architecture',
    description:
      'Full Controller → Router → Schema separation. Each entity (patients, hospitals, documents, FHIR records, auth) has isolated, independently testable modules.',
  },
  {
    icon: Zap,
    title: 'Real-Time Pipeline',
    description:
      'FastAPI async lifespan handles CMS dictionary pre-loading. Each file is processed through 4 pipeline stages with intermediate outputs persisted for audit trail.',
  },
];

const VALIDATION_RULES = [
  { code: 'MUE', label: 'Medically Unlikely Edits', description: 'Checks billed units against CMS per-code quantity limits for Practitioner, Outpatient, and DME service types.' },
  { code: 'PTP', label: 'Procedure-to-Procedure Edits', description: 'Detects bundling violations — procedure codes that cannot be billed together per CMS Correct Coding Initiative.' },
  { code: 'GDR', label: 'Gender Demographic Rules', description: 'Flags gender-specific procedure codes (e.g., maternity, prostate) billed against mismatched patient demographics.' },
  { code: 'NCD', label: 'National Coverage Determination', description: 'Validates that each CPT procedure is supported by at least one of the claim\'s ICD-10 diagnosis codes per Medicare NCD policies.' },
];

const TECH_STACK = [
  { label: 'FastAPI', category: 'Backend' },
  { label: 'Supabase', category: 'Database & Auth' },
  { label: 'Gemini 2.5 Flash', category: 'AI / LLM' },
  { label: 'LangChain', category: 'AI / LLM' },
  { label: 'BGE Embeddings', category: 'Retrieval' },
  { label: 'HL7 FHIR R4', category: 'Standard' },
  { label: 'fhir.resources', category: 'Standard' },
  { label: 'EasyOCR', category: 'OCR' },
  { label: 'React 18', category: 'Frontend' },
  { label: 'shadcn/ui', category: 'Frontend' },
  { label: 'Vite', category: 'Frontend' },
  { label: 'Pydantic v2', category: 'Validation' },
];

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ onLogin }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-11 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-foreground text-background font-bold shadow-sm">
            <FolderOpen className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-widest uppercase leading-none">Ctrl PluZ</span>
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest mt-px">by Jilo — Hackathon 2026</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button size="sm" onClick={onLogin} className="h-7 text-xs font-bold px-3">
            Login <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ onLogin }) {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center pt-11 px-4 text-center">
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-4xl mx-auto">
        <Badge variant="outline" className="mb-6 text-[10px] uppercase tracking-widest font-bold px-3 py-1 border-foreground/20">
          <Zap className="w-3 h-3 mr-1.5" /> AI-Powered Revenue Cycle Management
        </Badge>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
          Hospital Claims.
          <br />
          <span className="text-muted-foreground">Normalized.</span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
          Transform unstructured hospital PDFs into validated, CMS-compliant HL7 FHIR R4 bundles in seconds. 
          End-to-end AI pipeline — OCR → RAG Retrieval → FHIR Generation → Automated Audit.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" onClick={onLogin} className="h-10 px-6 font-bold text-sm shadow-lg shadow-foreground/10">
            Access Platform <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => document.getElementById('pipeline-section').scrollIntoView({ behavior: 'smooth' })} className="h-10 px-6 font-bold text-sm">
            See How It Works
          </Button>
        </div>

        {/* Quick stats strip */}
        <div className="mt-16 pt-10 border-t grid grid-cols-3 gap-8 max-w-lg mx-auto">
          {[
            { value: '4', label: 'Pipeline Stages' },
            { value: '4', label: 'CMS Rule Sets' },
            { value: 'R4', label: 'FHIR Standard' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pipeline Flowchart ────────────────────────────────────────────────────────

function PipelineSection() {
  return (
    <section id="pipeline-section" className="py-24 px-4 border-t bg-muted/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">End-to-End Workflow</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">The 4-Stage Pipeline</h2>
          <p className="mt-4 text-muted-foreground text-sm max-w-xl mx-auto">
            Every uploaded document passes through four sequential, auditable stages before a validated FHIR bundle is ready for TPA submission.
          </p>
        </div>

        {/* Horizontal flow on large, vertical on small */}
        <div className="relative">
          {/* Connector line — desktop only */}
          <div className="hidden lg:block absolute top-[52px] left-[calc(12.5%+32px)] right-[calc(12.5%+32px)] h-px bg-border" />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {PIPELINE_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="relative flex flex-col items-center">
                  {/* Step number + icon */}
                  <div className="flex lg:flex-col items-center gap-4 mb-4 w-full lg:items-center">
                    <div className="relative flex-shrink-0">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-border bg-background shadow-sm z-10">
                        <Icon className="w-7 h-7 text-foreground" />
                      </div>
                      {/* Mobile connector */}
                      {idx < PIPELINE_STEPS.length - 1 && (
                        <div className="lg:hidden absolute left-1/2 -translate-x-1/2 top-full mt-2 w-px h-6 bg-border" />
                      )}
                    </div>
                    <div className="lg:mt-4 text-center">
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{step.sublabel}</p>
                      <h3 className="text-sm font-bold tracking-tight mt-0.5">{step.label}</h3>
                    </div>
                  </div>

                  <Card className="flex-1 bg-background shadow-sm border w-full">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{step.description}</p>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {step.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5">{tag}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Output arrow */}
        <div className="mt-10 flex flex-col items-center gap-2">
          <div className="w-px h-8 bg-border" />
          <div className="flex items-center gap-3 border rounded-lg px-5 py-3 bg-background shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-foreground" />
            <p className="text-xs font-bold uppercase tracking-widest">FHIR OperationOutcome + Validated Claim Bundle → TPA Submission</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section className="py-24 px-4 border-t bg-muted/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Capabilities</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Built for Production</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="bg-background shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted mb-4">
                  <Icon className="w-4 h-4 text-foreground" />
                </div>
                <h3 className="text-sm font-bold mb-2 tracking-tight">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CMS Validation Rules ─────────────────────────────────────────────────────

function ValidationSection() {
  return (
    <section className="py-24 px-4 border-t">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Automated Audit Engine</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-5">CMS Rules — Zero Tolerance</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Every claim is run through an <code className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded text-xs">FHIRAnomalyDetector</code> backed by O(1) pre-built dictionaries loaded from official CMS data files at startup. No external API calls, no latency — pure in-memory lookups.
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <BarChart3 className="w-4 h-4" />
              <span>CMS data pickled for sub-second cold starts even on large datasets</span>
            </div>
          </div>

          <div className="space-y-3">
            {VALIDATION_RULES.map(({ code, label, description }) => (
              <div key={code} className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                <div className="flex-shrink-0 flex h-8 w-12 items-center justify-center rounded border bg-foreground text-background">
                  <span className="text-[9px] font-mono font-bold">{code}</span>
                </div>
                <div>
                  <p className="text-xs font-bold mb-0.5">{label}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Tech Stack ───────────────────────────────────────────────────────────────

function TechStackSection() {
  return (
    <section className="py-24 px-4 border-t bg-muted/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Technology</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Stack</h2>
        </div>
        <div className="flex flex-wrap gap-2.5 justify-center">
          {TECH_STACK.map(({ label, category }) => (
            <div key={label} className="flex items-center gap-2 border rounded-lg px-4 py-2 bg-background shadow-sm hover:shadow-md transition-shadow">
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold border-r pr-2">{category}</span>
              <span className="text-xs font-bold">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTASection({ onLogin }) {
  return (
    <section className="py-24 px-4 border-t">
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-foreground text-background font-bold shadow-lg mx-auto mb-6">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Ready to normalize your claims?</h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Log in as a TPA Officer to start processing hospital documents through the full AI pipeline.
        </p>
        <Button size="lg" onClick={onLogin} className="h-10 px-8 font-bold text-sm shadow-lg shadow-foreground/10">
          Access Platform <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

const FOOTER_COLS = [
  { title: 'Solutions', links: ['RCM Normalization', 'Denial Prevention', 'Prior Auth AI', 'FHIR API Gateway'] },
  { title: 'AI Tools', links: ['PDF to FHIR', 'Text to ICD-10', 'Text to CPT', 'Medical OCR', 'Anomaly Detection'] },
  { title: 'Interoperability', links: ['HL7 v2 to FHIR', 'CCDA Parsing', 'X12 EDI 837', 'SMART on FHIR'] },
  { title: 'Company', links: ['About Us', 'Hackathon 2026', 'Security (HIPAA)', 'Careers'] },
];

function Footer() {
  return (
    <footer className="border-t bg-card pt-16 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-foreground text-background font-bold shadow-sm">
                <FolderOpen className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-bold tracking-widest uppercase">Ctrl PluZ</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Healthcare interoperability. Fast, secure, and AI-native.
            </p>
          </div>
          {FOOTER_COLS.map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center text-muted-foreground text-xs gap-4">
          <p>© 2026 Ctrl PluZ — Jilo Team. Built for Hackathon 2026.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">HIPAA Notice</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const handleLogin = () => navigate('/login');

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar onLogin={handleLogin} />
      <Hero onLogin={handleLogin} />
      <PipelineSection />

      <FeaturesSection />
      <ValidationSection />
      <TechStackSection />
      <CTASection onLogin={handleLogin} />
      <Footer />
    </div>
  );
}
