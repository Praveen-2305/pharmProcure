PROOF OF CONCEPT (POC) DOCUMENT

AutonoSource — Multi-Agent Procurement Risk & Vendor Intelligence Platform

Project Name: AutonoSource — Multi-Agent Procurement Risk & Vendor Intelligence Platform

Prepared By: Krishnaprasath SK

Department: B.Tech Computer Science and Business Systems

Version: 2.0 (Updated — supersedes v1.0 dated 16/7/2026)

Document Status: Draft (Updated)

Revision Basis: This version incorporates two capabilities added after v1.0 — hybrid Vector+Graph RAG retrieval with contradiction resolution, and a regulated pricing compliance check — as recorded in the session change log. Sections and content carried over unchanged from v1.0 are not marked; new or materially changed content is flagged inline.


1. Overview

1.1 Purpose

The purpose of this Proof of Concept (POC) is to demonstrate that procurement risk evaluation can be transformed from a manual, document-driven process into an intelligent, structured workflow using a multi-agent architecture powered by LangGraph.

Unlike traditional AI systems that rely on a single Large Language Model (LLM) response, this solution introduces specialized AI agents that collaborate to perform planning, evidence gathering, risk assessment, self-validation, and human-assisted decision making.

This version extends the original scope to include hybrid retrieval across a vector store and a knowledge graph, reconciled through an explicit contradiction-resolution step, and a regulated pricing compliance check against published ceiling prices, so that pricing risk is evaluated with the same evidence-based rigor as financial and compliance risk.

The POC validates the feasibility of orchestrating these agents through a stateful workflow that supports conditional branching, iterative reasoning, and mandatory human approval before any procurement recommendation is finalized. The primary objective is not to replace procurement professionals but to automate repetitive investigative tasks while preserving human oversight for critical business decisions.

1.2 Background

Procurement is one of the most critical business functions in any organization because selecting the wrong vendor can result in financial losses, legal liabilities, compliance violations, or operational disruptions.

Before approving a vendor, procurement analysts must investigate several factors, including:

Vendor financial stability

Compliance certifications

Previous business history

Contract clauses

External reputation and legal disputes

Risk exposure

A further factor, not addressed in the original scope, is whether the quoted price itself complies with regulated ceiling prices where applicable — an omission this version corrects.

Because information is distributed across structured databases, unstructured contracts, a knowledge graph of regulatory relationships, and external websites, procurement investigations are often slow, inconsistent, and highly dependent on manual effort. This creates an opportunity for AI-powered systems that can automate evidence collection while ensuring that recommendations remain explainable and trustworthy.

1.3 Business Context

Current Business Process

Procurement team receives a vendor proposal.

Analysts verify whether the organization has worked with the vendor previously.

Vendor financial records are examined.

Compliance certificates are reviewed.

Contracts are manually analyzed for risky clauses.

External research is performed to identify lawsuits or negative news.

Risk findings are consolidated into a report.

Procurement managers decide whether to approve or escalate the vendor.

Expected Business Value

Faster procurement decisions

Standardized investigation procedures

Reduced manual effort

Explainable AI recommendations, including traceable resolution of conflicting evidence

Improved compliance, now covering price regulation alongside legal and quality compliance

Lower operational costs and improved auditability

1.4 Objectives

Primary Objectives

Demonstrate a stateful multi-agent procurement workflow.

Validate LangGraph as the orchestration framework.

Automate vendor risk investigation.

Enable evidence-driven decision making.

Introduce self-validation using a Critic Agent.

Secondary Objectives

Integrate structured and unstructured information retrieval.

Demonstrate Retrieval-Augmented Generation (RAG).

Showcase conditional workflow execution.

Validate human-in-the-loop approval.

New Objectives (v2.0)

Extend RAG retrieval from vector-only to a hybrid Vector RAG + Graph RAG design, with a defined fusion and contradiction-check mechanism.

Introduce a fourth risk dimension — pricing risk — evaluated against a regulated price reference dataset (e.g. NPPA/DPCO-style ceiling pricing).


2. Problem Statement

2.1 Existing Procurement Challenges

Vendor evaluation is fundamentally an investigative process rather than a simple information retrieval task. A procurement analyst rarely performs a fixed sequence of actions; instead, each decision depends on previous findings. Current AI solutions based on a single LLM prompt cannot replicate this adaptive reasoning process.

2.2 Why Traditional RAG Is Insufficient

Traditional Retrieval-Augmented Generation retrieves documents and generates an answer in two steps, with no dynamic planning, no multi-step evidence collection, no self-critique, and no feedback loop or human approval gate.

A further limitation, specific to single-retriever RAG, is that a vector store alone cannot represent explicit regulatory relationships (e.g. which clause governs which product category), and has no mechanism for detecting when two retrieved passages disagree. This gap motivates the hybrid retrieval design introduced in v2.0 (Section 3.3).

2.3 Business Impact

Increased operational cost from repetitive manual verification.

Delayed vendor onboarding.

Inconsistent decisions across analysts.

Compliance risks from overlooked contract clauses.

Financial risks from weak vendors receiving approval.

Poor auditability of decision reasoning.

2.4 Problem Summary

The fundamental problem is not document retrieval. The real challenge is orchestrating an investigation that dynamically decides what information should be collected, how much evidence is sufficient, when additional investigation should occur, and when humans should intervene. This POC addresses these challenges using a multi-agent workflow instead of a single AI prompt.


3. Proposed Solution

3.1 Solution Summary

AutonoSource is an AI-powered Procurement Risk and Vendor Intelligence Platform designed to automate the vendor evaluation process using a stateful multi-agent workflow built with LangGraph. The workflow begins with a Planner Agent, which determines the required investigation depth based on vendor characteristics such as previous business history and deal value.

Depending on the investigation plan, the Executor Agent gathers evidence from multiple heterogeneous sources, including structured vendor records, procurement contracts retrieved through hybrid Retrieval-Augmented Generation combining a vector database and a knowledge graph, regulated price reference data, and external information such as vendor compliance status and public litigation records through web search APIs.

The collected evidence is analyzed by the Risk Scorer Agent, which evaluates financial risk, compliance risk, contractual risk, and pricing risk, while generating a confidence score reflecting the completeness of the available evidence. The Critic Agent validates whether sufficient evidence exists to support the conclusion, triggering additional evidence-gathering cycles when confidence is below threshold, bounded by a revision limit. A Report Writer Agent then generates a structured procurement report, and a mandatory Human Approval stage ensures procurement officers retain final authority.

3.2 Key Features

1. Multi-Agent Workflow Orchestration

The system employs multiple specialized AI agents instead of a single LLM prompt. LangGraph orchestrates the interaction between these agents using a shared workflow state.

2. Intelligent Multi-Source Evidence Retrieval (Updated)

The platform integrates multiple retrieval mechanisms to build a comprehensive evidence bundle:

Structured Data: Vendor profiles, financial information, procurement history, compliance records, and (new) regulated price reference data.

• Unstructured Data (updated): Procurement contracts and regulatory documents retrieved through a hybrid of Vector RAG (ChromaDB similarity search) and Graph RAG (a NetworkX property graph of extracted entities and relationships), merged through a fusion step described in Section 3.3.

External Intelligence: Public news, litigation records, regulatory notices, and compliance information collected through web search APIs.

3. Self-Critique and Confidence-Based Decision Making

The Critic Agent validates whether the confidence level produced by the Risk Scorer is sufficient to support the recommendation. If evidence is incomplete or uncertain, the workflow automatically initiates another investigation cycle.

4. Human-in-the-Loop Approval

Before completing the workflow, the generated report is presented to a procurement officer for review. The system cannot finalize or execute procurement decisions without explicit human approval.

5. Regulated Pricing Compliance Check (New)

The Risk Scorer Agent now compares the vendor's quoted price against a regulated ceiling-price reference dataset (e.g. an NPPA/DPCO-style price compendium in domains where such regulation applies) and raises a pricing risk flag when the quote exceeds the applicable ceiling, or when no reference price can be found (indeterminate pricing risk, which reduces overall confidence rather than being silently ignored).

3.3 Architecture Overview (Updated)

The proposed solution follows a stateful multi-agent architecture implemented using LangGraph. The architecture begins when procurement details are submitted to the system. The Planner Agent evaluates inexpensive structural signals to determine whether a LIGHT or FULL investigation is required.

The Executor Agent then gathers information from multiple heterogeneous sources. For unstructured regulatory and contract content, the Executor now runs two retrievers in parallel: a Vector RAG retriever (ChromaDB similarity search over embedded document chunks) and a Graph RAG retriever (NetworkX traversal over a property graph of entities and relationships extracted from the same documents). Their results pass through a fusion and contradiction-check step before being added to the evidence bundle. This step is described in detail below.

Hybrid RAG Fusion Mechanism (New Sub-Component)

The fusion mechanism resolves the case where the vector retriever and the graph retriever return conflicting facts (for example, two different numeric thresholds for the same regulatory question) rather than silently picking one or averaging them. It proceeds in four steps:

Step 1 — Normalize retriever scores to [0,1]. Vector RAG uses cosine similarity from ChromaDB (already ~[0,1]). Graph RAG uses graph_score = 1 / (1 + shortest_path_length), so a directly connected fact scores 1.0 and a fact two hops away scores 0.5.

Step 2 — Weight by source reliability. Each source document is assigned a priority weight from an explicit source-priority table (e.g. primary regulation outweighs general guidance). Final per-fact score = retriever_score × source_weight.

Step 3 — Contradiction detection. Retrieved facts are clustered by query-slot similarity; disagreement within a cluster is flagged when values differ beyond a defined threshold. The highest-scoring fact is kept as primary, and the runner-up is retained with an explicit conflicts_with pointer rather than discarded.

Step 4 — Overall confidence. overall_confidence = weighted_avg(top-ranked facts) × (1 − contradiction_penalty), where contradiction_penalty scales with the number of unresolved conflicts remaining.

Implementation status: designed with concrete, computable steps; not yet implemented as code or benchmarked against a vector-only baseline. This is tracked as an open engineering item (Section 7.1, item 8).

The Risk Scorer Agent analyzes the collected evidence — including the fused, contradiction-checked context and the pricing reference lookup — to estimate financial, compliance, contractual, and pricing risks, while assigning a confidence level. The Critic Agent validates this confidence, looping the workflow back to the Executor Agent when evidence is insufficient, bounded by a revision counter. The Report Writer Agent then generates the procurement assessment, and a mandatory Human Approval stage precedes workflow termination.

3.4 System Components (Updated)

Component

Description

Frontend

A Streamlit-based dashboard (planned for the production version) for submitting vendor information, reviewing risk reports, and recording approval decisions.

Backend

Python, using LangGraph for workflow orchestration and LangChain for agent implementation, prompt management, tool integration, and state management.

Database

MongoDB stores structured procurement data — vendor profiles, transaction history, compliance records, and (new) the regulated price reference dataset.

AI Models

Google Gemini performs reasoning, planning, report generation, and (new) LLM-based triple extraction for Graph RAG construction. Google Embedding Models generate vectors for semantic contract retrieval.

Vector Storage

ChromaDB stores contract and regulation embeddings for Vector RAG.

Graph Storage (New)

A NetworkX property graph stores entities and relationships extracted from the same source documents, persisted to GraphML, queried by the Graph RAG retriever.

Cloud Services

Google AI Studio provides hosted LLM inference for Gemini models. Future deployments may use Google Cloud Platform.

Authentication

User authentication and role-based access control are planned for future implementation.

Monitoring

LangSmith will be integrated to trace workflow execution, monitor agent interactions, and evaluate performance.

3.5 Technology Stack (Updated)

Category

Technology

Frontend

Streamlit (planned for full implementation)

Backend

LangGraph, LangChain

Programming Language

Python 3.11+

Database

MongoDB

Vector Database

ChromaDB

Graph Store (New)

NetworkX (MultiDiGraph, persisted as GraphML)

Large Language Model

Google Gemini

Embedding Model

Google Embedding Model

Reference Data (New)

Regulated price reference dataset (e.g. NPPA/DPCO-style ceiling prices), ingested into MongoDB

Cloud Platform

Google AI Studio / Google Cloud Platform

Web Search Tool

Tavily Search API (or SerpAPI as an alternative)

Monitoring & Observability

LangSmith


4. Workflow

The AutonoSource platform follows a stateful, multi-agent workflow orchestrated using LangGraph. Each agent performs a specialized task while sharing information through a centralized workflow state. Steps 1, 2, 5–10 are unchanged from v1.0; Steps 3 and 4 are updated below to reflect the hybrid retrieval and pricing check.

Step 1: Procurement Request Submission

The workflow begins when a procurement officer submits a vendor evaluation request (vendor name, deal size, contract document, procurement details). These details are validated and stored in the workflow state.

Step 2: Planner Agent — Investigation Planning

The Planner Agent analyzes inexpensive structural signals (vendor history, deal size, initial compliance indicators) to select a LIGHT or FULL investigation strategy.

Step 3: Executor Agent — Multi-Source Evidence Collection (Updated)

Structured Data

Vendor profile, procurement history, financial records, compliance database

Regulated price reference data (New) — ceiling/reference prices for the relevant product or service category

Internal Unstructured Data — Hybrid RAG (Updated)

Rather than a single vector retriever, the Executor runs two retrievers in parallel over the same procurement contracts and regulatory documents:

Vector RAG: ChromaDB similarity search identifies the most relevant passages by embedding distance.

Graph RAG (New): NetworkX traversal over a property graph of entities and relationships (e.g. clause → obligation → threshold) extracted from the same documents.

The two result sets are merged through the fusion and contradiction-check mechanism described in Section 3.3, producing a ranked, provenance-tagged context object that flags any disagreement between the two sources instead of silently resolving it. This context is used to identify risky clauses such as auto-renewal, unlimited liability, missing SLAs, or weak termination conditions — now with an explicit confidence and conflict trail per fact.

External Intelligence

Litigation history, regulatory violations, vendor reputation, compliance news (via web search)

All retrieved information — structured, hybrid-RAG, and external — is consolidated into a structured evidence bundle.

Output: Evidence Bundle (now including a pricing reference and a fused, contradiction-checked regulatory context)

Step 4: Risk Scorer Agent — Risk Assessment (Updated)

The Risk Scorer Agent analyzes the evidence bundle and generates a structured procurement risk assessment covering:

Financial Risk

Compliance Risk

Contract Risk

• Pricing Risk (New) — flags the vendor's quoted price against the regulated ceiling price retrieved in Step 3; marked indeterminate (with reduced confidence) if no reference price is found rather than silently omitted

Overall Risk Level, Confidence Score, and Supporting Rationale

As in v1.0, the confidence score reflects whether the available evidence is sufficient to support the recommendation, not the severity of the risk itself. Any unresolved contradiction flagged during fusion (Step 3) directly lowers this confidence score.

Step 5: Critic Agent — Self-Validation

Unchanged from v1.0. The Critic Agent evaluates whether sufficient, reliable evidence exists to justify the recommendation; if not, the workflow loops back to Step 3.

Step 6: Iterative Evidence Gathering

Unchanged from v1.0.

Step 7: Revision Limit Enforcement

Unchanged from v1.0. A revision counter bounds the number of Critic-triggered investigation cycles.

Step 8: Report Writer Agent

Unchanged in mechanism; the generated report now additionally includes the Pricing Risk finding and, where applicable, a note on any contradiction detected and resolved during hybrid RAG retrieval, alongside the existing Vendor Summary, Financial Assessment, Compliance Findings, Flagged Contract Clauses, Evidence Summary, Confidence Level, Risk Explanation, and Procurement Recommendation.

Step 9: Human Approval

Unchanged from v1.0. The procurement officer approves, rejects, or requests further investigation.

Step 10: Workflow Completion

Unchanged from v1.0. Vendor information, risk assessment, recommendation, human decision, timestamp, and investigation history are recorded for audit.


5. Target Audience

Primary Users

Business Users, Operations Team, Customers, Analysts, Administrators

Secondary Stakeholders

Management, Product Team, Engineering Team, IT Team, Decision Makers

6. Models and APIs Used

6.1 AI Models

Model

Purpose

Provider

Gemini

Reasoning, planning, risk assessment, report generation, agent decision-making, and (new) triple extraction for Graph RAG construction

Google

Google Text Embedding

Vector embeddings for procurement contracts and regulatory documents (semantic search / Vector RAG)

Google

Pydantic AI Models

Structured input/output schemas and LangGraph state management

Pydantic

6.2 External APIs and Data

API / Dataset

Purpose

Google AI Studio API

Access to Gemini for agent reasoning and report generation

Tavily Search API

External vendor intelligence, compliance information, litigation records, and recent news

ChromaDB API

Semantic retrieval of procurement contracts and regulations via vector similarity search

Regulated Price Reference Dataset (New)

Ceiling/reference pricing data used by the Pricing Risk check in the Risk Scorer Agent

LangSmith API (Planned)

Monitors agent execution, traces workflows, and evaluates system performance

6.3 Frameworks and Libraries

Framework / Library

Purpose

LangGraph

Orchestrates the multi-agent workflow with branching, looping, and state management

LangChain

Builds AI agents, tool integrations, and prompt pipelines

ChromaDB

Stores and retrieves vector embeddings

NetworkX (New)

Builds and traverses the property graph used by Graph RAG

Pydantic

Defines structured state objects and validates inter-agent data

MongoDB

Stores structured procurement, vendor, and pricing reference data

Streamlit (Future)

User interface for procurement officers and human approval


7. Success Criteria

7.1 Functional Success (Updated)

1. Planner Agent Executes Correctly

Success Indicator: Correct investigation plan selected based on predefined business rules.

2. Multi-Source Evidence Retrieval

Success Indicator: Vendor information retrieved from the database; relevant contract clauses retrieved through hybrid RAG; external vendor intelligence fetched via web search; pricing reference data retrieved when applicable.

3. Risk Assessment Generation

Success Indicator: Structured risk report generated, including the new Pricing Risk field; confidence score assigned; procurement recommendation produced.

4. Critic Agent Validation

Success Indicator: Low-confidence assessments trigger the feedback loop; high-confidence assessments proceed to report generation; revision count correctly tracked.

5. Conditional Workflow Execution

Success Indicator: Dynamic branching and revision loops function correctly; workflow terminates at the maximum revision limit.

6. Human Approval Integration

Success Indicator: Human approval stage reached successfully; final decision recorded only after approval.

7. End-to-End Workflow Completion

Success Indicator: Entire LangGraph workflow completes successfully; all agents exchange state correctly; procurement report generated.

8. Hybrid RAG Fusion Executes Correctly (New)

Vector RAG and Graph RAG both return results for a given query; the fusion step produces a ranked context object; contradictions between the two sources are detected and flagged with a resolution rationale rather than silently dropped.

Status: not yet implemented or benchmarked — tracked as the primary open engineering item for this version.

9. Pricing Compliance Check Executes Correctly (New)

The Risk Scorer correctly flags vendor quotes exceeding the applicable regulated ceiling price, and correctly marks Pricing Risk as indeterminate (with reduced confidence) when no reference price is found.

Status: not yet implemented — internal logic (deterministic lookup vs. RAG-based interpretation) not yet decided.

7.2 Performance Metrics (Updated)

Metric

Description

Target Value

Response Time

Total time to complete the procurement workflow from request to report

< 15 seconds

Latency

Average execution time per agent

< 2 seconds

Risk Classification Accuracy

Correct classification per predefined risk categories

≥ 90%

Precision

Percentage of flagged risky vendors that are actually risky

≥ 90%

Recall

Percentage of actual risky vendors correctly identified

≥ 90%

F1 Score

Harmonic mean of Precision and Recall

≥ 90%

Workflow Success Rate

Workflows completed without execution failures

100%

Evidence Retrieval Accuracy

Relevant information successfully retrieved

≥ 95%

Fusion Contradiction Detection Rate (New)

Percentage of known conflicting-fact test cases correctly flagged by the fusion step

Target ≥ 90% (not yet benchmarked)

Pricing Check Accuracy (New)

Percentage of test quotes correctly classified against ceiling price data

Target ≥ 95% (not yet benchmarked)


8. Validation

8.1 Validation Approach

Validation focuses on individual agent performance, correctness of workflow execution, and — new in this version — the correctness of the hybrid RAG fusion mechanism and the pricing compliance check, once implemented. As with v1.0, a synthetic procurement dataset is used rather than production records.

8.2 New Validation Cases (v2.0)

Test Case

Expected Behavior

Vector RAG and Graph RAG agree

Fusion returns the agreed fact with high combined confidence and no contradiction flag.

Vector RAG and Graph RAG disagree

Fusion flags the contradiction, selects the higher-weighted source as primary, and retains the runner-up with a conflicts_with reference.

Graph RAG returns no path

Fusion falls back to Vector RAG results only, with confidence reflecting single-source retrieval.

Vendor quote within ceiling price

Pricing Risk marked low; no flag raised.

Vendor quote exceeds ceiling price

Pricing Risk flagged; Report Writer includes the ceiling price and the excess amount.

No reference price found for category

Pricing Risk marked indeterminate; overall confidence reduced rather than the check being silently skipped.

8.3 Failure Cases (Updated)

Failure Case

Expected System Behavior

Vendor record not found

Notify the user and terminate the workflow gracefully.

Contract document missing

Skip contract analysis and reduce confidence score.

Insufficient evidence collected

Critic Agent triggers another evidence-gathering cycle.

External API unavailable

Continue workflow using available internal data and report reduced confidence.

Graph RAG and Vector RAG conflict unresolved (New)

Fusion step surfaces both facts with the contradiction flag; Risk Scorer treats the fact as lower-confidence rather than silently picking one.

Reference price data unavailable (New)

Pricing Risk marked indeterminate; noted explicitly in the final report rather than omitted.

Maximum revision limit reached

Proceed with the best available assessment and recommend human review.

Invalid user input

Validate input and request corrections before starting the workflow.

8.4 Risk Assessment (Updated)

Risk

Impact

Mitigation

Hallucinated AI responses

Incorrect procurement recommendations

Validate outputs using the Critic Agent and evidence-based reasoning

Incomplete evidence retrieval

Risk assessments based on insufficient information

Confidence scoring and iterative evidence collection

Poor contract retrieval

Important contract clauses may be missed

Improve embeddings and optimize ChromaDB retrieval; cross-check against Graph RAG

Unresolved graph/vector contradiction (New)

A regulatory fact could be reported with false certainty

Fusion step explicitly flags and surfaces contradictions rather than silently resolving them

Incomplete price reference data (New)

Pricing risk may be under- or over-reported

Mark as indeterminate and reduce confidence rather than assume compliance

Infinite workflow loop

System resources may be exhausted

Enforce a maximum revision limit

External API failure

Vendor intelligence may be incomplete

Retry mechanisms and fallback to internal data sources


9. Conclusion

The AutonoSource Proof of Concept demonstrates that procurement risk evaluation is fundamentally a multi-step decision-making process rather than a simple question-answering task. The original architecture — Planner, Executor, Risk Scorer, Critic, Report Writer, and mandatory Human Approval, orchestrated through LangGraph — remains the foundation of the system in this version.

This version extends that foundation with two capabilities: a hybrid Vector + Graph RAG retrieval mechanism with an explicit fusion and contradiction-check step, closing the gap where the previously isolated Graph RAG component was not yet wired into live retrieval; and a regulated pricing compliance check, extending risk assessment to a fourth dimension — pricing — that the original scope did not address.

Both additions are documented at a concrete design level — including a defined four-step scoring formula for fusion and specific test cases for validation — but neither has been implemented as code or benchmarked against a baseline as of this document's version. This is stated plainly so the document reflects the actual current state of the project rather than implying completed work.

The Proof of Concept continues to validate dynamic workflow branching, multi-source evidence retrieval, confidence-based self-validation, iterative reasoning with bounded revision loops, and human-in-the-loop governance, and remains designed to evolve into a scalable enterprise-grade procurement intelligence platform without requiring architectural changes.

Document generated as a working session record reconciling the original POC document with subsequent design changes. All new components described are design-level and pending implementation and benchmarking.

