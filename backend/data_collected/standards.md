# Graph Data: Regulatory Standards

## Node: Schedule M Good Manufacturing Practices
- ID: schedule_m_gmp
- Type: RegulatoryStandard
- Authority: CDSCO
### Relationships
- [DEFINED_IN] -> drugs_cosmetics_act (Weight: 1.0, Source Priority: 1.0)

## Node: WHO Cold-Chain Storage Guidelines
- ID: who_trs1025_annex7
- Type: StorageStandard
- Temp Range: 2C-8C
### Relationships
- [CITED_IN] -> drugs_cosmetics_act (Weight: 1.0, Source Priority: 1.0)

## Node: Drugs and Cosmetics Act, 1940
- ID: drugs_cosmetics_act
- Type: PrimaryLegislation
- Jurisdiction: India
### Relationships

## Node: Drugs Prices Control Order, 2013
- ID: nppa_dpco_ceiling
- Type: PriceRegulation
- Authority: NPPA
### Relationships

## Node: Form 28D Biological Manufacturing License
- ID: form_28d_license
- Type: License
- Category: Biological Manufacturing
### Relationships

## Node: IoT Temperature Logger Specification
- ID: iot_temperature_logger
- Type: MonitoringSpec
- Frequency: continuous
### Relationships

## Node: Standard Liability Cap
- ID: liability_cap_standard
- Type: ContractNorm
- Recommended Multiplier: 1.5x
### Relationships
