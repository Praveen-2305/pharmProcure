import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RegulatoryAlert } from '../../api/types';
import { fetchAlerts, acknowledgeAlert } from '../../api/alerts';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Bell,
  AlertOctagon,
  Snowflake,
  TrendingDown,
  Check,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export const AlertsBellDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<RegulatoryAlert[]>([]);
  const [unackCount, setUnackCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAlerts();
    // Poll every 30 seconds for live monitoring
    const timer = setInterval(loadAlerts, 30000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadAlerts = async () => {
    try {
      const res = await fetchAlerts({ unacknowledgedOnly: true });
      setAlerts(res.alerts.slice(0, 5));
      setUnackCount(res.unacknowledgedCount);
    } catch (err) {
      console.warn('Failed to load bell alerts:', err);
    }
  };

  const handleAck = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await acknowledgeAlert(alertId);
      setAlerts((prev) => prev.filter((a) => a.alertId !== alertId));
      setUnackCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Ack failed:', err);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'COLD_CHAIN_EXCURSION':
        return <Snowflake className="size-3.5 text-sky-400 shrink-0" />;
      case 'PRICE_CEILING_REVISED':
        return <TrendingDown className="size-3.5 text-amber-400 shrink-0" />;
      default:
        return <AlertOctagon className="size-3.5 text-rose-400 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
        title="Regulatory & Cold-Chain Live Alerts"
        aria-label="Regulatory Alerts"
      >
        <Bell className="size-4.5" />
        {unackCount > 0 && (
          <span className="absolute top-1 right-1 size-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse shadow-sm">
            {unackCount > 9 ? '9+' : unackCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border/80 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in-50">
          <div className="p-3 bg-muted/40 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-primary" />
              <span className="font-bold text-xs text-foreground">Live Regulatory Alerts</span>
            </div>
            {unackCount > 0 ? (
              <Badge className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0">
                {unackCount} New
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/40">
                All Cleared
              </Badge>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-border/40 text-xs">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-xs">
                No unacknowledged alerts. Systems operating within statutory parameters.
              </div>
            ) : (
              alerts.map((a) => (
                <div
                  key={a.alertId}
                  className="p-3 hover:bg-muted/30 transition-colors space-y-1.5 cursor-pointer"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/alerts');
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {getAlertIcon(a.alertType)}
                      <span className="font-semibold text-foreground text-xs truncate max-w-[200px]">
                        {a.vendorName}
                      </span>
                    </div>
                    <Badge
                      className={`text-[9px] font-mono px-1 py-0 ${
                        a.severity === 'CRITICAL'
                          ? 'bg-rose-600 text-white'
                          : a.severity === 'HIGH'
                          ? 'bg-amber-600 text-white'
                          : 'bg-secondary text-foreground'
                      }`}
                    >
                      {a.severity}
                    </Badge>
                  </div>

                  <p className="text-[11px] text-foreground/90 font-medium line-clamp-2">
                    {a.headline}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {a.statuteReference.slice(0, 28)}...
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleAck(a.alertId, e)}
                      className="px-2 py-0.5 rounded text-[10px] bg-secondary hover:bg-emerald-600 hover:text-white transition-colors flex items-center gap-1 font-medium"
                      title="Mark as Acknowledged"
                    >
                      <Check className="size-2.5" />
                      <span>Ack</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 bg-muted/40 border-t border-border/50 text-center">
            <Link
              to="/alerts"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1.5"
            >
              <span>Open Alerts Center</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
