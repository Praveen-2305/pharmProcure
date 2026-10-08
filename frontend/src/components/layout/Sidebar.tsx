import React, { useEffect, useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  PlusCircle,
  ClipboardCheck,
  Calculator,
  Workflow,
  RotateCw,
  Clock,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from 'lucide-react';
import { cn, formatRelativeTime } from '../../lib/utils';
import { ProcurementItemSummary } from '../../api/types';
import { procurementApi } from '../../api/client';
import { Button } from '../ui/button';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const STORAGE_KEY_REVIEWS = 'pharmprocure_sidebar_reviews';
const STORAGE_KEY_LAST_REFRESHED = 'pharmprocure_sidebar_last_refreshed';

export const Sidebar: React.FC<{ isOpen?: boolean }> = ({ isOpen = true }) => {
  const [reviews, setReviews] = useState<ProcurementItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<number | null>(null);

  const navItems = [
    {
      to: '/dashboard',
      label: 'Audit Dashboard',
      icon: LayoutDashboard,
      description: 'Historical cases & audit trail',
    },
    {
      to: '/impact',
      label: 'Impact & ROI',
      icon: TrendingUp,
      description: 'Quantified savings & DPCO value',
    },
    {
      to: '/price-check',
      label: 'Price Checker',
      icon: Calculator,
      description: 'NPPA DPCO ceiling compliance',
    },
    {
      to: '/submit',
      label: 'Submit Request',
      icon: PlusCircle,
      description: 'New vendor investigation',
    },
    {
      to: '/queue',
      label: 'Approval Queue',
      icon: ClipboardCheck,
      description: 'Pending human authorization',
    },
  ];

  const fetchReviews = useCallback(async (force = false) => {
    try {
      if (force) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      // Check weekly cache in localStorage if not forced
      if (!force) {
        const cachedRaw = localStorage.getItem(STORAGE_KEY_REVIEWS);
        const timestampRaw = localStorage.getItem(STORAGE_KEY_LAST_REFRESHED);

        if (cachedRaw && timestampRaw) {
          const timestamp = parseInt(timestampRaw, 10);
          const elapsed = Date.now() - timestamp;

          if (!isNaN(timestamp) && elapsed < ONE_WEEK_MS) {
            try {
              const cachedData = JSON.parse(cachedRaw) as ProcurementItemSummary[];
              if (Array.isArray(cachedData) && cachedData.length > 0) {
                setReviews(cachedData);
                setLastRefreshed(timestamp);
                setLoading(false);
                return;
              }
            } catch {
              // Ignore parse error and proceed to fresh fetch
            }
          }
        }
      }

      // Fresh fetch when forced or cache is missing/expired (> 1 week)
      const data = await procurementApi.getAllProcurements();
      const sorted = (data || []).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const now = Date.now();
      setReviews(sorted);
      setLastRefreshed(now);

      try {
        localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(sorted));
        localStorage.setItem(STORAGE_KEY_LAST_REFRESHED, now.toString());
      } catch {
        // Handle storage quota exceptions silently
      }
    } catch (err) {
      console.error('Failed to load recent reviews in sidebar:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    fetchReviews(false);
  }, [fetchReviews]);

  // Periodic check: automatically refresh when weekly TTL expires
  useEffect(() => {
    const interval = setInterval(() => {
      const timestampRaw = localStorage.getItem(STORAGE_KEY_LAST_REFRESHED);
      if (timestampRaw) {
        const timestamp = parseInt(timestampRaw, 10);
        if (!isNaN(timestamp) && Date.now() - timestamp >= ONE_WEEK_MS) {
          fetchReviews(true);
        }
      }
    }, 60 * 60 * 1000); // Check hourly

    return () => clearInterval(interval);
  }, [fetchReviews]);

  // Synchronize when procurement records change (e.g. deletion from dashboard or new creation)
  useEffect(() => {
    const handleProcurementUpdated = () => {
      fetchReviews(true);
    };

    window.addEventListener('pharmprocure_reviews_updated', handleProcurementUpdated);
    return () => {
      window.removeEventListener('pharmprocure_reviews_updated', handleProcurementUpdated);
    };
  }, [fetchReviews]);

  const formatRefreshDate = (ts: number | null) => {
    if (!ts) return 'Not yet synced';
    const date = new Date(ts);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getRiskIcon = (risk?: string) => {
    switch (risk) {
      case 'LOW':
        return <ShieldCheck className="size-3 text-emerald-500" />;
      case 'MEDIUM':
        return <ShieldQuestion className="size-3 text-amber-500" />;
      case 'HIGH':
      case 'CRITICAL':
        return <ShieldAlert className="size-3 text-destructive" />;
      default:
        return <span className="size-1.5 rounded-full bg-primary/60" />;
    }
  };

  const getRiskBadgeClass = (risk?: string) => {
    switch (risk) {
      case 'LOW':
        return 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400 border-emerald-500/20';
      case 'MEDIUM':
        return 'text-amber-700 bg-amber-500/10 dark:text-amber-400 border-amber-500/20';
      case 'HIGH':
      case 'CRITICAL':
        return 'text-destructive bg-destructive/10 dark:text-red-400 border-destructive/20';
      default:
        return 'text-muted-foreground bg-muted border-border/50';
    }
  };

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-out shrink-0 h-full overflow-hidden",
        isOpen ? "w-[320px] min-w-[300px] max-w-[500px] resize-x opacity-100 translate-x-0" : "w-0 min-w-0 opacity-0 -translate-x-12 !resize-none"
      )}
    >
      <aside className="w-full border-r bg-background flex flex-col justify-between h-full overflow-y-auto overflow-x-hidden">
        <div className="p-5 space-y-6 w-full">
          <div>
            <div className="px-3 mb-4 text-[15px] font-semibold text-foreground tracking-tight">
              Workflows
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-[15px] rounded-lg font-medium transition-colors duration-150",
                        isActive
                          ? "bg-secondary text-foreground font-semibold shadow-xs border border-border/40"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      )
                    }
                  >
                    <Icon className="size-4.5 shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Recent Reviews (Weekly Refresh Cadence) */}
          <div className="pt-6 border-t">
            <div className="px-3 mb-3 flex items-center justify-between">
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-foreground tracking-tight">
                    Recent Reviews
                  </span>
                  <span
                    title="Reviews are cached and automatically refreshed every 7 days"
                    className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                  >
                    <Clock className="size-2.5" />
                    Weekly
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  Synced: {formatRefreshDate(lastRefreshed)} • Refreshes per week
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => fetchReviews(true)}
                disabled={isRefreshing || loading}
                title="Refresh reviews now (resets 7-day weekly cycle)"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md"
              >
                <RotateCw className={cn("size-3.5", (isRefreshing || loading) && "animate-spin text-primary")} />
              </Button>
            </div>

            <div className="space-y-1 mt-2">
              {loading && reviews.length === 0 ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 rounded-lg bg-muted/40 animate-pulse" />
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="p-4 text-center rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground">
                  No reviews recorded yet.
                </div>
              ) : (
                reviews.slice(0, 6).map((review) => {
                  const overallRisk = review.report?.riskAssessment.overallRisk;
                  return (
                    <NavLink
                      key={review.procurementId}
                      to={`/review/${review.procurementId}`}
                      className={({ isActive }) =>
                        cn(
                          "w-full flex flex-col gap-1 px-3 py-2.5 rounded-lg text-left transition-all duration-150 border",
                          isActive
                            ? "bg-secondary text-foreground font-semibold shadow-xs border-border/80"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 hover:border-border/30"
                        )
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {review.vendorName}
                        </span>
                        <ChevronRight className="size-3.5 opacity-40 shrink-0" />
                      </div>

                      <div className="flex items-center justify-between text-[11px] gap-2 mt-0.5">
                        <span className="flex items-center gap-1 font-mono text-muted-foreground/80">
                          {review.procurementId}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {overallRisk ? (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-1.5 py-0.2 rounded border font-medium text-[10px]",
                                getRiskBadgeClass(overallRisk)
                              )}
                            >
                              {getRiskIcon(overallRisk)}
                              <span>{overallRisk}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground capitalize">
                              {review.status.stage.toLowerCase().replace('_', ' ')}
                            </span>
                          )}

                          <span className="text-[10px] text-muted-foreground/70">
                            {formatRelativeTime(review.createdAt)}
                          </span>
                        </div>
                      </div>
                    </NavLink>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t text-sm bg-muted/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 font-semibold text-foreground whitespace-nowrap min-w-0">
              <Workflow className="size-4 text-primary shrink-0" />
              <span className="truncate text-xs font-medium">Agent Orchestrator</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>Live</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
