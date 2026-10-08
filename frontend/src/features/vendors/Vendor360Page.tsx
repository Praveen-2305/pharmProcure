import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Vendor360Response } from '../../api/types';
import { fetchVendor360Profile } from '../../api/vendorDirectory';
import { RiskTrendSparkline } from './RiskTrendSparkline';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Mail,
  Phone,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Snowflake,
  TrendingDown,
  Scale,
  Calculator,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
} from 'lucide-react';

export const Vendor360Page: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Vendor360Response | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProfile(id);
    }
  }, [id]);

  const loadProfile = async (vendorId: string) => {
    setLoading(true);
    try {
      const data = await fetchVendor360Profile(vendorId);
      setProfile(data);
    } catch (err) {
      console.error('Failed to load vendor 360 profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatInr = (val?: number) => {
    if (val === undefined || val === null) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center text-xs text-muted-foreground">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading Vendor 360° Profile & Compliance Intelligence...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto p-12 text-center space-y-4">
        <h2 className="text-lg font-bold text-foreground">Vendor Profile Not Found</h2>
        <p className="text-xs text-muted-foreground">
          The requested vendor record could not be retrieved from the master registry.
        </p>
        <Link to="/vendors">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <ArrowLeft className="size-4" /> Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to="/vendors"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="size-3" /> Back to Vendor Directory
            </Link>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs font-mono text-muted-foreground">{profile.vendorId}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {profile.vendorName}
            </h1>
            <Badge
              className={`text-xs font-bold px-2.5 py-0.5 ${
                profile.auditRiskLevel === 'HIGH'
                  ? 'bg-rose-600 text-white'
                  : profile.auditRiskLevel === 'MEDIUM'
                  ? 'bg-amber-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {profile.auditRiskLevel} RISK
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/price-check')}
            className="text-xs gap-1.5"
          >
            <Calculator className="size-3.5 text-primary" />
            <span>Price Checker</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/compare')}
            className="text-xs gap-1.5"
          >
            <Scale className="size-3.5 text-amber-400" />
            <span>Compare Vendor</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/contract-analyzer')}
            className="text-xs gap-1.5 shadow-md"
          >
            <FileCheck2 className="size-3.5" />
            <span>Audit Contract</span>
          </Button>
        </div>
      </div>

      {/* Hero Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Corporate & Regulatory Details */}
        <Card className="lg:col-span-1 border border-border/80 bg-card/60 shadow-md">
          <CardHeader className="p-5 pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="size-4 text-primary" />
              <span>Entity Overview & Credentials</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-start gap-2">
                <MapPin className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-foreground">{profile.headquartersAddress}</span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2">
                <Mail className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-foreground">{profile.contactEmail}</span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2">
                <Phone className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-foreground">{profile.contactPhone}</span>
              </div>
            </div>

            <div className="space-y-2 border-t border-border/40 pt-3">
              <div className="flex justify-between font-mono">
                <span className="text-muted-foreground">Drug License No:</span>
                <span className="font-semibold text-foreground">{profile.drugLicenseNumber}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-muted-foreground">GST / Tax ID:</span>
                <span className="font-semibold text-foreground">{profile.taxIdentificationNumber}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-muted-foreground">Incorporation:</span>
                <span className="font-semibold text-foreground">{profile.incorporationYear}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-muted-foreground">Annual Revenue:</span>
                <span className="font-semibold text-foreground">₹{profile.annualRevenueInrCr} Cr</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-muted-foreground">Credit Rating:</span>
                <span className="font-semibold text-primary">{profile.creditRating}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-muted-foreground">Solvency Ratio:</span>
                <span className="font-semibold text-foreground">{profile.solvencyRatio.toFixed(2)}</span>
              </div>
            </div>

            {/* Regulatory Badges */}
            <div className="border-t border-border/40 pt-3 space-y-2">
              <span className="text-[11px] font-mono text-muted-foreground uppercase block">
                Statutory Regulatory Status
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.scheduleMCompliant && (
                  <Badge className="bg-emerald-950/40 text-emerald-300 border-emerald-500/40 text-[10px]">
                    Schedule M 2024
                  </Badge>
                )}
                {profile.whoTrs1025Compliant && (
                  <Badge className="bg-sky-950/40 text-sky-300 border-sky-500/40 text-[10px] flex items-center gap-1">
                    <Snowflake className="size-2.5" />
                    <span>WHO TRS 1025</span>
                  </Badge>
                )}
                {profile.whoGmpCertified && (
                  <Badge className="bg-emerald-950/40 text-emerald-300 border-emerald-500/40 text-[10px]">
                    WHO GMP Certified
                  </Badge>
                )}
                {profile.fdaApproved && (
                  <Badge className="bg-blue-950/40 text-blue-300 border-blue-500/40 text-[10px]">
                    US FDA Registered
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Middle & Right Columns: 5-Pillar Radar Scores & Quarterly Sparkline */}
        <div className="lg:col-span-2 space-y-6">
          {/* 5-Pillar Score Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="p-3 rounded-lg bg-card border border-border/60 text-center">
              <span className="text-[10px] font-mono text-muted-foreground block uppercase">
                Financial
              </span>
              <span className="text-xl font-bold text-foreground">
                {profile.pillars.financialScore}
              </span>
              <span className="text-[9px] text-muted-foreground block">/100</span>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border/60 text-center">
              <span className="text-[10px] font-mono text-muted-foreground block uppercase">
                Market Power
              </span>
              <span className="text-xl font-bold text-foreground">
                {profile.pillars.marketPowerScore}
              </span>
              <span className="text-[9px] text-muted-foreground block">/100</span>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border/60 text-center">
              <span className="text-[10px] font-mono text-muted-foreground block uppercase">
                Operations
              </span>
              <span className="text-xl font-bold text-foreground">
                {profile.pillars.operationalScore}
              </span>
              <span className="text-[9px] text-muted-foreground block">/100</span>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border/60 text-center">
              <span className="text-[10px] font-mono text-muted-foreground block uppercase">
                Compliance
              </span>
              <span className="text-xl font-bold text-emerald-400">
                {profile.pillars.complianceScore}
              </span>
              <span className="text-[9px] text-muted-foreground block">/100</span>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border/60 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono text-muted-foreground block uppercase">
                Governance
              </span>
              <span className="text-xl font-bold text-foreground">
                {profile.pillars.governanceScore}
              </span>
              <span className="text-[9px] text-muted-foreground block">/100</span>
            </div>
          </div>

          {/* Risk Sparkline Card */}
          <Card className="border border-border/80 bg-card/60 shadow-md">
            <CardHeader className="p-4 pb-2 border-b border-border/40 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingDown className="size-4 text-emerald-400" />
                <span>Multi-Quarter Risk Score Trajectory (Historical Sparkline)</span>
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                Continuous Audit Index
              </Badge>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <RiskTrendSparkline data={profile.riskTrend} height={130} />
              <p className="text-[11px] text-muted-foreground mt-2">
                * Trajectory incorporates ongoing CDSCO inspection notices, batch recall records, and OTIF delivery fulfillment over the past 5 quarters.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Catalog & DPCO Price Ceiling Check Table */}
      <Card className="border border-border/80 bg-card/60 shadow-md">
        <CardHeader className="p-5 pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calculator className="size-4 text-primary" />
              <span>Pharmaceutical Product Catalog & DPCO 2013 Ceiling Status</span>
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {profile.products.length} Mapped Item{profile.products.length === 1 ? '' : 's'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 border-b border-border/40 text-[11px] text-muted-foreground uppercase font-mono">
                <tr>
                  <th className="p-3 pl-5">Product Name & Molecule</th>
                  <th className="p-3">Dosage / Strength</th>
                  <th className="p-3">Quoted Unit Price (INR)</th>
                  <th className="p-3">DPCO Ceiling (INR)</th>
                  <th className="p-3">Compliance Status</th>
                  <th className="p-3 pr-5">Storage Spec</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {profile.products.map((prd) => (
                  <tr key={prd.productId} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3 pl-5 font-medium text-foreground">
                      {prd.productName}
                    </td>
                    <td className="p-3 text-muted-foreground font-mono">
                      {prd.dosageForm} • {prd.strength}
                    </td>
                    <td className="p-3 font-mono font-bold text-foreground">
                      {formatInr(prd.quotedUnitPrice)}
                    </td>
                    <td className="p-3 font-mono text-muted-foreground">
                      {formatInr(prd.regulatedCeilingPrice)}
                    </td>
                    <td className="p-3">
                      {prd.isDpcoCompliant ? (
                        <Badge className="bg-emerald-600/90 text-white text-[10px] font-bold">
                          Within Ceiling
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-600 text-white text-[10px] font-bold">
                          Exceeds DPCO
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 pr-5">
                      {prd.coldChainRequired ? (
                        <span className="flex items-center gap-1 text-sky-400 font-mono text-[11px]">
                          <Snowflake className="size-3" />
                          <span>2°C–8°C</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-mono text-[11px]">Ambient</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Historical Cases Linkage Table */}
      {profile.linkedCases && profile.linkedCases.length > 0 && (
        <Card className="border border-border/80 bg-card/60 shadow-md">
          <CardHeader className="p-5 pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <span>Historical Procurement Investigations & Audits</span>
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {profile.linkedCases.length} Investigation Case{profile.linkedCases.length === 1 ? '' : 's'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 border-b border-border/40 text-[11px] text-muted-foreground uppercase font-mono">
                  <tr>
                    <th className="p-3 pl-5">Case Reference ID</th>
                    <th className="p-3">Deal Size (INR)</th>
                    <th className="p-3">Workflow Stage</th>
                    <th className="p-3">Audit Risk Result</th>
                    <th className="p-3 pr-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {profile.linkedCases.map((cs) => (
                    <tr key={cs.procurementId} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 pl-5 font-mono font-medium text-foreground">
                        {cs.procurementId}
                      </td>
                      <td className="p-3 font-mono font-bold text-foreground">
                        {formatInr(cs.dealSize)}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {cs.stage}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge
                          className={`text-[10px] font-bold ${
                            cs.overallRisk === 'HIGH'
                              ? 'bg-rose-600 text-white'
                              : cs.overallRisk === 'MEDIUM'
                              ? 'bg-amber-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {cs.overallRisk}
                        </Badge>
                      </td>
                      <td className="p-3 pr-5 text-right">
                        <Link to={`/review/${cs.procurementId}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                            <span>Open Dossier</span>
                            <ExternalLink className="size-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
export default Vendor360Page;
