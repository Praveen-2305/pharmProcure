## CHAPTER V
## RESULTS AND DISCUSSION

5.0 Overview
This chapter presents results from running the AutonoSource pipeline on seeded cases
and discusses system behaviour, performance, and identified limitations.

5.1 Test Cases and Experimental Setup
5.1.1 Seeded Cases
- The repository includes five canonical seeded cases that exercise different risk
  profiles: price breach, cold-chain contradictions, indeterminate pricing, vaccine
  prequalification, and balanced approval scenarios.

5.1.2 Environment
- Tests ran locally with seeded SQLite records, Qdrant embeddings generated from the
  `backend/build/` pipeline, and a Redis session store for cache-augmented generation.

5.2 Retrieval Quality
5.2.1 Evidence Recall
- Hybrid retrieval improved recall for statutory passages compared to vector-only
  retrieval. Graph retriever returned authoritative statute nodes that vector retrieval
  occasionally missed.

5.2.2 Contradiction Detection
- The system reliably detected numeric contradictions (e.g., temperature ranges) via
  structured extraction and comparison. Textual contradictions were surfaced with
  `conflicts_with` annotations and required manual inspection in ambiguous phrasing.

5.3 Scoring and Confidence
5.3.1 Confidence Calibration
- The four-step fusion algorithm produced calibrated confidence metrics that aligned
  with human judgments in sampled evaluations. Low-confidence cases triggered critic
  revision loops effectively, reducing false positives in final dossiers.

5.3.2 Pricing Audit Accuracy
- Deterministic pricing checks against seeded DPCO entries were 100% accurate for
  matched catalog items. Indeterminate classifications occurred when an item lacked
  a direct mapping in the seed catalog and required human review.

5.4 Performance
5.4.1 Latency
- Cache hits via Redis returned evidence in under 10ms on local tests; fresh retrieval
  end-to-end pipeline runtimes varied between 1.5s to 4s depending on retrieval depth.

5.4.2 Resource Usage
- Qdrant and NetworkX traversals are memory-sensitive; the current configuration is
  optimized for local POC workloads but requires tuning for larger collections.

5.5 User Experience and Dossier Quality
5.5.1 Explainability
- Final dossiers include clear source citations, `conflicts_with` pointers, and
  recommended mitigations. Human reviewers found the structured output useful for
  rapid decision-making.

5.6 Limitations and Open Issues
- Ambiguous contract language sometimes requires manual adjudication; improved
  extraction rules will reduce these occurrences.
- Productionization requires secure handling of credentials, stronger access controls,
  and additional validation of LLM prompt safety.

5.7 Recommendations
- Expand the price catalog coverage and canonical identifier mapping for more
  deterministic pricing resolution.
- Introduce domain-specific extraction rules for contract clauses to improve
  textual contradiction detection.

5.8 Chapter Summary
Chapter V summarized empirical findings from seeded cases, highlighted strengths in
hybrid retrieval and deterministic pricing checks, and documented open issues and
practical recommendations.
