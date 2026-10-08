import React, { useState, useEffect } from 'react';
import { priceCheckerApi } from '../../api/priceChecker';
import { DrugCatalogItem, PriceCheckResponse } from '../../api/types';
import { PriceVerdictCard } from './PriceVerdictCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Calculator, Search, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const PriceCheckPage: React.FC = () => {
  const [catalog, setCatalog] = useState<DrugCatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [drugInput, setDrugInput] = useState('');
  const [strengthInput, setStrengthInput] = useState('');
  const [quotedPrice, setQuotedPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [filteredCatalog, setFilteredCatalog] = useState<DrugCatalogItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<PriceCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const data = await priceCheckerApi.getCatalog();
        setCatalog(data);
      } catch (err) {
        console.error('Failed to load pricing catalog', err);
      } finally {
        setLoadingCatalog(false);
      }
    }
    loadCatalog();
  }, []);

  const handleDrugSearch = (query: string) => {
    setDrugInput(query);
    if (!query.trim()) {
      setFilteredCatalog([]);
      setShowDropdown(false);
      return;
    }
    const q = query.toLowerCase();
    const matches = catalog.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.therapeuticUse && item.therapeuticUse.toLowerCase().includes(q))
    );
    setFilteredCatalog(matches);
    setShowDropdown(true);
  };

  const handleSelectDrug = (item: DrugCatalogItem) => {
    setDrugInput(item.name);
    setShowDropdown(false);
  };

  const handlePreset = (presetName: string, quote: number, qty: number) => {
    const item = catalog.find((c) => c.name.toLowerCase().includes(presetName.toLowerCase())) || catalog[0];
    setDrugInput(item ? item.name : presetName);
    setQuotedPrice(quote.toString());
    setQuantity(qty.toString());
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drugInput.trim()) {
      setError('Please enter or select a pharmaceutical formulation.');
      return;
    }
    const priceNum = parseFloat(quotedPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid quoted unit price in INR.');
      return;
    }
    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError('Please enter a valid quantity.');
      return;
    }

    setChecking(true);
    setError(null);

    try {
      const response = await priceCheckerApi.checkPrice({
        drugName: drugInput,
        strengthOrPack: strengthInput || undefined,
        quotedPrice: priceNum,
        quantity: qtyNum,
      });
      setResult(response);
    } catch (err: any) {
      setError(err?.message || 'Error communicating with DPCO pricing service.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 animate-fade-in text-left">
      {/* Header section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 px-2.5 py-0.5">
            <Calculator className="size-3.5 mr-1" />
            Statutory Price Intelligence
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">NPPA / DPCO 2013</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Instant DPCO Price Ceiling Checker
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Instantly verify pharmaceutical quotes against statutory ceiling rates fixed under the
          Drugs (Prices Control) Order, 2013. Detect unlawful markups and protect hospital budgets in real time.
        </p>
      </div>

      {/* Preset demo triggers */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1">
          <Sparkles className="size-3.5 text-amber-400" />
          Test Scenarios:
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs h-7 hover:border-rose-500/50 hover:bg-rose-500/10 text-rose-300"
          onClick={() => handlePreset('Paracetamol', 3450000, 2)}
        >
          Overpriced Paracetamol (+18.8% Markup)
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs h-7 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-300"
          onClick={() => handlePreset('Biopharmaceutical', 21500000, 1)}
        >
          Compliant Trastuzumab Biologic (Within Ceiling)
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs h-7 hover:border-rose-500/50 hover:bg-rose-500/10 text-rose-300"
          onClick={() => handlePreset('Oncology', 18500000, 3)}
        >
          Oncology Paclitaxel (Unlawful Pricing)
        </Button>
      </div>

      {/* Main Content Grid: Form (2 cols) + Statutory Catalog Reference (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Form Card */}
        <Card className="border border-border/80 shadow-md bg-card/60 backdrop-blur-xs lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Search className="size-5 text-primary" />
              Evaluate Quoted Unit Price
            </CardTitle>
            <CardDescription>
              Enter the drug name, quoted vendor price, and batch volume in Indian Rupees (INR / ₹).
            </CardDescription>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Drug search input with autocomplete */}
            <div className="relative space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Drug Formulation or Molecule Name
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="e.g. Paracetamol 650mg, Trastuzumab, Amoxicillin IP..."
                  value={drugInput}
                  onChange={(e) => handleDrugSearch(e.target.value)}
                  onFocus={() => {
                    if (drugInput) setShowDropdown(true);
                  }}
                  className="pr-10 bg-background/80"
                  required
                />
                <Search className="size-4 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
              </div>

              {/* Autocomplete dropdown */}
              {showDropdown && filteredCatalog.length > 0 && (
                <div className="absolute z-30 w-full mt-1 bg-popover border border-border rounded-lg shadow-xl max-h-56 overflow-y-auto">
                  {filteredCatalog.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectDrug(item)}
                      className="p-3 hover:bg-accent/60 cursor-pointer border-b border-border/30 last:border-b-0 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.therapeuticUse || item.category} • {item.unitMeasure}
                        </p>
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs">
                        Ceiling: ₹{item.ceilingPrice.toLocaleString('en-IN')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inputs grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Strength / Pack Spec (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. 10 x 10 Blister, 100ml vial"
                  value={strengthInput}
                  onChange={(e) => setStrengthInput(e.target.value)}
                  className="bg-background/80"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Quoted Unit Price (₹ INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-semibold">
                    ₹
                  </span>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 2905000"
                    value={quotedPrice}
                    onChange={(e) => setQuotedPrice(e.target.value)}
                    className="pl-7 bg-background/80 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Order Quantity / Batches *
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-background/80 font-mono"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDrugInput('');
                  setStrengthInput('');
                  setQuotedPrice('');
                  setQuantity('1');
                  setResult(null);
                  setError(null);
                }}
              >
                Clear
              </Button>
              <Button
                type="submit"
                disabled={checking}
                className="font-semibold gap-2 min-w-36 bg-primary text-primary-foreground"
              >
                {checking ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Calculator className="size-4" />
                    Verify Price
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Right Column: Reference Catalog & Regulatory Guidance */}
      <Card className="border border-border/80 shadow-md bg-card/60 backdrop-blur-xs flex flex-col justify-between">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            DPCO 2013 Reference Benchmark
          </CardTitle>
          <CardDescription className="text-xs">
            Official NPPA notified ceilings currently in effect across active schedules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {catalog.slice(0, 5).map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-border/50 bg-background/50 space-y-1 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-foreground leading-tight">
                  {item.name.split('(')[0].trim()}
                </p>
                <span className="text-[11px] font-mono font-bold text-primary shrink-0">
                  ₹{item.ceilingPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate" title={item.regulatoryNotification}>
                {item.regulatoryNotification}
              </p>
              <div className="pt-1 flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{item.unitMeasure}</span>
                <button
                  type="button"
                  onClick={() => {
                    setDrugInput(item.name);
                    setQuotedPrice(String(item.ceilingPrice));
                    setQuantity('1');
                  }}
                  className="text-primary hover:underline font-semibold"
                >
                  Use Ceiling Rate →
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>

    {/* Verdict Presentation */}
    {result && <PriceVerdictCard result={result} />}
  </div>
);
};
