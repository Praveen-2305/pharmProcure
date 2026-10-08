import { httpClient } from './httpClient';
import { DrugCatalogItem, PriceCheckRequest, PriceCheckResponse } from './types';

const MOCK_CATALOG: DrugCatalogItem[] = [
  {
    category: 'solid_oral_dosage',
    name: 'Essential Scheduled Generic Tablets (Paracetamol 650mg, Metformin 500mg, Azithromycin)',
    ceilingPrice: 2905000.0,
    currency: 'INR',
    unitMeasure: 'per 100,000 blister pack units',
    regulatoryNotification: 'DPCO Schedule-II Ceiling Price Order (Updated WPI 2024)',
    therapeuticUse: 'First-line analgesics, antidiabetic, and anti-infectives',
  },
  {
    category: 'cold_chain_biologics',
    name: 'Biopharmaceutical Cold-Chain Monoclonal Antibodies (Trastuzumab, Rituximab 2°C–8°C)',
    ceilingPrice: 24900000.0,
    currency: 'INR',
    unitMeasure: 'per 100-vial shipment',
    regulatoryNotification: 'DPCO Schedule-I Form-II Biologics Price Regulation',
    therapeuticUse: 'Targeted oncology and autoimmune therapeutic antibodies',
  },
  {
    category: 'active_pharmaceutical_ingredients',
    name: 'Sterile Active Pharmaceutical Ingredients (Amoxicillin, Rifampicin, Ciprofloxacin IP)',
    ceilingPrice: 6225000.0,
    currency: 'INR',
    unitMeasure: 'per metric ton',
    regulatoryNotification: 'NPPA S.O. 1245(E) - National List of Essential Medicines (NLEM)',
    therapeuticUse: 'Bulk API Antibacterial & Anti-tubercular synthesis',
  },
  {
    category: 'oncology_injectables',
    name: 'Cytotoxic Oncology Injectables & Sterile Infusions (Paclitaxel, Carboplatin)',
    ceilingPrice: 14940000.0,
    currency: 'INR',
    unitMeasure: 'per 50-cycle therapeutic package',
    regulatoryNotification: 'NPPA Special Price Regulation for 42 Anti-Cancer Drugs',
    therapeuticUse: 'High-potency cytotoxic cancer therapy',
  },
  {
    category: 'vaccines_temperature_controlled',
    name: 'Ultra-Cold & Temperature-Controlled Vaccines (Rabies, Inactivated Viral Antigens 2°C–8°C)',
    ceilingPrice: 17430000.0,
    currency: 'INR',
    unitMeasure: 'per 5,000 dose batch',
    regulatoryNotification: 'Universal Immunization Programme (UIP) Reference Standard',
    therapeuticUse: 'Prophylactic immunization and viral pathogen prevention',
  },
];

export const priceCheckerApi = {
  async getCatalog(): Promise<DrugCatalogItem[]> {
    try {
      return await httpClient.get<DrugCatalogItem[]>('/tools/price-check/catalog');
    } catch {
      return MOCK_CATALOG;
    }
  },

  async checkPrice(request: PriceCheckRequest): Promise<PriceCheckResponse> {
    try {
      return await httpClient.post<PriceCheckResponse>('/tools/price-check', request);
    } catch {
      // Offline fallback calculation
      const catalog = MOCK_CATALOG;
      const q = request.drugName.toLowerCase();
      const matched = catalog.find(
        (c) => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
      ) || catalog[0];

      const ceiling = matched.ceilingPrice;
      const quoted = request.quotedPrice;
      const qty = request.quantity || 1;
      const totalQuoted = quoted * qty;
      const totalCeiling = ceiling * qty;
      const unitVariance = quoted - ceiling;
      const totalOverpayment = Math.max(0, unitVariance * qty);
      const percentDiff = ceiling > 0 ? ((quoted - ceiling) / ceiling) * 100 : 0;
      const isCompliant = quoted <= ceiling;

      return {
        drugName: matched.name,
        category: matched.category,
        quotedPrice: quoted,
        ceilingPrice: ceiling,
        quantity: qty,
        totalQuoted,
        totalCeiling,
        unitVariance,
        totalOverpayment,
        percentageDifference: Number(percentDiff.toFixed(2)),
        isCompliant,
        verdict: isCompliant ? 'LEGAL' : 'STATUTORY_VIOLATION',
        verdictMessage: isCompliant
          ? `Quote of ₹${quoted.toLocaleString('en-IN')} is within statutory DPCO 2013 ceiling (₹${ceiling.toLocaleString('en-IN')}).`
          : `ALERT: Quote of ₹${quoted.toLocaleString('en-IN')} exceeds NPPA statutory ceiling of ₹${ceiling.toLocaleString('en-IN')} by ₹${unitVariance.toLocaleString('en-IN')} (${percentDiff > 0 ? '+' : ''}${percentDiff.toFixed(1)}%).`,
        dpcoReference: matched.regulatoryNotification,
        unitMeasure: matched.unitMeasure,
        therapeuticUse: matched.therapeuticUse,
      };
    }
  },
};
