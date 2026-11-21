# Shipment tracking: proposal and prototype rationale

## 1. Problem and scope

An industrial manufacturer ships from three sites (Zaragoza, Valencia, Bilbao) through several road and sea operators. Today, tracking a shipment means checking operator portals, emails and phone calls. The product's value is in three places:

- **Normalising** heterogeneous operator data into one status vocabulary.
- **Being honest** about what is confirmed and what is estimated.
- **Managing by exception**, so nobody has to chase shipments one by one.

**What the prototype goes deep on:**

- **Normalisation.** Four raw formats are adapted in the frontend to one model: a DHL-Unified-shaped road JSON (with each operator's own status vocabulary, one of them in Spanish), DCSA Track & Trace for sea, Terminal49 for port and customs, and free-text email read by AI.
- **Multimodal shipments.** A shipment is a chain of legs (road → sea → port → road), each with its own milestones. A per-leg state machine decides event order.
- **Reliability rules.** Only `ACTUAL` events move a status. An ETA comes only from an operator and always shows its source. Unknown codes stay `NOT_MAPPED` and are never guessed.
- **Two roles.**
  - **Ops (`/ops`):** a portfolio across sites, with filters by exception and the next action proposed for each shipment.
  - **Customer and subsidiary (`/customer`, `/subsidiary`):** self-service, with plain wording, a proactive notice banner and documents.

**What is left out, deliberately:** login, backend, real ingestion, a real LLM, sending emails, air and rail, a system-predicted ETA and natural-language search. Each is either not needed to demonstrate the value, or would undermine trust in a prototype with no real data (predicted ETA). Seven synthetic shipments cover one scenario each: on time, not departed with a missing document, an AI-read breakdown, stale, customs hold, at sea with only a next-stop ETA, and delivered.

## 2. Where AI goes, and why there

The principle: **AI reads unstructured text; deterministic rules decide.** Logistics data is safety-critical for customer trust. A status or ETA that the system made up is worse than "not known yet".

| Where | What the AI does | Human control | Why |
| --- | --- | --- | --- |
| Operator emails (incidents, customs-agent messages) | Extracts milestone, date, place and a new ETA, each with confidence and the supporting quote | Ops accepts or rejects. Until then, the read changes nothing and is invisible to the customer | Email is where the exceptions live today. Structured feeds rarely carry incidents |
| Low-confidence or unknown text | Confidence < 0.7 or no milestone → `NOT_MAPPED`, shown to ops with the raw text | Ops contacts the operator | The system never fills a gap with a guess |
| (Phase 2) PDF notices, unknown formats | Same extraction and review flow | Same | Same value, more inputs |

**How it is presented:**

- An AI-read step is marked "AI-read 82%".
- It shows the quoted sentence, a "Read as" summary and a link to the original email.
- A new date from the email appears as an *alternative* next to the operator ETA. It replaces the ETA only once ops accepts it, and the old ETA stays struck through.
- "Notify customer" is blocked until the read is reviewed, so a customer is never told something unverified.
- After acceptance, the customer sees a normal confirmed update with no AI mark, sourced simply as "Email".

**What AI deliberately does not do:** decide incidents, tone, the next action or customer notices. These come from explicit rules (delay against the plan or commitment, stale thresholds of 24 h for road and 72 h for sea, holds, missing mandatory documents). They have to be explainable, testable and identical for every user. An AI-decided next action and a predicted ETA were considered and dropped for the same reason.

**Taking it to production:**

- Replace the mock `interpretText` with an LLM call that uses structured output (a JSON schema over the milestone enum, ISO dates, confidence and the quote).
- Validate the output before anything is stored: the quote must exist in the email, the date must be plausible, and the milestone must fit the leg's mode.
- Calibrate the confidence threshold on labelled operator emails.
- Log every accept and reject. Those decisions are the evaluation set, and later the training data for corrections (see limitations).
- Run the read asynchronously at ingestion, not in the UI.

## 3. System approach

```
operator feeds / mailbox → adapters → normalised events → state machine per leg → rules → view model → UI
```

**In the prototype** all of this runs in the browser from fixtures. The domain (`src/domain/`) is pure TypeScript with no React, so the same code can move to a backend unchanged:

- **Adapters:** one per format. They map only documented codes; everything else becomes `NOT_MAPPED`, with the raw value kept.
- **State machine:** milestones have ranks. A leg's status only moves forward. Older events go to history, out-of-order events are ignored and shown to ops, and duplicates collapse into one step with several sources. An `ACTUAL` event on the next leg closes the current one.
- **Rules:** ETA, delay ("+N d" in calendar days, or "Overdue"), stale, tone, incidents, actions, filter tags and customer notice. Each has a deterministic condition.
- **View model:** one `ShipmentView` per shipment, plus a separate customer projection. The projection never contains AI marks, unknown codes, ignored events, actions or raw email. The perimeter is applied before anything is rendered.

**Technology choices (prototype):**

- Vite, React, TypeScript, Tailwind: the fastest path to a polished, typed UI.
- TanStack Router: typed file routes, one per role.
- Zustand: one store holding the derived views by id, where each action recomputes only its shipment.
- Vitest: tests on the logic where errors would cost trust: adapters, every state-machine case, and a golden test of all seven shipments.
- No component library. A small in-house design system keeps the look consistent.
- All text is in i18n files, so a second language is one new file.

**Final product:**

- **Ingestion service:** operator APIs polled or via webhooks, DCSA T&T subscriptions, Terminal49 webhooks, and a dedicated mailbox for emails and PDFs. Raw payloads are stored unchanged, so events can be re-normalised whenever the mapping improves.
- **Event store and projection:** the same adapters, state machine and rules running server-side, producing a shipment projection per role.
- **Freshness:** the server pushes changes to open clients (SSE or WebSocket). A stale rule raises an incident when an operator goes silent, so a quiet feed never looks like good news.
- **Notifications:** customer notices are generated from the same rules. Real sending (email, push) needs opt-in per account.
- **Access:** SSO for internal users, with a perimeter by site, account and role enforced in the API. Invitation-based accounts for customers and subsidiaries.
- **Integrations by priority:** the existing road operators' APIs, sea carriers via DCSA, the port terminal, the customs agent's email, then EDI X12 315 and aggregators (Vizion, AfterShip) to widen coverage.

## 4. Assumptions

- Every shipment has an internal record (planned milestones, documents, customer account, origin site). This is the baseline that delay is measured against.
- Operators can be reached through at least one of: an API, a DCSA feed, a terminal API or email.
- The DeCA is mandatory only on contracted domestic road legs. The e-CMR is optional.
- One account per customer or subsidiary. Internal users in the prototype see all three sites.

## 5. Known limitations (prototype)

- Routes are open (no login). Data and AI are mocked. The clock is fixed at 22 Nov 2026 10:40. Session state is lost on reload.
- AI reads can only be accepted or rejected, not edited. A wrong date means rejecting the read and losing it.
- A single Terminal49 snapshot can't show a hold being lifted. Only an operator event lifts a hold.
- "Notify customer" and "Contact operator" only record the action; nothing is sent. "Open document" has no file behind it.
- Internal users are not yet limited by site; `/ops` is the global user.

## 6. Prioritised next steps

1. **Ingestion and persistence** for the existing operators, plus the DCSA subscription. Without these, nothing is real.
2. **Real AI reading** with structured output, validation and an audit log of reviews.
3. **Editable AI reads:** let ops correct a field before accepting. Store each correction (original, corrected value, source text, who, when), and track per pattern how often the AI was confirmed or corrected.
4. **Site-level perimeters** for internal users (for example a Valencia-only user), enforced by the API.
5. **More inputs:** PDF notices, EDI 315, transshipments, unknown formats stored raw and read by AI, never discarded.
6. **Real notifications** to customers, with preferences, on the existing notice rules.
