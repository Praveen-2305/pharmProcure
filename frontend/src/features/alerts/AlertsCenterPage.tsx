import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RegulatoryAlert } from '../../api/types';
import { fetchAlerts, acknowledgeAlert } from '../../api/alerts';
import { SimulateEventModal } from './SimulateEventModal';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Bell,
  Radio,
  AlertOctagon,
  Snowflake,
  TrendingDown,
  Check,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Building2,
  BookOpen,
} from 'lucide-react';

export const AlertsCenterPage: React.FC = () => {
  const [alerts, setAlerts] = useState<RegulatoryAlert[]>([]);
  const [unackCount, setUnackCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNACK' | 'CRITICAL'>('ALL');
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetchAlerts({
        unacknowledgedOnly: filter === 'UNACK' ? true : undefined,
        severity: filter === 'CRITICAL' ? 'CRITICAL' : undefined,
      });
      setAlerts(res.alerts);
      setUnackCount(res.unacknowledgedCount);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAck = async (alertId: string) => {
    try {
      const updated = await acknowledgeAlert(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.alertId === alertId ? { ...a, isAcknowledged: true } : a))
      );
      setUnackCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleEventSimulated = (newAlert: RegulatoryAlert) => {
    setAlerts((prev) => [newAlert, ...prev]);
    setUnackCount((prev) => prev + 1);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'COLD_CHAIN_EXCURSION':
        return <Snowflake className="size-4 text-sky-400 shrink-0" />;
      case 'PRICE_CEILING_REVISED':
        return <TrendingDown className="size-4 text-amber-400 shrink-0" />;
      default:
        return <AlertOctagon className="size-4 text-rose-400 shrink-0" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return (
          <Badge className="bg-rose-600 text-white font-bold text-xs uppercase animate-pulse">
            CRITICAL SEVERITY
          </Badge>
        );
      case 'HIGH':
        return (
          <Badge className="bg-amber-600 text-white font-bold text-xs uppercase">
            HIGH SEVERITY
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge className="bg-yellow-600 text-white font-semibold text-xs uppercase">
            MEDIUM SEVERITY
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs uppercase">
            LOW SEVERITY
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary/40 font-mono text-xs">
              Feature 8 • Live Regulatory Monitoring
            </Badge>
            <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-xs flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Real-Time Ingestion</span>
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mt-1">
            Regulatory Alerts & Cold-Chain Telemetry Center
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Continuous surveillance stream integrating CDSCO drug alerts, NPPA DPCO price ceiling changes, IoT transit temperature loggers, and tender debarments.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsSimulateOpen(true)}
            className="text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-md"
          >
            <Radio className="size-3.5 animate-pulse" />
            <span>Simulate Live Event (Demo)</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAlerts()}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-border/80 bg-card/60 shadow-sm">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase">Total Alert Events</span>
            <div className="text-2xl font-bold text-foreground">{alerts.length} Logged</div>
            <span className="text-[10px] text-muted-foreground block font-medium">Master Event Log</span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card/60 shadow-sm">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase">Unacknowledged</span>
            <div className={`text-2xl font-bold ${unackCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {unackCount} Action Required
            </div>
            <span className="text-[10px] text-muted-foreground block font-medium">Pending Human Review</span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card/60 shadow-sm">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase">Critical Severity</span>
            <div className="text-2xl font-bold text-rose-400">
              {alerts.filter((a) => a.severity === 'CRITICAL').length} High Impact
            </div>
            <span className="text-[10px] text-rose-400/80 block font-medium">Immediate dock freeze</span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card/60 shadow-sm">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase">Active Telemetry</span>
            <div className="text-2xl font-bold text-emerald-400">Online</div>
            <span className="text-[10px] text-muted-foreground block font-medium">IoT & Scraping Feed</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border/50 pb-2 text-xs">
        <span className="text-muted-foreground font-medium mr-1">Filter Alerts:</span>
        <Button
          variant={filter === 'ALL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('ALL')}
          className="h-7 text-xs"
        >
          All Alerts ({alerts.length})
        </Button>
        <Button
          variant={filter === 'UNACK' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('UNACK')}
          className={`h-7 text-xs ${filter === 'UNACK' ? 'bg-rose-600 hover:bg-rose-700' : ''}`}
        >
          Unacknowledged ({unackCount})
        </Button>
        <Button
          variant={filter === 'CRITICAL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('CRITICAL')}
          className={`h-7 text-xs ${filter === 'CRITICAL' ? 'bg-rose-700 hover:bg-rose-800' : ''}`}
        >
          Critical Only
        </Button>
      </div>

      {/* Alerts Stream List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Synchronizing live alert feed...
        </div>
      ) : alerts.length === 0 ? (
        <Card className="p-8 text-center text-xs text-muted-foreground">
          No alerts match the selected criteria.
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card
              key={alert.alertId}
              className={`border transition-all duration-200 ${
                alert.isAcknowledged
                  ? 'border-border/60 bg-card/40 opacity-80'
                  : alert.severity === 'CRITICAL'
                  ? 'border-rose-500/50 bg-rose-950/20 shadow-md'
                  : 'border-border/80 bg-card/70 shadow-sm'
              }`}
            >
              <CardContent className="p-5 space-y-4">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    {getAlertIcon(alert.alertType)}
                    <div>
                      <span className="font-mono text-xs text-muted-foreground mr-2">
                        [{alert.alertId}]
                      </span>
                      <span className="font-bold text-sm text-foreground">
                        {alert.headline}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {getSeverityBadge(alert.severity)}
                    {alert.isAcknowledged ? (
                      <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/40">
                        <Check className="size-3 mr-1" /> Acknowledged
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAck(alert.alertId)}
                        className="h-7 text-xs px-3 bg-secondary hover:bg-emerald-600 hover:text-white transition-colors"
                      >
                        <Check className="size-3 mr-1" />
                        <span>Acknowledge</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Description & Impacted Vendor */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-medium">
                    <Building2 className="size-3.5 text-primary" />
                    <span className="text-muted-foreground">Impacted Counterparty: </span>
                    <span className="font-bold text-foreground">{alert.vendorName}</span>
                    {alert.vendorId && (
                      <Link
                        to={`/vendors/${alert.vendorId}`}
                        className="text-[10px] font-mono text-primary hover:underline ml-1"
                      >
                        (View 360° Profile)
                      </Link>
                    )}
                  </div>

                  <p className="text-foreground/90 leading-relaxed font-sans text-xs bg-background/50 p-3 rounded border border-border/50">
                    {alert.description}
                  </p>
                </div>

                {/* Statute Cited & Remedial Action */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-2.5 rounded bg-secondary/40 border border-border/40 space-y-1">
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono uppercase">
                      <BookOpen className="size-3 text-primary" />
                      <span>Statute / Protocol Citation</span>
                    </div>
                    <p className="font-semibold text-foreground text-xs">{alert.statuteReference}</p>
                  </div>

                  <div className="p-2.5 rounded bg-secondary/40 border border-border/40 space-y-1">
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono uppercase">
                      <ShieldAlert className="size-3 text-amber-400" />
                      <span>Automated Remedial Directive</span>
                    </div>
                    <p className="text-foreground text-xs leading-relaxed">{alert.suggestedRemedy}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Live Event Simulator Modal */}
      <SimulateEventModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        onEventSimulated={handleEventSimulated}
      />
    </div>
  );
};
export default AlertsCenterPage;
