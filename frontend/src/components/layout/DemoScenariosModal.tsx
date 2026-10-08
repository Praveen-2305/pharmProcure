import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Calculator,
  Snowflake,
  Scale,
  FileCheck2,
  Sliders,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface DemoScenariosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ScenarioItem {
  id: string;
  number: string;
  title: string;
  regulation: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
  badgeVariant: 'default' | 'destructive' | 'secondary' | 'outline';
  targetPath: string;
}

const SCENARIOS: ScenarioItem[] = [
  {
    id: 'dpco',
    number: '01',
    title: 'DPCO Ceiling Overcharge Interception',
    regulation: 'NPPA / DPCO 2013 Order §4',
    description: 'Vendor quoted ₹2,790/vial for Trastuzumab against statutory ceiling ₹2,490/vial. System halts procurement and computes statutory savings.',
    icon: <Calculator className="size-4 text-emerald-400" />,
    badge: 'Statutory Ceiling',
    badgeVariant: 'destructive',
    targetPath: '/price-check',
  },
  {
    id: 'cold-chain',
    number: '02',
    title: 'Cold-Chain Excursion Interception',
    regulation: 'WHO TRS 1025 & CDSCO Good Distribution',
    description: 'Knowledge Graph cross-checks temperature logs during monsoon transit and flags undisclosed +14°C excursions before patient release.',
    icon: <Snowflake className="size-4 text-cyan-400" />,
    badge: 'WHO TRS 1025',
    badgeVariant: 'default',
    targetPath: '/alerts',
  },
  {
    id: 'radar',
    number: '03',
    title: '5-Pillar Multi-Vendor Radar RFP',
    regulation: 'Comparative Multi-Criteria Analysis',
    description: 'Benchmark Apex BioLogistics, Bharat Pharma, and MedVantage on an interactive 5-axis radar chart with live weight sensitivity sliders.',
    icon: <Scale className="size-4 text-amber-400" />,
    badge: '5-Pillar Radar',
    badgeVariant: 'secondary',
    targetPath: '/compare',
  },
  {
    id: 'contract',
    number: '04',
    title: 'AI Contract Clause Audit & Pack',
    regulation: 'Indian Contract Act & CDSCO Rules',
    description: 'Audit supplier agreement clauses against CDSCO recall indemnities and 60-day breach cure periods. Export pre-formatted redline packs.',
    icon: <FileCheck2 className="size-4 text-purple-400" />,
    badge: 'CDSCO Schedule M',
    badgeVariant: 'outline',
    targetPath: '/contract-analyzer',
  },
  {
    id: 'what-if',
    number: '05',
    title: 'What-If Deal Term Simulator',
    regulation: 'Dynamic Sensitivity Modeling',
    description: 'Adjust unit pricing, volume commitments, and warranty months to simulate 4D risk score changes in real time before signing.',
    icon: <Sliders className="size-4 text-blue-400" />,
    badge: 'Sensitivity Model',
    badgeVariant: 'secondary',
    targetPath: '/dashboard',
  },
];

export const DemoScenariosModal: React.FC<DemoScenariosModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLaunch = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-2xl text-left max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Close demo modal"
        >
          <X className="size-5" />
        </button>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/20 text-primary">
              <Sparkles className="size-4" />
            </span>
            <Badge variant="outline" className="font-mono text-xs">HackForge AI + Business Showcase</Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            AutonoSource Enterprise Demo Scenarios
          </h2>
          <p className="text-sm text-muted-foreground">
            Explore 5 real-world pharmaceutical procurement scenarios governed by Indian statutory mandates (DPCO 2013, CDSCO Schedule M, WHO TRS 1025).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {SCENARIOS.map((item) => (
            <div
              key={item.id}
              className="group p-4 rounded-xl border border-border/60 bg-background/40 hover:bg-accent/40 hover:border-primary/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-muted-foreground">{item.number}</span>
                    <span className="p-1 rounded-md bg-muted/60">{item.icon}</span>
                  </div>
                  <Badge variant={item.badgeVariant} className="text-[10px] font-mono">
                    {item.badge}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[11px] font-mono text-primary/80 mt-0.5">{item.regulation}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleLaunch(item.targetPath)}
                  className="gap-1.5 text-xs text-primary hover:text-primary group-hover:translate-x-0.5 transition-transform p-0 h-auto"
                >
                  <span>Launch Scenario</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
          <span>All pricing calculated in Indian Rupee (₹ INR) with DPCO ceilings.</span>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close Guide
          </Button>
        </div>
      </div>
    </div>
  );
};
