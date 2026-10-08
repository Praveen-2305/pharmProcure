import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { VendorDirectoryItem } from '../../api/types';
import { fetchVendorDirectory } from '../../api/vendorDirectory';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Search,
  Filter,
  Building2,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Snowflake,
  ExternalLink,
  Award,
  TrendingUp,
  RefreshCw,
  Scale,
} from 'lucide-react';

export const VendorDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<VendorDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [coldChainOnly, setColdChainOnly] = useState<boolean>(false);

  useEffect(() => {
    loadVendors();
  }, [selectedRisk, coldChainOnly]);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const res = await fetchVendorDirectory({
        query: searchQuery || undefined,
        riskLevel: selectedRisk === 'ALL' ? undefined : selectedRisk,
        coldChainOnly,
      });
      setVendors(res.vendors);
    } catch (err) {
      console.error('Failed to load vendor directory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadVendors();
  };

  // Stats calculation
  const totalCount = vendors.length;
  const coldChainCount = vendors.filter((v) => v.coldChainCapable).length;
  const lowRiskCount = vendors.filter((v) => v.auditRiskLevel === 'LOW').length;
  const avgOtif =
    totalCount > 0
      ? (vendors.reduce((acc, v) => acc + v.otifRatePercent, 0) / totalCount).toFixed(1)
      : '95.0';

  const getRiskBadge = (risk: string) => {
    switch (risk.toUpperCase()) {
      case 'HIGH':
        return <Badge className="bg-rose-600 text-white text-[10px] font-bold">HIGH RISK</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-amber-600 text-white text-[10px] font-bold">MEDIUM RISK</Badge>;
      case 'LOW':
      default:
        return <Badge className="bg-emerald-600 text-white text-[10px] font-bold">LOW RISK</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary/40 font-mono text-xs">
              Feature 3 • Verified Supplier Master
            </Badge>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
              CDSCO & Schedule M Verified
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mt-1">
            Pharmaceutical Vendor Directory & 360° Intelligence
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Institutional master supplier directory with Schedule M GMP verification, WHO TRS 1025 cold-chain capabilities, and continuous risk monitoring.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => loadVendors()}
          className="text-xs gap-1.5 self-start md:self-auto"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Directory</span>
        </Button>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-border/80 bg-card/60 shadow-sm">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase">Verified Vendors</span>
            <div className="text-2xl font-bold text-foreground">{totalCount} Suppliers</div>
            <span className="text-[10px] text-emerald-400 block font-medium">100% CDSCO Registered</span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card/60 shadow-sm">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase">Cold-Chain Capable</span>
            <div className="text-2xl font-bold text-foreground">{coldChainCount} Certified</div>
            <span className="text-[10px] text-emerald-400 block font-medium">WHO TRS 1025 Audited</span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card/60 shadow-sm">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase">Low Risk Profile</span>
            <div className="text-2xl font-bold text-foreground">{lowRiskCount} Preferred</div>
            <span className="text-[10px] text-muted-foreground block font-medium">Unencumbered status</span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card/60 shadow-sm">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase">Average OTIF Rate</span>
            <div className="text-2xl font-bold text-emerald-400">{avgOtif}%</div>
            <span className="text-[10px] text-muted-foreground block font-medium">On-Time In-Full Delivery</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border/80 bg-card/60 backdrop-blur-md">
        <CardContent className="p-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search vendor by name, molecule, state (e.g. Bharat, Gujarat, Oncology)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-background border border-border/80 rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <Button type="submit" size="sm" className="text-xs px-4">
              Search
            </Button>
          </form>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-muted-foreground font-medium mr-1 flex items-center gap-1">
                <Filter className="size-3" /> Risk Tier:
              </span>
              {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedRisk(tier)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    selectedRisk === tier
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
              <input
                type="checkbox"
                checked={coldChainOnly}
                onChange={(e) => setColdChainOnly(e.target.checked)}
                className="accent-primary size-3.5 rounded"
              />
              <span className="flex items-center gap-1 text-foreground">
                <Snowflake className="size-3.5 text-sky-400" />
                <span>Cold-Chain Capable Only (WHO TRS 1025)</span>
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Querying verified pharmaceutical vendor registry...
        </div>
      ) : vendors.length === 0 ? (
        <Card className="p-8 text-center text-xs text-muted-foreground">
          No vendors matched your query or filters. Try adjusting your search term.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((vendor) => (
            <Card
              key={vendor.vendorId}
              className="border border-border/80 bg-card/60 hover:border-primary/50 transition-all duration-200 flex flex-col justify-between shadow-sm group"
            >
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-border/50 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {vendor.vendorId}
                      </span>
                      {getRiskBadge(vendor.auditRiskLevel)}
                    </div>
                    <Link
                      to={`/vendors/${vendor.vendorId}`}
                      className="font-bold text-sm text-foreground hover:text-primary transition-colors block leading-snug"
                    >
                      {vendor.vendorName}
                    </Link>
                  </div>

                  <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                    Rating {vendor.creditRating}
                  </Badge>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-primary shrink-0" />
                    <span className="truncate">{vendor.productCategory}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                    <span>
                      {vendor.city}, {vendor.state}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2 rounded bg-background/50 border border-border/40">
                      <span className="text-[10px] text-muted-foreground block">Annual Rev</span>
                      <span className="font-semibold text-foreground">
                        ₹{vendor.annualRevenueInrCr.toFixed(0)} Cr
                      </span>
                    </div>
                    <div className="p-2 rounded bg-background/50 border border-border/40">
                      <span className="text-[10px] text-muted-foreground block">OTIF Rate</span>
                      <span className="font-semibold text-emerald-400">
                        {vendor.otifRatePercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Certifications Row */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {vendor.scheduleMCompliant && (
                    <Badge
                      variant="outline"
                      className="text-[9px] bg-emerald-950/20 text-emerald-400 border-emerald-500/30"
                    >
                      Schedule M
                    </Badge>
                  )}
                  {vendor.coldChainCapable && (
                    <Badge
                      variant="outline"
                      className="text-[9px] bg-sky-950/20 text-sky-400 border-sky-500/30 flex items-center gap-1"
                    >
                      <Snowflake className="size-2.5" />
                      <span>WHO TRS 1025</span>
                    </Badge>
                  )}
                  <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                    {vendor.caseCount} Case{vendor.caseCount === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Action button */}
                <div className="pt-2 border-t border-border/40">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/vendors/${vendor.vendorId}`)}
                    className="w-full text-xs gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                  >
                    <span>View Vendor 360° Profile</span>
                    <ExternalLink className="size-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
export default VendorDirectoryPage;
