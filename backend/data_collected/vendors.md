# Graph Data: Vendors

## Node: BioGen Diagnostics Inc.
- ID: biogen_diagnostics
- Type: Vendor
- Credit Score: 780
- Tier: Tier-1 Manufacturer
### Relationships
- [COMPLIES_WITH] -> schedule_m_gmp (Weight: 1.0, Source Priority: 1.0)
- [HOLDS_LICENSE] -> form_28d_license (Weight: 1.0, Source Priority: 1.0)
- [CERTIFIED_FOR] -> who_trs1025_annex7 (Weight: 0.85, Source Priority: 0.85)

## Node: Global Pharma Logistics Ltd.
- ID: global_pharma
- Type: Vendor
- Credit Score: 720
- Tier: Logistics Provider
### Relationships
- [GOVERNED_BY] -> nppa_dpco_ceiling (Weight: 1.0, Source Priority: 1.0)
- [AUDITED_AGAINST] -> schedule_m_gmp (Weight: 0.9, Source Priority: 0.9)
- [BOUND_BY] -> liability_cap_standard (Weight: 0.85, Source Priority: 0.85)

## Node: Apex BioLogistics Pvt. Ltd.
- ID: apex_biologistics
- Type: Vendor
- Credit Score: 680
- Tier: Regional Distributor
### Relationships
- [COMPLIES_WITH] -> schedule_m_gmp (Weight: 0.9, Source Priority: 0.9)
- [DISPUTED_COMPLIANCE] -> who_trs1025_annex7 (Weight: 0.7, Source Priority: 0.7)

## Node: Nova Biologics & Vaccines Ltd.
- ID: nova_biologics
- Type: Vendor
- Credit Score: 810
- Tier: Prequalified Manufacturer
### Relationships
- [MANDATES] -> who_trs1025_annex7 (Weight: 1.0, Source Priority: 1.0)
- [EQUIPPED_WITH] -> iot_temperature_logger (Weight: 1.0, Source Priority: 1.0)
- [COMPLIES_WITH] -> nppa_dpco_ceiling (Weight: 1.0, Source Priority: 1.0)

## Node: MediSynth Specialty Formulations Ltd.
- ID: medisynth_specialty
- Type: Vendor
- Credit Score: 710
- Tier: Specialty Formulations
### Relationships
- [COMPLIES_WITH] -> schedule_m_gmp (Weight: 0.9, Source Priority: 0.9)
