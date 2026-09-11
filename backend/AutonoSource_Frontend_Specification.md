# AutonoSource (pharmProcure) — Frontend Specification

**Purpose:** This document describes the existing frontend architecture so that any team member can pick up development without re-discovering the structure by reading every file. It reflects what's already built in the repo, plus the gaps that still need work.

---

## 1. Stack

React 18 + Vite + TypeScript + Tailwind CSS. State/data-fetching is hook-based (no Redux/Zustand observed in the explored structure) — polling-driven via `useProcurementStatus`.

---

## 2. Directory structure (as it exists in the repo)

```
frontend/
├── src/
│   ├── router.tsx                       # route definitions
│   ├── api/
│   │   ├── client.ts                    # base API client instance
│   │   ├── httpClient.ts                # underlying fetch/axios wrapper, error handling
│   │   ├── types.ts                     # TypeScript mirrors of backend Pydantic schemas
│   │   ├── procurement.ts               # calls to /procurement/*
│   │   ├── approval.ts                  # calls to /approval/*
│   │   └── errors.ts                    # error type definitions / handling
│   ├── pages/
│   │   ├── SubmitRequest/
│   │   │   ├── SubmitRequestPage.tsx
│   │   │   └── SubmitRequestForm.tsx
│   │   ├── VendorReview/
│   │   │   └── VendorReviewPage.tsx
│   │   ├── ApprovalQueue/
│   │   │   └── ApprovalQueuePage.tsx
│   │   └── Dashboard/
│   │       └── DashboardPage.tsx
│   ├── components/
│   │   ├── EvidenceTrail.tsx            # renders RankedContext (facts + contradictions)
│   │   └── RiskBreakdown.tsx            # renders RiskAssessment (4 risk dimensions)
│   ├── hooks/
│   │   └── useProcurementStatus.ts      # polls GET /procurement/{id}/status every 1.5s
│   └── context/
│       └── AuthContext.tsx              # auth scaffolding — currently minimal/planned
```

---

## 3. Page-by-page contract

### 3.1 SubmitRequestPage / SubmitRequestForm
**Purpose:** vendor submission entry point.

**Fields (must match backend's `POST /procurement/submit` multipart contract exactly):**
- `vendorName` (string, min 3 chars)
- `dealSize` (number, > 0)
- `procurementDetails` (string, min 15 chars)
- `investigationPlan` (`LIGHT` | `FULL`, default `FULL`)
- `contractDocument` (optional file upload — PDF/DOCX)

**On submit:** calls `procurement.ts`'s submit function → receives `SubmitProcurementResponse` (`procurementId`, initial `WorkflowStatus`) → navigate to VendorReviewPage with the returned `procurementId`.

**Still needed / verify:** client-side validation should mirror backend validation exactly (min-length checks) so the user gets instant feedback rather than waiting for a 422 response.

### 3.2 VendorReviewPage
**Purpose:** shows live workflow progress, then the final report once ready.

**Behavior:**
- Uses `useProcurementStatus(procurementId)` to poll `GET /procurement/{id}/status` every 1.5s.
- While `status.stage` is not `AWAITING_APPROVAL` or `COMPLETE`, render a progress indicator keyed to the current stage (`PLANNING` → `EXECUTING` → `SCORING` → `CRITIQUING` → `WRITING_REPORT`). Each stage should have a distinct visual state — this is where `revisionCount` should also be surfaced (e.g. "Revision 2 of 3") so the user can see the Critic loop happening, not just a generic spinner.
- Once `AWAITING_APPROVAL` or `COMPLETE`, fetch `GET /procurement/{id}/report` and render via `RiskBreakdown` and `EvidenceTrail`.
- On `FAILED` stage, display `status.failureReason` clearly rather than a generic error.

### 3.3 RiskBreakdown component
**Renders the `RiskAssessment` object.** Needs four clearly separated sections (Financial, Compliance, Contract, Pricing), each showing `RiskItem.level` (color-coded LOW/MEDIUM/HIGH) and `RiskItem.rationale`. The Pricing section is a special case — it uses `PricingRisk`, not `RiskItem`, and must render three possible states distinctly: `WITHIN_CEILING`, `EXCEEDS_CEILING` (show `ceilingPrice`, `quotedPrice`, `excessAmount`), and `INDETERMINATE` (this must be visually distinguishable from "compliant" — do not let `INDETERMINATE` look like a pass; it should read as "unable to verify," e.g. gray/amber, not green).

**Also render:** `overallRisk` and `confidenceScore` prominently at the top of the report — `confidenceScore` should be explained in the UI (a tooltip or subtext) as "evidence completeness," not risk severity, since these are easy to conflate visually.

### 3.4 EvidenceTrail component
**Renders the `RankedContext` object** — this is the component that makes the fusion mechanism's output visible to a human reviewer, and it's arguably the most important UI surface in the whole app for building trust in the system.

**Must show, per fact in `facts: List[RankedFact]`:**
- The fact's `text`
- Its `source` (vector or graph) — visually distinguish these two, e.g. a small badge or icon
- `finalScore`
- If `isPrimary`, mark it as the accepted answer
- If `contradictionFlag` is true, **do not hide the fact** — show it alongside its primary counterpart (via `conflictsWith`) with a clear "conflicts with" link/expander, so the reviewer can see both sides of a disputed fact, not just the winner
- If `fallbackToVectorOnly` is true at the top level, show a small notice that graph retrieval returned nothing for this query, rather than silently presenting vector-only results as if fusion ran normally

### 3.5 ApprovalQueuePage
**Purpose:** lists all `PendingApprovalItem`s (`GET /approval/pending`) for a procurement officer to act on.

**Per item, show:** `vendorName`, `dealSize`, `overallRisk`, `confidenceScore`, `investigationPlan`, `summary`.

**Actions:** `APPROVE`, `REJECT`, `REQUEST_MORE_INFO` — each calls `POST /approval/{id}/decide`. Enforce client-side that `reason` is required for `REJECT` and `REQUEST_MORE_INFO` (mirroring backend's 422 validation) so the officer isn't surprised by a rejected request after typing nothing.

**After decision:** remove the item from the pending list (optimistic update) and show a confirmation toast/state indicating the recorded decision.

### 3.6 DashboardPage
**Purpose:** overview of all procurement cases (`GET /procurement/all`), sorted by `createdAt` descending.

**Should show:** vendor name, deal size, current stage/status, `overallRisk` (once available), and a link into VendorReviewPage for any case regardless of its current stage (not just completed ones — a user should be able to click into an in-progress case and see it polling live).

**Filtering:** by status (in-progress / awaiting approval / complete / failed) is a natural addition here if not already present — check current implementation.

---

## 4. Cross-cutting concerns

### 4.1 Polling discipline
`useProcurementStatus` polls every 1.5s while a case is in progress. **Stop polling once the stage reaches `COMPLETE` or `FAILED`** — verify the hook actually clears its interval on these terminal states; a polling loop that never stops is a real, easy-to-miss bug that wastes backend load and battery on mobile.

### 4.2 Error handling (`errors.ts`)
Confirm distinct handling for at least these cases, since the backend spec defines specific error behaviors:
- 404 on `/procurement/{id}/report` while still in progress → should NOT be treated as a hard error in the UI; it means "not ready yet," and VendorReviewPage should keep polling status rather than showing an error screen.
- 422 on `/approval/{id}/decide` (missing reason) → surface as an inline form validation error, not a toast/global error.
- Network failure / backend unreachable → show a distinct "can't reach the server" state, different from "vendor not found."

### 4.3 AuthContext
Currently minimal per the explored structure — this is a known gap (matches the backend spec's note that authentication/RBAC is "planned for future implementation," not yet built). Do not block current feature work on this, but don't let API calls silently assume an authenticated user either — confirm what `decidedBy` currently defaults to when no real user session exists (backend defaults to `"Procurement Officer"` per the schema).

---

## 5. Frontend ↔ Backend contract — single source of truth reminder

`frontend/src/api/types.ts` and `backend/app/models/schemas.py` must stay in sync field-for-field (camelCase JSON both directions). **Whichever side changes a field first must update the other in the same commit** — this is the most common source of silent integration bugs in a two-sided contract like this, especially with three people working across frontend/backend/RAG tracks in parallel. Consider a shared schema-diffing check (even a simple script comparing key names) if the team starts hitting mismatches.

---

## 6. Open items for continued development

- [ ] Confirm `useProcurementStatus` clears its polling interval on terminal stages (Section 4.1)
- [ ] Verify `INDETERMINATE` pricing state is visually distinct from "compliant" in `RiskBreakdown` (Section 3.3)
- [ ] Confirm `EvidenceTrail` surfaces contradiction pairs rather than only showing the primary fact (Section 3.4) — this is the UI's most important honesty feature and easy to accidentally simplify away
- [ ] Decide and implement real authentication before this goes anywhere near production data (Section 4.3)
- [ ] Add stage-level progress detail (including `revisionCount`) to VendorReviewPage rather than a generic loading state (Section 3.2)
