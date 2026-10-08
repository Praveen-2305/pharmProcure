"""
seed_data.py - Master Relational Database Ingestion Engine for AutonoSource
============================================================================
Loads seed source data from:
    backend/ingestion/sql/vendors_50.json (or ingestion/sqlite/)
    backend/ingestion/sql/pricing_ceiling_catalog.json
    backend/ingestion/sql/cases.json

Builds and populates the master persistent SQLite database at:
    backend/processed_data/sqlite/procurement_cases.db

Tables Ingested & Populated:
1. vendors            - Comprehensive 50-vendor directory (80% Indian pharma hubs + global partners, GSTIN, CDSCO Form 25/28)
2. vendor_profiles    - High-performance synthesized vendor risk cache (as per data_collected/sql/sql_storage_schema.md)
3. pricing_references - Statutory NPPA DPCO 2013 ceiling price benchmarks in INR
4. vendor_products    - Catalog items linked directly to Knowledge Graph canonical molecules
5. procurement_cases  - Case ledger with complete workflow models in INR

Can be run independently:
    python backend/build/seed_data.py
Or invoked via master build orchestrator:
    python backend/build/build_all.py
"""

import os
import sys
import json
import sqlite3
import shutil
from datetime import datetime, timezone

# Establish backend root
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

# Resolve Source Ingestion SQL Directory
INGESTION_SQL_DIR = os.path.join(backend_root, "ingestion", "sql")
if not os.path.exists(INGESTION_SQL_DIR) and os.path.exists(os.path.join(backend_root, "ingestion", "sqlite")):
    INGESTION_SQL_DIR = os.path.join(backend_root, "ingestion", "sqlite")

VENDORS_JSON_PATH = os.path.join(INGESTION_SQL_DIR, "vendors_50.json")
PRICING_JSON_PATH = os.path.join(INGESTION_SQL_DIR, "pricing_ceiling_catalog.json")
CASES_JSON_PATH = os.path.join(INGESTION_SQL_DIR, "cases.json")

# Target Processed SQLite Directory
PROCESSED_DATA_DIR = os.path.join(backend_root, "processed_data")
SQLITE_DIR = os.path.join(PROCESSED_DATA_DIR, "sqlite")
SQLITE_DB_PATH = os.path.join(SQLITE_DIR, "procurement_cases.db")

SNAPSHOT_CASES_PATH = os.path.join(SQLITE_DIR, "cases.json")
SNAPSHOT_VENDORS_PATH = os.path.join(SQLITE_DIR, "vendors_50.json")
SNAPSHOT_PRICING_PATH = os.path.join(SQLITE_DIR, "pricing_ceiling_catalog.json")


def init_sqlite_schema(conn: sqlite3.Connection):
    """Initializes all relational tables in SQLite with clean schema definitions."""
    cursor = conn.cursor()
    
    # 1. Full Vendor Directory Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vendors (
            vendor_id TEXT PRIMARY KEY,
            vendor_name TEXT NOT NULL UNIQUE,
            product_category TEXT NOT NULL,
            country TEXT NOT NULL,
            state TEXT,
            city TEXT,
            headquarters_address TEXT,
            contact_email TEXT,
            contact_phone TEXT,
            tax_identification_number TEXT,
            drug_license_number TEXT,
            incorporation_year INTEGER,
            annual_revenue_inr REAL,
            annual_revenue_inr_cr REAL,
            currency TEXT DEFAULT 'INR',
            credit_rating TEXT,
            solvency_ratio REAL,
            who_gmp_certified INTEGER DEFAULT 0,
            fda_approved INTEGER DEFAULT 0,
            schedule_m_compliant INTEGER DEFAULT 1,
            who_trs_1025_compliant INTEGER DEFAULT 0,
            cold_chain_capable INTEGER DEFAULT 0,
            audit_risk_level TEXT DEFAULT 'LOW',
            historical_dispute_count INTEGER DEFAULT 0,
            on_time_delivery_rate REAL DEFAULT 0.95,
            quality_score REAL DEFAULT 4.5,
            quoted_price_benchmark REAL,
            vendor_summary TEXT,
            created_at TEXT NOT NULL
        )
    """)

    # 2. Synthesized Vendor Risk & Collaboration Cache (sql_storage_schema.md)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vendor_profiles (
            vendor_name TEXT PRIMARY KEY,
            vendor_id TEXT NOT NULL,
            global_risk_level TEXT NOT NULL,
            compliance_status TEXT,
            litigation_summary TEXT,
            financial_status TEXT,
            last_updated TEXT NOT NULL
        )
    """)

    # 3. Statutory Pricing Ceiling Benchmarks
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pricing_references (
            category TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            ceiling_price REAL NOT NULL,
            deal_ceiling_threshold REAL NOT NULL,
            currency TEXT DEFAULT 'INR',
            unit_measure TEXT,
            regulatory_notification TEXT,
            therapeutic_use TEXT,
            created_at TEXT NOT NULL
        )
    """)

    # 4. Vendor Product Catalog (Linked to Knowledge Graph Canonical Molecules)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vendor_products (
            product_id TEXT PRIMARY KEY,
            vendor_id TEXT NOT NULL,
            vendor_name TEXT NOT NULL,
            product_name TEXT NOT NULL,
            canonical_molecule TEXT,
            dosage_form TEXT,
            unit_pack_size TEXT,
            unit_price_inr REAL NOT NULL,
            currency TEXT DEFAULT 'INR',
            moq INTEGER,
            storage_condition TEXT,
            lead_time_days INTEGER,
            created_at TEXT NOT NULL,
            FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id)
        )
    """)

    # 5. Procurement Case Ledger
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS procurement_cases (
            procurement_id TEXT PRIMARY KEY,
            vendor_name TEXT NOT NULL,
            deal_size REAL NOT NULL,
            status_json TEXT NOT NULL,
            report_json TEXT,
            approval_json TEXT,
            created_at TEXT NOT NULL
        )
    """)

    conn.commit()


def load_json_file(file_path: str):
    """Safely reads and returns parsed JSON content."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Source JSON file missing: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def map_canonical_product(vendor: dict, index: int) -> dict:
    """
    Constructs a realistic vendor catalog product mapped to Knowledge Graph molecules.
    """
    category = vendor.get("product_category", "active_pharmaceutical_ingredients")
    v_id = vendor.get("vendor_id", f"VND-{index+1:03d}")
    v_name = vendor.get("vendor_name", "Vendor")

    molecule_map = {
        "active_pharmaceutical_ingredients": {
            "name": f"{v_name.split()[0]} Amoxicillin Trihydrate IP (Micronized)",
            "molecule": "Amoxicillin",
            "form": "Bulk Active Powder",
            "pack": "25 kg Fibre Drum",
            "price": 4200.0,
            "moq": 10,
            "storage": "Controlled Room Temperature 15°C–25°C, sealed desiccated",
            "lead_time": 14
        },
        "cold_chain_biologics": {
            "name": f"{v_name.split()[0]} Trastuzumab Biosimilar 440mg",
            "molecule": "Trastuzumab",
            "form": "Lyophilized Powder for IV Infusion",
            "pack": "Single 440mg Multi-dose Vial with 20mL BWFI",
            "price": 38500.0,
            "moq": 50,
            "storage": "Refrigerated 2°C–8°C, Protect from light. Do not freeze.",
            "lead_time": 7
        },
        "solid_oral_dosage": {
            "name": f"{v_name.split()[0]} Paracetamol IP 650mg Fast-Release",
            "molecule": "Paracetamol",
            "form": "Uncoated Tablets",
            "pack": "Box of 1000 Tablets (100 x 10 Blisters)",
            "price": 1450.0,
            "moq": 100,
            "storage": "Store below 30°C in dry place, protect from moisture",
            "lead_time": 10
        },
        "oncology_injectables": {
            "name": f"{v_name.split()[0]} Paclitaxel Injection IP 100mg/16.7mL",
            "molecule": "Paclitaxel",
            "form": "Sterile Concentrated Solution",
            "pack": "Single 16.7mL Clear Glass Vial",
            "price": 9800.0,
            "moq": 25,
            "storage": "Store between 20°C–25°C, protect from light",
            "lead_time": 12
        },
        "vaccines_temperature_controlled": {
            "name": f"{v_name.split()[0]} Inactivated Human Rabies Vaccine IP",
            "molecule": "Rabies Vaccine",
            "form": "Lyophilized Vaccine + Diluent",
            "pack": "Single Human Dose (2.5 IU/mL) Vial + 1mL Syringe",
            "price": 380.0,
            "moq": 500,
            "storage": "Strict Cold Chain 2°C–8°C, Continuous IoT thermal logger",
            "lead_time": 5
        },
        "sterilization_packaging": {
            "name": f"{v_name.split()[0]} USP Type-I Borosilicate Vials 10mL",
            "molecule": "Borosilicate Glass Type I",
            "form": "Depyrogenated Sterile Tubular Glass",
            "pack": "Tray of 192 Vials (Shrink-wrapped)",
            "price": 2850.0,
            "moq": 50,
            "storage": "Cleanroom Grade B/ISO Class 5 humidity-controlled warehouse",
            "lead_time": 21
        },
        "diagnostic_reagents": {
            "name": f"{v_name.split()[0]} Multi-Pathogen Real-Time RT-PCR Master Mix",
            "molecule": "Taq Polymerase & Oligonucleotide Primers",
            "form": "Frozen Enzymatic Master Mix",
            "pack": "Kit of 100 Reactions (2 x 1.25mL Vials)",
            "price": 12500.0,
            "moq": 20,
            "storage": "Ultra-Low Temperature -20°C ± 5°C, Dry ice transport",
            "lead_time": 3
        },
        "specialty_apis": {
            "name": f"{v_name.split()[0]} Enzalutamide High-Purity Synthesis Grade",
            "molecule": "Enzalutamide",
            "form": "Crystalline Bulk Solid",
            "pack": "1 kg Sealed Aluminum Barrier Pouch",
            "price": 165000.0,
            "moq": 2,
            "storage": "Store below 25°C, USP Controlled Room Temperature",
            "lead_time": 28
        }
    }

    prod_info = molecule_map.get(category, molecule_map["active_pharmaceutical_ingredients"])
    
    return {
        "product_id": f"PRD-{index+1:04d}",
        "vendor_id": v_id,
        "vendor_name": v_name,
        "product_name": prod_info["name"],
        "canonical_molecule": prod_info["molecule"],
        "dosage_form": prod_info["form"],
        "unit_pack_size": prod_info["pack"],
        "unit_price_inr": prod_info["price"],
        "currency": "INR",
        "moq": prod_info["moq"],
        "storage_condition": prod_info["storage"],
        "lead_time_days": prod_info["lead_time"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }


def run_database_seed(target_db_path: str = SQLITE_DB_PATH) -> bool:
    """
    Ingests source JSON seed data from backend/ingestion/sql/ and populates
    backend/processed_data/sqlite/procurement_cases.db.
    """
    start_time = datetime.now(timezone.utc)
    print("=" * 75)
    print("  AUTONOSOURCE: RELATIONAL DATABASE INGESTION & SEED ENGINE")
    print("=" * 75)

    # 1. Ensure target processed directory exists
    target_dir = os.path.dirname(target_db_path)
    os.makedirs(target_dir, exist_ok=True)
    os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)

    rel_source = os.path.relpath(INGESTION_SQL_DIR, backend_root)
    rel_target = os.path.relpath(target_db_path, backend_root)
    print(f"\n[Source Input Directory] : {rel_source}")
    print(f"[Target Database Path]  : {rel_target}")

    # 2. Read Source Ingestion JSON files
    print(f"\n[Step 1/5] Loading source seed data from {rel_source}...")
    vendors_data = load_json_file(VENDORS_JSON_PATH)
    pricing_data = load_json_file(PRICING_JSON_PATH)
    cases_data = load_json_file(CASES_JSON_PATH)

    print(f"  ✓ Loaded {len(vendors_data)} vendors from vendors_50.json")
    pricing_items = pricing_data.get("items", [])
    print(f"  ✓ Loaded {len(pricing_items)} pricing benchmarks from pricing_ceiling_catalog.json")
    print(f"  ✓ Loaded {len(cases_data)} procurement cases from cases.json")

    # 3. Connect to SQLite and initialize schema
    print(f"\n[Step 2/5] Initializing SQLite tables in {os.path.relpath(target_dir, backend_root)}...")
    conn = sqlite3.connect(target_db_path)
    init_sqlite_schema(conn)

    now_iso = datetime.now(timezone.utc).isoformat()

    # 4. Ingest Vendors & Vendor Profiles
    print("\n[Step 3/5] Ingesting vendors, profiles, and catalog products...")
    cursor = conn.cursor()

    # Clear existing records for idempotent rebuild
    cursor.execute("DELETE FROM vendor_products")
    cursor.execute("DELETE FROM vendor_profiles")
    cursor.execute("DELETE FROM pricing_references")
    cursor.execute("DELETE FROM procurement_cases")
    cursor.execute("DELETE FROM vendors")

    product_records = []
    for idx, v in enumerate(vendors_data):
        # Insert into vendors
        cursor.execute("""
            INSERT OR REPLACE INTO vendors (
                vendor_id, vendor_name, product_category, country, state, city,
                headquarters_address, contact_email, contact_phone,
                tax_identification_number, drug_license_number, incorporation_year,
                annual_revenue_inr, annual_revenue_inr_cr, currency, credit_rating,
                solvency_ratio, who_gmp_certified, fda_approved, schedule_m_compliant,
                who_trs_1025_compliant, cold_chain_capable, audit_risk_level,
                historical_dispute_count, on_time_delivery_rate, quality_score,
                quoted_price_benchmark, vendor_summary, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            v.get("vendor_id"),
            v.get("vendor_name"),
            v.get("product_category"),
            v.get("country", "India"),
            v.get("state"),
            v.get("city"),
            v.get("headquarters_address"),
            v.get("contact_email"),
            v.get("contact_phone"),
            v.get("tax_identification_number"),
            v.get("drug_license_number"),
            v.get("incorporation_year"),
            v.get("annual_revenue_inr"),
            v.get("annual_revenue_inr_cr"),
            v.get("currency", "INR"),
            v.get("credit_rating"),
            v.get("solvency_ratio"),
            v.get("who_gmp_certified", 0),
            v.get("fda_approved", 0),
            v.get("schedule_m_compliant", 1),
            v.get("who_trs_1025_compliant", 0),
            v.get("cold_chain_capable", 0),
            v.get("audit_risk_level", "LOW"),
            v.get("historical_dispute_count", 0),
            v.get("on_time_delivery_rate", 0.95),
            v.get("quality_score", 4.5),
            v.get("quoted_price_benchmark"),
            v.get("vendor_summary"),
            now_iso
        ))

        # Insert into vendor_profiles (Planner Agent LIGHT cache)
        rev_cr = v.get("annual_revenue_inr_cr", 100.0)
        solv = v.get("solvency_ratio", 2.0)
        c_rating = v.get("credit_rating", "A")
        fin_status = f"Audited Clean (₹{rev_cr:.1f} Cr, Solvency: {solv:.2f}, Rating: {c_rating})"
        
        comp_parts = []
        if v.get("schedule_m_compliant"):
            comp_parts.append("Schedule M Verified")
        if v.get("who_gmp_certified"):
            comp_parts.append("WHO-GMP Certified")
        if v.get("fda_approved"):
            comp_parts.append("US-FDA 483 Clean")
        if v.get("drug_license_number"):
            comp_parts.append(f"License: {v.get('drug_license_number')}")
        compliance_status = "; ".join(comp_parts) if comp_parts else "Compliant"

        disputes = v.get("historical_dispute_count", 0)
        litigation_summary = "Zero active disputes or adverse notices on CDSCO portal." if disputes == 0 else f"{disputes} historical commercial dispute(s) resolved in good standing."

        cursor.execute("""
            INSERT OR REPLACE INTO vendor_profiles (
                vendor_name, vendor_id, global_risk_level,
                compliance_status, litigation_summary, financial_status, last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            v.get("vendor_name"),
            v.get("vendor_id"),
            v.get("audit_risk_level", "LOW"),
            compliance_status,
            litigation_summary,
            fin_status,
            now_iso
        ))

        # Build linked vendor product
        prod = map_canonical_product(v, idx)
        product_records.append(prod)
        cursor.execute("""
            INSERT OR REPLACE INTO vendor_products (
                product_id, vendor_id, vendor_name, product_name,
                canonical_molecule, dosage_form, unit_pack_size,
                unit_price_inr, currency, moq, storage_condition,
                lead_time_days, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            prod["product_id"],
            prod["vendor_id"],
            prod["vendor_name"],
            prod["product_name"],
            prod["canonical_molecule"],
            prod["dosage_form"],
            prod["unit_pack_size"],
            prod["unit_price_inr"],
            prod["currency"],
            prod["moq"],
            prod["storage_condition"],
            prod["lead_time_days"],
            prod["created_at"]
        ))

    print(f"  ✓ Ingested {len(vendors_data)} vendors into `vendors` table.")
    print(f"  ✓ Ingested {len(vendors_data)} vendor profiles into `vendor_profiles` table.")
    print(f"  ✓ Ingested {len(product_records)} catalog items into `vendor_products` table.")

    # 5. Ingest Pricing References
    print("\n[Step 4/5] Ingesting DPCO 2013 statutory price ceilings...")
    for item in pricing_items:
        cursor.execute("""
            INSERT OR REPLACE INTO pricing_references (
                category, name, ceiling_price, deal_ceiling_threshold,
                currency, unit_measure, regulatory_notification,
                therapeutic_use, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            item.get("category"),
            item.get("name"),
            item.get("ceiling_price"),
            item.get("deal_ceiling_threshold"),
            item.get("currency", "INR"),
            item.get("unit_measure"),
            item.get("regulatory_notification"),
            item.get("therapeutic_use"),
            now_iso
        ))
    print(f"  ✓ Ingested {len(pricing_items)} statutory ceiling records into `pricing_references`.")

    # 6. Ingest Procurement Cases strictly from cases.json
    print("\n[Step 5/5] Ingesting procurement workflow cases and audit records...")
    for case in cases_data:
        p_id = case.get("procurement_id")
        v_name = case.get("vendor_name")
        d_size = case.get("deal_size", 0.0)
        st_json = json.dumps(case.get("status")) if case.get("status") else "{}"
        rep_json = json.dumps(case.get("report")) if case.get("report") else None
        app_json = json.dumps(case.get("approval")) if case.get("approval") else None
        c_at = case.get("created_at", now_iso)

        cursor.execute("""
            INSERT OR REPLACE INTO procurement_cases (
                procurement_id, vendor_name, deal_size, status_json, report_json, approval_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (p_id, v_name, d_size, st_json, rep_json, app_json, c_at))
        print(f"    ✓ Registered Case [{p_id}]: {v_name} (₹{d_size:,.2f})")

    conn.commit()
    conn.close()

    # 7. Write database snapshots strictly inside processed_data/sqlite/ (NO duplicates at root)
    with open(SNAPSHOT_VENDORS_PATH, "w", encoding="utf-8") as f:
        json.dump(vendors_data, f, indent=2, ensure_ascii=False)

    with open(SNAPSHOT_CASES_PATH, "w", encoding="utf-8") as f:
        json.dump(cases_data, f, indent=2, ensure_ascii=False)

    with open(SNAPSHOT_PRICING_PATH, "w", encoding="utf-8") as f:
        json.dump(pricing_data, f, indent=2, ensure_ascii=False)


    # 9. Clean up any loose .db or .json at root of processed_data to prevent any duplication
    for fname in ["procurement_cases.db", "cases.json", "vendors_50.json"]:
        fpath = os.path.join(PROCESSED_DATA_DIR, fname)
        if os.path.isfile(fpath) and not os.path.islink(fpath):
            try:
                os.remove(fpath)
            except Exception:
                pass

    duration = (datetime.now(timezone.utc) - start_time).total_seconds()
    print("\n" + "=" * 75)
    print(f"  ✓ RELATIONAL DATABASE INGESTION COMPLETE in {duration:.2f}s")
    print(f"  ✓ Database File : {rel_target}")
    print(f"  ✓ Total Vendors : {len(vendors_data)} (80% Indian Pharma Hubs, INR)")
    print(f"  ✓ Total Profiles: {len(vendors_data)} cached for LIGHT router")
    print(f"  ✓ Total Pricing : {len(pricing_items)} DPCO 2013 ceilings")
    print(f"  ✓ Total Products: {len(product_records)} linked to Knowledge Graph")
    print(f"  ✓ Total Cases   : {len(cases_data)} workflow audit records")
    print("=" * 75)
    return True


if __name__ == "__main__":
    success = run_database_seed()
    sys.exit(0 if success else 1)
