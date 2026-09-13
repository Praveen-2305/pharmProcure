# AutonoSource Data Architecture: SQL Database Schema

To make the LangGraph agents truly autonomous, the SQL Database acts as the permanent "Memory" of the system. It caches heavily synthesized outputs from the Web Scraper and RAG Graph, as well as the specific **product collaboration** details submitted via the frontend UI.

## The SQL Database Cache (`vendor_profiles`)

Once the Web Scraper finishes hunting for external data, and the RAG/Graph pipeline finishes auditing the SLA against regulations, the **Executor Agent** synthesizes a complete vendor profile. This completely extracted profile is saved to the SQLite database.

Furthermore, it tracks the product categories and historical deal sizes we are collaborating with them on.

### Core Vendor Identifiers
- **`vendor_id`**: Primary Key (UUID or Hash).
- **`vendor_name`**: Name of the vendor (e.g., "Apex BioPharma Logistics LLC").

### Product & Collaboration Information (From Frontend & RAG)
- **`historical_deal_size`**: The total or most recent `$ USD` deal size we collaborated on.
- **`product_category`**: The primary category of goods (e.g., "Pharmaceuticals", "Cold-Chain Transport", "Medical Equipment").
- **`scope_of_work`**: The procurement details and deliverables (e.g., "Supply of generic paracetamol", "Clinical Trial Supplies").
- **`contractual_limitations`**: Any flagged SLA limitations discovered by the RAG Graph (e.g., liability caps).

### Synthesized Risk & Compliance (From Web Scraper)
- **`global_risk_level`**: (LOW/MEDIUM/HIGH) Synthesized risk from both Web Scraped info and RAG contract audits.
- **`compliance_status`**: e.g., "Schedule M Verified; No FDA Citations."
- **`litigation_summary`**: JSON string or condensed summary of the scraped litigation and commercial disputes.
- **`financial_status`**: e.g., "Audited Clean".

### Metadata
- **`last_updated`**: Timestamp of the last FULL pipeline run.

---

## The Planner Agent (The "Router")
When a new procurement request arrives from the frontend UI, the Planner Agent queries this `vendor_profiles` table. 
- **If Record Exists & is Fresh:** Trigger **LIGHT** pipeline. Skip RAG and Scraping. Jump straight to Scorer using SQL data.
- **If Record Missing or Stale:** Trigger **FULL** pipeline. Hunt -> Evaluate -> Cache to SQL.
