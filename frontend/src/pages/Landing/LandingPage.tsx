import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Bot, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  Scale, 
  DollarSign, 
  CheckCircle2, 
  TrendingUp, 
  PlusCircle, 
  LayoutDashboard, 
  Clock, 
  Building2, 
  ChevronRight,
  Sliders,
  FileSearch,
  Lock
} from 'lucide-react';
import { Button, buttonVariants } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ModeToggle } from '../../components/mode-toggle';
import { cn } from '../../lib/utils';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeAgentTab, setActiveAgentTab] = useState<'legal' | 'pricing' | 'security' | 'orchestrator'>('legal');
  const [activeDemoStep, setActiveDemoStep] = useState<number>(0);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  useEffect(() => {
    document.title = "AutonoSource | Home";
  }, []);

  const handleLaunchDashboard = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };

  const vendors = [
    { name: 'BioGen Diagnostics', category: 'Reagents & Assays' },
    { name: 'MediSupply Global', category: 'Medical Equipment' },
    { name: 'PhytoChem Research', category: 'Lab Consumables' },
    { name: 'NanoPharma Corp', category: 'Automation Systems' },
    { name: 'Apex BioLogistics', category: 'Cold-Chain Transport' },
    { name: 'Astra Biotics', category: 'Clinical Trial Supplies' },
    { name: 'Vantage Genomics', category: 'DNA Sequencing' },
  ];

  const agentModules = {
    legal: {
      title: 'Legal & Contract Audit Agent',
      shortTitle: 'Legal Audit Agent',
      icon: Scale,
      badge: 'RAG Contract Parser',
      description: 'Scans Master Service Agreements and NDAs to detect liability caps, indemnification loopholes, and non-standard termination clauses against enterprise playbooks.',
      metrics: '100% Clause Coverage',
      targetSla: '350ms RAG Latency',
      color: 'border-primary/30 bg-primary/5 text-primary',
      capabilities: [
        'Automated Playbook §4.1 Un-capped Liability Audit',
        'Multi-language NDA & SLA Clause Parsing',
        'Sub-second Risk Weight Calculation & Exception Flags',
      ],
      outputSample: '[VERIFIED]: Clause 14.2 contains un-capped liability wording. Risk Weight: 0.42 (Requires Approval)',
    },
    pricing: {
      title: 'Category Pricing & Benchmark Agent',
      shortTitle: 'Pricing Benchmark Agent',
      icon: DollarSign,
      badge: 'ERP Line-Item Auditor',
      description: 'Cross-checks line-item quotes against historical ERP purchasing data and market benchmarks to flag price gouging or category ceiling violations.',
      metrics: '14.2% Cost Reduction',
      targetSla: '220ms SAP Sync',
      color: 'border-primary/30 bg-primary/5 text-primary',
      capabilities: [
        'Line-Item Comparison against SAP S/4HANA Purchase Orders',
        'Category Ceiling Overage Detection & Margin Analysis',
        'Dynamic Discount Benchmark Verification',
      ],
      outputSample: '[ALERT]: Rate $1,250/hr exceeds approved ceiling ($875/hr) by +38%. Savings Potential: $187,500',
    },
    security: {
      title: 'Compliance & Cyber Risk Agent',
      shortTitle: 'Compliance Risk Agent',
      icon: Lock,
      badge: 'Security Validator',
      description: 'Verifies SOC2 Type II, HIPAA, and ISO 27001 certifications. Analyzes vendor financial solvency and geopolitical supply-chain risks in real time.',
      metrics: 'Zero Security Breaches',
      targetSla: '180ms Cert Hash Check',
      color: 'border-primary/30 bg-primary/5 text-primary',
      capabilities: [
        'Automated SOC2 Type II SHA-256 Cryptographic Verification',
        'Sanctions & Financial Solvency Real-time Screening',
        'Geopolitical Supply-Chain Dependency Risk Scoring',
      ],
      outputSample: '[PASS]: SOC2 Type II verified valid through Dec 2026. Zero active vulnerability breaches detected.',
    },
    orchestrator: {
      title: 'Autonomous Agent Orchestrator',
      shortTitle: 'Consensus Orchestrator',
      icon: Bot,
      badge: 'LangGraph Consensus Engine',
      description: 'Synthesizes multi-agent evidence trails into a unified confidence score and generates executive determination recommendations for human sign-off.',
      metrics: '< 12s Resolution Speed',
      targetSla: '99.4% Precision Score',
      color: 'border-primary/30 bg-primary/5 text-primary',
      capabilities: [
        'Stateful Multi-Agent Voting Consensus & Synthesis',
        'Cryptographic Confidence Score Generation (0.0 - 1.0)',
        'Automated Escalation Routing to Executive Queue',
      ],
      outputSample: '[CONSENSUS]: Final Score 0.88. Status: REQUIRES_EXECUTIVE_APPROVAL (Routed to Queue)',
    },
  };

  const demoSteps = [
    {
      title: 'Case Ingestion & Parsing',
      subtitle: 'Payload Extraction & Vector Chunking',
      detail: 'User submits $1.45M NanoPharma Automation procurement package containing Master Service Agreement PDF, line-item pricing schedule, and SOC2 audit documents.',
      logs: [
        '[14:40:02.102] INGEST: Received Procurement Case PROC-2026-0891 (Vendor: NanoPharma Corp)',
        '[14:40:02.340] PARSER: Extracted 24 page MSA contract text using PyMuPDF layout-aware extractor',
        '[14:40:02.580] VECTOR: Generated 128 dense vector embeddings & stored in Qdrant collection',
        '[14:40:02.890] EVENT: Dispatched parallel audit triggers to Legal, Pricing, and Security agents',
      ],
      metrics: { confidence: '99.8%', speed: '780ms', status: 'Ingestion Verified' },
      codeSnippet: `{\n  "case_id": "PROC-2026-0891",\n  "vendor": "NanoPharma Automation",\n  "amount_usd": 1450000,\n  "documents": ["msa_v4.pdf", "pricing_2026.xlsx", "soc2_type2.pdf"]\n}`,
    },
    {
      title: 'Multi-Agent Investigation',
      subtitle: 'Parallel Sub-Task Audit Stream',
      detail: 'Legal, Pricing, and Security agents independently execute 14 parallel compliance sub-tasks against historical ERP purchasing records and governance playbooks.',
      logs: [
        '[14:40:03.110] LEGAL_AGENT: Executing MSA Clause Audit (Checking Liability & Indemnification)',
        '[14:40:03.450] PRICING_AGENT: Matching 1,200 line items against SAP S/4HANA historical database',
        '[14:40:03.790] SECURITY_AGENT: Validating SOC2 Type II report SHA-256 hash & expiry date',
        '[14:40:04.120] RAG_ENGINE: Retrieved 4 matching playbook precedents from Qdrant vector index',
      ],
      metrics: { confidence: '96.4%', speed: '1.2s', status: 'Sub-Tasks Active' },
      codeSnippet: `{\n  "legal_status": "ANALYZING_CLAUSES",\n  "pricing_status": "MATCHING_ERP_BENCHMARKS",\n  "security_status": "VERIFYING_SOC2_CERT"\n}`,
    },
    {
      title: 'Contradiction Detection',
      subtitle: 'Policy Violation Flagging',
      detail: 'Pricing Agent flags unit cost 38% above 2025 category ceiling ($1,208/hr vs $875/hr cap). Legal Agent flags un-capped liability clause in Section 14.2.',
      logs: [
        '[14:40:04.500] FLAG [PRICING]: Unit cost $1,208/hr exceeds 2025 category ceiling ($875/hr) by +38%',
        '[14:40:04.810] FLAG [LEGAL]: Clause 14.2 contains un-capped liability wording (Breach of Playbook §4.1)',
        '[14:40:05.150] PASS [SECURITY]: SOC2 Type II verified valid through Dec 2026 (Zero breaches)',
        '[14:40:05.420] CONTRADICTION: Total risk weight calculated at 0.42 (Requires Human Sign-off)',
      ],
      metrics: { confidence: '88.0%', speed: '940ms', status: 'Anomalies Flagged' },
      codeSnippet: `{\n  "anomalies": [\n    { "type": "PRICING_OVERAGE", "delta": "+38%", "threshold": "$875/hr" },\n    { "type": "UNLIMITED_LIABILITY", "clause": "14.2", "policy": "VIOLATION" }\n  ]\n}`,
    },
    {
      title: 'Executive Adjudication',
      subtitle: 'LangGraph Consensus Synthesis',
      detail: 'LangGraph Consensus Engine aggregates multi-agent votes, synthesizes auditable JSON decision rationale, and routes case to Executive Approval Queue.',
      logs: [
        '[14:40:05.800] CONSENSUS: LangGraph aggregated agent votes (Legal: REJECT, Pricing: REJECT, Security: APPROVE)',
        '[14:40:06.110] SCORE: Final Robust Confidence Score calculated at 88.0% (Flagged for Review)',
        '[14:40:06.450] ROUTE: Pushed PROC-2026-0891 to Executive Approval Queue',
        '[14:40:06.820] AUDIT_LEDGER: Immutable decision record written to LangGraph state store',
      ],
      metrics: { confidence: '88.0%', speed: '620ms', status: 'Routed to Queue' },
      codeSnippet: `{\n  "decision": "REQUIRES_EXECUTIVE_APPROVAL",\n  "confidence_score": 0.88,\n  "recommended_action": "REQUEST_PRICE_REDUCTION_AND_LIABILITY_CAP"\n}`,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground relative overflow-x-hidden">
      {/* Top Primary Accent Navigation Glow Bar */}
      {isNavigating && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed top-0 left-0 right-0 h-1 bg-primary z-[100] origin-left shadow-[0_0_15px_hsl(var(--primary))]"
        />
      )}

      {/* Main Page Motion Container (500ms Smooth Apple Fade-Lift) */}
      <motion.div
        animate={
          isNavigating
            ? { opacity: 0, y: -24, scale: 0.97 }
            : { opacity: 1, y: 0, scale: 1 }
        }
        transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col min-h-screen w-full flex-1"
      >
        {/* Figma Dot Grid Background Overlay (Behind Section 1 Hero, Page Background Level) */}
        <div className="absolute top-0 left-0 right-0 h-[650px] bg-dot-pattern radial-mask pointer-events-none opacity-65 z-0" />

        {/* Top Banner Navigation */}
        <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-xs">
              A
            </div>
            <div>
              <span className="font-bold tracking-tight text-base text-foreground">AutonoSource</span>
              <span className="text-[11px] text-muted-foreground block -mt-1 font-mono">Enterprise AI Procurement</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/queue')} className="hidden sm:inline-flex gap-1.5 text-xs">
              <Clock className="size-3.5" />
              Approval Queue
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/submit')} className="hidden sm:inline-flex gap-1.5 text-xs">
              <PlusCircle className="size-3.5" />
              Submit Request
            </Button>
            <Button variant="default" size="sm" onClick={handleLaunchDashboard} className="gap-1.5 text-xs font-semibold shadow-xs">
              <LayoutDashboard className="size-3.5" />
              Launch Platform
              <ArrowRight className="size-3.5" />
            </Button>
            <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
            <ModeToggle />
          </div>
        </header>

        {/* Top Glassmorphic Hero Card Section */}
        <section className="pt-8 pb-12 px-6 md:px-12 max-w-6xl mx-auto w-full relative z-10">
          <div className="relative rounded-3xl border border-border/80 bg-card/80 backdrop-blur-xl shadow-xl p-8 md:p-16 text-center overflow-hidden space-y-8">
            {/* Subtle Ambient Glow Mesh Blobs */}
            <div className="absolute -top-32 -left-32 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

            {/* Hero Title & Description */}
            <div className="space-y-4 max-w-4xl mx-auto relative z-10">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                Procure at Lightspeed with <br />
                <span className="bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
                  Autonomous AI Agent Audits
                </span>
              </h1>
              <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
                Eliminate procurement bottlenecks. AutonoSource deploys multi-agent AI networks to audit legal contracts, verify pricing ceilings, and enforce compliance in under 12 seconds.
              </p>
            </div>

            {/* Hero Redirection CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10 pt-2">
              <Button 
                size="lg" 
                onClick={handleLaunchDashboard} 
                className="w-full sm:w-auto h-12 px-8 gap-2.5 text-sm font-semibold rounded-xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <LayoutDashboard className="size-4" />
                Launch Executive Dashboard
                <ArrowRight className="size-4" />
              </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => navigate('/submit')} 
              className="w-full sm:w-auto h-12 px-7 gap-2.5 text-sm font-semibold rounded-xl border-border/80 hover:bg-muted/50 hover:-translate-y-0.5 transition-all duration-200"
            >
              <PlusCircle className="size-4 text-primary" />
              Submit New Vendor Request
            </Button>
          </div>

          {/* Quick Stat Pill */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground relative z-10 border-t border-border/40 max-w-2xl mx-auto">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-primary" /> SOC2 Type II Certified
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-primary" /> Full Audit Trail
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-primary" /> LangGraph Architecture
            </span>
          </div>
        </div>
      </section>

      {/* Infinite Vendor Marquee Section */}
      <section className="py-8 border-y bg-muted/20 overflow-hidden relative">
        <div className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Trusted for High-Stakes Procurement Across Life Sciences & Enterprise
        </div>
        <div className="relative w-full overflow-hidden">
          <div className="animate-marquee flex gap-12 items-center whitespace-nowrap">
            {vendors.concat(vendors).map((v, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/40 bg-background/60 text-xs font-medium shadow-2xs">
                <Building2 className="size-3.5 text-muted-foreground" />
                <span className="font-semibold text-foreground">{v.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">({v.category})</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Agent Architecture Interactive Showcase (Apple-Grade Component Design) */}
      <section className="py-20 px-6 md:px-12 max-w-6xl mx-auto space-y-12 w-full">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            Multi-Agent Audit Network
          </h2>
          <p className="text-sm text-muted-foreground">
            Each vendor proposal is simultaneously evaluated by autonomous domain-expert agents.
          </p>
        </div>

        {/* Apple-Style Segmented Agent Navigation Bar */}
        <div className="p-1.5 rounded-2xl bg-muted/40 border border-border/60 grid grid-cols-2 md:grid-cols-4 gap-2 max-w-4xl mx-auto shadow-2xs relative">
          {(Object.keys(agentModules) as Array<keyof typeof agentModules>).map((key) => {
            const mod = agentModules[key];
            const IconComp = mod.icon;
            const isActive = activeAgentTab === key;
            return (
              <motion.button
                key={key}
                onClick={() => setActiveAgentTab(key)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'px-4 py-3.5 rounded-xl text-left transition-colors flex flex-col justify-between gap-1.5 relative select-none cursor-pointer border',
                  isActive
                    ? 'text-foreground font-semibold border-border/80'
                    : 'text-muted-foreground hover:text-foreground border-transparent font-medium'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeAgentTabIndicator"
                    className="absolute inset-0 bg-card rounded-xl shadow-sm border border-border/80 z-0"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <div className="flex items-center justify-between relative z-10">
                  <IconComp className={cn('size-4 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  {isActive && (
                    <span className="size-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <div className="relative z-10">
                  <div className="text-xs font-bold tracking-tight text-foreground">
                    {mod.shortTitle}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono truncate">
                    {mod.badge}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Active Agent Showcase Card (Full Height & Apple-Grade Craftsmanship) */}
        <div className="max-w-4xl mx-auto min-h-[380px]">
          <AnimatePresence mode="wait">
            {(() => {
              const mod = agentModules[activeAgentTab];
              const IconComp = mod.icon;
              return (
                <motion.div
                  key={activeAgentTab}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -4, scale: 1.005 }}
                  className="cursor-pointer"
                >
                  <Card className="p-8 md:p-10 border-border/80 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden bg-card/85 backdrop-blur-2xl min-h-[380px] flex flex-col justify-between rounded-3xl">
                    {/* Subtle Ambient Radial Glow Blob */}
                    <div className="absolute -bottom-24 -right-24 size-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/60 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className={cn('p-3 rounded-2xl border shadow-xs', mod.color)}>
                          <IconComp className="size-6" />
                        </div>
                        <div>
                          <h3 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">{mod.title}</h3>
                          <p className="text-xs font-mono text-muted-foreground mt-0.5">{mod.badge}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-3 py-1 font-mono text-xs border-border/80">
                          SLA: {mod.targetSla}
                        </Badge>
                        <Badge variant="default" className="px-3 py-1 font-mono text-xs">
                          {mod.metrics}
                        </Badge>
                      </div>
                    </div>

                    {/* Content Grid: Left Description + Capabilities, Right Evidence Preview */}
                    <div className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10 flex-1">
                      {/* Left Column: Narrative & Checkpoint List */}
                      <div className="md:col-span-7 space-y-5 flex flex-col justify-between">
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                          {mod.description}
                        </p>
                        <div className="space-y-2.5 pt-2">
                          {mod.capabilities.map((cap, cIdx) => (
                            <div key={cIdx} className="flex items-center gap-2.5 text-xs text-foreground font-medium">
                              <CheckCircle2 className="size-4 text-primary shrink-0" />
                              <span>{cap}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right Column: Live Output Evidence Box */}
                      <div className="md:col-span-5 space-y-3 flex flex-col justify-between bg-muted/30 border border-border/60 p-5 rounded-2xl">
                        <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b border-border/40 pb-2">
                          <span>AGENT FINDING OUTPUT</span>
                          <span className="text-primary font-bold">REAL-TIME</span>
                        </div>
                        <div className="font-mono text-xs text-foreground/90 leading-relaxed p-3 rounded-xl bg-background/60 border border-border/40 flex-1 flex items-center">
                          {mod.outputSample}
                        </div>
                        <div className="pt-2 flex items-center justify-between text-xs font-mono">
                          <span className="text-muted-foreground">Status: Autonomous</span>
                          <span className="flex items-center gap-1.5 text-foreground font-semibold text-xs bg-background px-2.5 py-1 rounded-lg border border-border/60">
                            <span className="size-2 rounded-full bg-primary animate-pulse" />
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      </section>

      {/* Interactive Case Execution Simulator (Full-Height Diagnostic Terminal) */}
      <section className="py-20 px-6 md:px-12 bg-muted/20 border-y w-full">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
              Interactive Case Execution Simulator
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Inspect how AutonoSource ingests, audits, and flags a $1.45M NanoPharma procurement request in real time.
            </p>
          </div>

          {/* 4 Step Selector Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {demoSteps.map((step, idx) => {
              const isActive = activeDemoStep === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveDemoStep(idx)}
                  className={cn(
                    'p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-3 cursor-pointer select-none',
                    isActive
                      ? 'border-primary bg-card ring-2 ring-primary/10 shadow-md font-semibold'
                      : 'border-border/60 bg-card/60 hover:bg-card hover:border-border'
                  )}
                >
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span className="px-2 py-0.5 rounded bg-muted/60 text-[10px]">STEP 0{idx + 1}</span>
                    {isActive && <span className="size-2 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{step.title}</div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">{step.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Full-Height Diagnostic Console Box */}
          <Card className="p-6 md:p-10 border-border/80 bg-card shadow-lg space-y-8 rounded-3xl relative overflow-hidden min-h-[420px]">
            {/* Terminal Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="size-3 rounded-full bg-red-500/80" />
                  <span className="size-3 rounded-full bg-amber-500/80" />
                  <span className="size-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono font-bold text-foreground pl-2 border-l border-border/60">
                  AUTONOSOURCE_DIAGNOSTIC_CONSOLE // PROC-2026-0891
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Badge variant="outline" className="font-mono text-xs border-border/80">
                  Speed: {demoSteps[activeDemoStep].metrics.speed}
                </Badge>
                <Badge variant="default" className="font-mono text-xs">
                  Confidence: {demoSteps[activeDemoStep].metrics.confidence}
                </Badge>
              </div>
            </div>

            {/* Diagnostic Content Grid (2 Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Case Rationale & Live Log Stream */}
              <div className="lg:col-span-7 space-y-5 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-xs font-mono text-primary uppercase tracking-wider font-semibold">
                    {demoSteps[activeDemoStep].subtitle}
                  </span>
                  <h3 className="text-xl font-bold text-foreground">
                    {demoSteps[activeDemoStep].title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {demoSteps[activeDemoStep].detail}
                  </p>
                </div>

                {/* Log Terminal Window */}
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 font-mono text-xs space-y-2 text-foreground/90">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-1 flex justify-between">
                    <span>LIVE EXECUTION STREAM</span>
                    <span>LOG LEVEL: VERBOSE</span>
                  </div>
                  {demoSteps[activeDemoStep].logs.map((log, lIdx) => (
                    <div key={lIdx} className="leading-relaxed flex items-start gap-2">
                      <span className="text-primary font-bold">›</span>
                      <span className="text-foreground/80">{log}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Structured JSON Decision Payload */}
              <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>STATE PAYLOAD PREVIEW</span>
                  <span className="text-primary font-bold">JSON v2</span>
                </div>
                <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 font-mono text-xs leading-relaxed text-foreground flex-1 overflow-x-auto">
                  <pre className="text-foreground/90">{demoSteps[activeDemoStep].codeSnippet}</pre>
                </div>
                <div className="pt-2 flex justify-end">
                  <Button size="sm" onClick={() => navigate('/review/PROC-2026-0891')} className="gap-2 text-xs font-semibold rounded-xl w-full sm:w-auto">
                    Inspect Real Case File <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Enterprise Integration Ecosystem Section */}
      <section className="py-20 px-6 md:px-12 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            Seamless Enterprise Stack Connectivity
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Connects out of the box with your existing ERPs, vector databases, and communication channels.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 space-y-3 border-border/80 bg-card/90 shadow-2xs hover:border-primary/40 transition-colors">
            <div className="text-xs font-mono text-primary font-semibold uppercase">ERP Sync</div>
            <h3 className="text-base font-bold text-foreground">SAP S/4HANA & Oracle</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bi-directional purchase order synchronization and automated vendor master lookup.
            </p>
          </Card>

          <Card className="p-6 space-y-3 border-border/80 bg-card/90 shadow-2xs hover:border-primary/40 transition-colors">
            <div className="text-xs font-mono text-primary font-semibold uppercase">Vector Store</div>
            <h3 className="text-base font-bold text-foreground">Qdrant Vector Engine</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sub-millisecond semantic retrieval across millions of historical contract embeddings.
            </p>
          </Card>

          <Card className="p-6 space-y-3 border-border/80 bg-card/90 shadow-2xs hover:border-primary/40 transition-colors">
            <div className="text-xs font-mono text-primary font-semibold uppercase">Agent Graph</div>
            <h3 className="text-base font-bold text-foreground">LangGraph Stateful Core</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Stateful multi-agent execution graphs with full step replayability and checkpointing.
            </p>
          </Card>

          <Card className="p-6 space-y-3 border-border/80 bg-card/90 shadow-2xs hover:border-primary/40 transition-colors">
            <div className="text-xs font-mono text-primary font-semibold uppercase">Compliance</div>
            <h3 className="text-base font-bold text-foreground">SOC2 Type II Ledger</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Immutable audit trails generated for every automated approval and human override.
            </p>
          </Card>
        </div>
      </section>

      {/* Bento Metric Cards */}
      <section className="py-16 px-6 md:px-12 max-w-6xl mx-auto w-full space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            Enterprise Governance Impact
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Quantifiable results delivered across autonomous multi-agent procurement audits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <motion.div whileHover={{ y: -4, scale: 1.01 }} transition={{ duration: 0.2 }}>
            <Card className="p-6 space-y-3 border-border/80 hover:border-primary/40 transition-colors shadow-2xs relative overflow-hidden bg-card/90">
              <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <TrendingUp className="size-5 text-primary" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-foreground tracking-tight">$14.2M+</div>
                <div className="text-xs font-semibold text-muted-foreground mt-1">Governed Procurement Ceiling</div>
              </div>
              <div className="text-[11px] text-muted-foreground/80 pt-1 border-t border-border/40 font-mono">
                100% Contract Compliance
              </div>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4, scale: 1.01 }} transition={{ duration: 0.2 }}>
            <Card className="p-6 space-y-3 border-border/80 hover:border-primary/40 transition-colors shadow-2xs relative overflow-hidden bg-card/90">
              <div className="size-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                <Zap className="size-5 text-sky-500" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-foreground tracking-tight">&lt; 12s</div>
                <div className="text-xs font-semibold text-muted-foreground mt-1">Multi-Agent Resolution Speed</div>
              </div>
              <div className="text-[11px] text-muted-foreground/80 pt-1 border-t border-border/40 font-mono">
                Parallel Sub-Task Audit
              </div>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4, scale: 1.01 }} transition={{ duration: 0.2 }}>
            <Card className="p-6 space-y-3 border-border/80 hover:border-primary/40 transition-colors shadow-2xs relative overflow-hidden bg-card/90">
              <div className="size-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <ShieldCheck className="size-5 text-purple-500" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-foreground tracking-tight">99.4%</div>
                <div className="text-xs font-semibold text-muted-foreground mt-1">Risk Detection Precision</div>
              </div>
              <div className="text-[11px] text-muted-foreground/80 pt-1 border-t border-border/40 font-mono">
                Hybrid Vector RAG Verification
              </div>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4, scale: 1.01 }} transition={{ duration: 0.2 }}>
            <Card className="p-6 space-y-3 border-border/80 hover:border-primary/40 transition-colors shadow-2xs relative overflow-hidden bg-card/90">
              <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <FileSearch className="size-5 text-amber-500" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-foreground tracking-tight">100%</div>
                <div className="text-xs font-semibold text-muted-foreground mt-1">Verifiable Audit Records</div>
              </div>
              <div className="text-[11px] text-muted-foreground/80 pt-1 border-t border-border/40 font-mono">
                LangGraph Consensus Proofs
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Multi-Agent Architecture Technical Cards */}
      <section className="py-12 px-6 md:px-12 max-w-6xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            How AutonoSource Governs Vendor Requests
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4 border-border/80 bg-card/90 shadow-2xs">
            <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-xs font-mono font-bold text-foreground">
              01
            </div>
            <h3 className="text-base font-bold text-foreground">Hybrid Vector RAG Engine</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Parses vendor quotes, NDAs, and SLAs using layout-aware PyMuPDF text extractors, matching evidence against Qdrant vector databases in milliseconds.
            </p>
          </Card>

          <Card className="p-6 space-y-4 border-border/80 bg-card/90 shadow-2xs">
            <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-xs font-mono font-bold text-foreground">
              02
            </div>
            <h3 className="text-base font-bold text-foreground">Multi-Agent Voting Network</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Legal, Pricing, and Security agents execute parallel sub-tasks to verify contract indemnifications, pricing ceilings, and SOC2 compliance.
            </p>
          </Card>

          <Card className="p-6 space-y-4 border-border/80 bg-card/90 shadow-2xs">
            <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-xs font-mono font-bold text-foreground">
              03
            </div>
            <h3 className="text-base font-bold text-foreground">LangGraph Audit Ledger</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Synthesizes multi-agent evidence into a cryptographic confidence score, presenting complete determination trails for executive authorization.
            </p>
          </Card>
        </div>
      </section>

      {/* Bottom CTA Banner (Glassmorphism + Premium Styling) */}
      <section className="py-20 px-6 md:px-12 max-w-6xl mx-auto w-full mt-auto">
        <div className="relative rounded-3xl border border-border/80 bg-card/80 backdrop-blur-xl shadow-xl p-8 md:p-14 text-center overflow-hidden space-y-8">
          {/* Subtle Ambient Glow Mesh */}
          <div className="absolute -top-32 -left-32 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="space-y-4 max-w-3xl mx-auto relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Ready to Automate Enterprise Procurement?
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Experience the power of autonomous AI agent audits today. Launch the executive platform or review pending vendor authorizations in real time.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10 pt-2">
            <Button 
              size="lg" 
              onClick={handleLaunchDashboard} 
              className="w-full sm:w-auto h-12 px-8 gap-2.5 text-sm font-semibold rounded-xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <LayoutDashboard className="size-4" />
              Launch Executive Dashboard
              <ArrowRight className="size-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => navigate('/queue')} 
              className="w-full sm:w-auto h-12 px-7 gap-2.5 text-sm font-semibold rounded-xl border-border/80 hover:bg-muted/50 hover:-translate-y-0.5 transition-all duration-200"
            >
              <Clock className="size-4 text-primary" />
              Review Pending Approvals (1)
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 px-6 text-center text-xs text-muted-foreground bg-background">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="size-2 rounded-full bg-primary" />
            AutonoSource Multi-Agent Orchestrator v2.4
          </div>
          <div>
            © 2026 AutonoSource Inc. Enterprise AI Governance.
          </div>
        </div>
      </footer>
      </motion.div>
    </div>
  );
};
