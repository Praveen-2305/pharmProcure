import React, { useState } from 'react';
import { SimulateEventRequest, RegulatoryAlert } from '../../api/types';
import { simulateRegulatoryEvent } from '../../api/alerts';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  X,
  Radio,
  Sparkles,
  AlertOctagon,
  Snowflake,
  TrendingDown,
  ShieldAlert,
} from 'lucide-react';

interface SimulateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventSimulated: (newAlert: RegulatoryAlert) => void;
}

const PRESETS = [
  {
    name: 'IoT Cold-Chain Excursion (16°C)',
    icon: Snowflake,
    color: 'text-sky-400',
    data: {
      alertType: 'COLD_CHAIN_EXCURSION',
      vendorName: 'Apex BioLogistics Pvt. Ltd.',
      severity: 'CRITICAL',
      headline: 'Transit IoT Alert: 16.1°C Temperature Excursion for 84 Minutes',
      description:
        'Continuous temperature sensor telemetry logged an unmonitored container temperature spike exceeding 8°C throughout expressway transit route.',
      statuteReference: 'WHO Technical Report Series No. 1025 (Annex 7) & CDSCO Good Distribution Practices',
      suggestedRemedy:
        'Trigger automatic consignment rejection; quarantine shipment at dock; debit freight damage penalties against vendor PO.',
    },
  },
  {
    name: 'CDSCO Nitrosamine Show-Cause',
    icon: AlertOctagon,
    color: 'text-rose-400',
    data: {
      alertType: 'CDSCO_NSQ_ALERT',
      vendorName: 'DeshPharma Bulk Trading Co.',
      severity: 'HIGH',
      headline: 'CDSCO Central Drug Inspector Notice: Class-II Impurity Recall',
      description:
        'Central laboratory test results confirm Nitrosamine impurity (NDMA) presence exceeding 96 ng/day permissible limit in active API batches.',
      statuteReference: 'Drugs and Cosmetics Act, 1940 Section 18(a)(i) & Rule 74',
      suggestedRemedy:
        'Hold all batch inventory; demand recall response within 48 hours; pause ongoing RFPs with vendor.',
    },
  },
  {
    name: 'NPPA Lowers Rituximab Ceiling',
    icon: TrendingDown,
    color: 'text-amber-400',
    data: {
      alertType: 'PRICE_CEILING_REVISED',
      vendorName: 'Bharat Biotherapeutics Labs',
      severity: 'MEDIUM',
      headline: 'NPPA Statutory Price Order: Rituximab Ceiling Lowered by 6.2%',
      description:
        'Gazette Notification S.O. 2091(E) issued reducing statutory ceiling unit price for Rituximab 500mg injection to ₹18,570.00 effective immediately.',
      statuteReference: 'DPCO 2013 Paragraph 11 & Essential Commodities Act 1955',
      suggestedRemedy:
        'Issue unilateral contract amendment aligning open purchase orders with newly notified ceiling rate.',
    },
  },
];

export const SimulateEventModal: React.FC<SimulateEventModalProps> = ({
  isOpen,
  onClose,
  onEventSimulated,
}) => {
  const [headline, setHeadline] = useState(PRESETS[0].data.headline);
  const [vendorName, setVendorName] = useState(PRESETS[0].data.vendorName);
  const [alertType, setAlertType] = useState(PRESETS[0].data.alertType);
  const [severity, setSeverity] = useState<any>(PRESETS[0].data.severity);
  const [description, setDescription] = useState(PRESETS[0].data.description);
  const [statuteReference, setStatuteReference] = useState(PRESETS[0].data.statuteReference);
  const [suggestedRemedy, setSuggestedRemedy] = useState(PRESETS[0].data.suggestedRemedy);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setHeadline(preset.data.headline);
    setVendorName(preset.data.vendorName);
    setAlertType(preset.data.alertType);
    setSeverity(preset.data.severity);
    setDescription(preset.data.description);
    setStatuteReference(preset.data.statuteReference);
    setSuggestedRemedy(preset.data.suggestedRemedy);
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: SimulateEventRequest = {
        headline,
        vendorName,
        alertType,
        severity,
        description,
        statuteReference,
        suggestedRemedy,
      };
      const res = await simulateRegulatoryEvent(payload);
      onEventSimulated(res);
      onClose();
    } catch (err) {
      console.error('Failed to simulate event:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Radio className="size-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Simulate Live Regulatory Event
              </h2>
              <p className="text-xs text-muted-foreground">
                Inject real-time CDSCO advisories, IoT cold-chain excursions, or NPPA ceiling revisions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSimulate} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px] block">
              Quick Judge Demo Presets:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PRESETS.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="p-2.5 rounded-lg bg-secondary/50 border border-border/60 text-left hover:border-primary/60 transition-all flex items-center gap-2"
                  >
                    <Icon className={`size-4 ${p.color} shrink-0`} />
                    <span className="text-[11px] font-medium text-foreground truncate">
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-foreground font-semibold block mb-1">Target Vendor Name</label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                required
                className="w-full bg-background border border-border/80 rounded-md p-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-foreground font-semibold block mb-1">Severity Level</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-background border border-border/80 rounded-md p-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="CRITICAL">CRITICAL (Immediate Dock Freeze)</option>
                <option value="HIGH">HIGH (Regulatory Investigation)</option>
                <option value="MEDIUM">MEDIUM (Commercial Addendum)</option>
                <option value="LOW">LOW (Informational Advisory)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-foreground font-semibold block mb-1">Alert Headline</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              required
              className="w-full bg-background border border-border/80 rounded-md p-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-foreground font-semibold block mb-1">Event Description & Telemetry</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-background border border-border/80 rounded-md p-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-foreground font-semibold block mb-1">Statute Reference Cited</label>
              <input
                type="text"
                value={statuteReference}
                onChange={(e) => setStatuteReference(e.target.value)}
                required
                className="w-full bg-background border border-border/80 rounded-md p-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-foreground font-semibold block mb-1">Suggested Remedial Directive</label>
              <input
                type="text"
                value={suggestedRemedy}
                onChange={(e) => setSuggestedRemedy(e.target.value)}
                required
                className="w-full bg-background border border-border/80 rounded-md p-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-border/60 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4"
            >
              {loading ? 'Injecting Telemetry...' : 'Inject Live Alert Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
