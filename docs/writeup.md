# Shipment tracking: proposal and prototype rationale

## 1. Scope

**In the app:**

- **Three views:** `/ops` (portfolio across sites, exception filters, next action per shipment, AI review) and `/customer` and `/subsidiary` (own shipments, plain wording, proactive notice).
- **Seven synthetic shipments**, one scenario each: on time with an unrecognised status, not departed with a missing document, breakdown email with a pending AI read, stale, customs hold, at sea with only a next-stop ETA, and delivered.
- **Four raw formats** normalised to one model: DHL-shaped road JSON, DCSA T&T, Terminal49 and email read by AI.

**Left out, and why:**

- **Air transshipments:** road and sea combined in one shipment already show the multimodal problem so other transports are left out.
- **Internal users by site:** the API already filters ops by site, but the demo has a single global ops user. Site-level users depend on real authentication (next step 3).
- **Automatic refresh and real notifications:** data is fetched fresh on every visit, but there is no polling, and "Notify customer" only records the action. See sections 4 and 10.

## 2. System approach

```
raw feeds + emails
  → API            role perimeter
  → adapters       one per format; AI reads email; unknown → NOT_MAPPED
  → state machine  order and status; pending AI skipped
  → rules          ETA, delay, stale, incidents, actions
  → ShipmentView   per audience → UI
```

**The domain** (`src/domain/`) is pure TypeScript, with no React and no network:

- **Adapters:** one per format. Only documented codes are mapped, and the raw value is kept.
- **State machine:** a leg's status only moves forward. Older events go to history, out-of-order events are ignored, and duplicates merge into one step with several sources.
- **Rules:** deterministic conditions only. No AI decides incidents, actions or notices.
- **View:** the customer projection never contains AI marks, unknown codes, ignored events, actions, documents or raw email.

## 3. A real backend

On this prototype all data transformations happen on the frontend side. On a real-life app I would advocate a backend that polls the operator data and transforms it to a standard type that is served ready to consume by the client.

If this BFF style with data transformation on the backend was not viable, a Next.js app handling data transformations server side could do a good job unloading this complexity from the browser and improving perceived performance.

## 4. Real-time updates

For real-time updates I would initially implement polling on the frontend, due to its simple implementation (with TanStack Query it is just one extra line of config) and its simple maintainability and debugging. This option needs close monitoring of the request volume. If the number of requests became an issue, I would suggest caching responses on the server side, invalidating them when data changes. I would consider an SSE architecture if updates were neither frequent nor predictable in time and polling was causing issues on the server side.

## 5. Stack choices

- **Vite, React, TypeScript:** these are industry standards, solid for building an SPA. It is easy to maintain, there is no server/client boundary to handle, and it works well with interaction.
- **Tailwind:** easy and quick for AI to write in order to build this prototype.
- **No component library.** A small in-house design system is cheap to build using AI with no design constraints.
- **TanStack Router:** typed file routes add an extra layer of type safety, with loaders to prefetch data.
- **Vitest:** tests on the logic where errors would cost trust: adapters, every state-machine case, and a golden test of all seven shipments.
- All text is in i18n files, so a second language is one new file.

## 6. Why TanStack Query

TanStack Query is a specific and powerful tool that may not be fit for every single challenge. Here I opted for it because:

- There is no need to sync server and client state manually with a state manager (e.g. Zustand).
- Easy implementation of polling, just by configuring the `refetchInterval` option, and of refetching with tag invalidation when needed.
- TanStack selectors allow consuming data directly in the component that needs it, without prop drilling, and help keep re-renders constrained to relevant data changes.

TanStack Query caches data by default, which is against the needs of our board. The default behaviour has been overridden and data is considered stale on arrival.

## 7. AI use and integration proposal

AI is proposed to interpret email sources. Since one of the strongest points of LLMs is interpreting natural language, AI is used to cover this key task of the scope, which could not be covered with a more deterministic approach.

A safety net is implemented where the AI-interpreted texts are only displayed to the ops role (`/ops`) to complete a review. They have an interactive option to accept or reject the update interpreted by AI. Once validated, it is displayed for other users.

**Integration.** In production, `interpretText` becomes an LLM call with structured output (milestone, date, confidence, supporting quote), run asynchronously at ingestion. The output is validated before it is stored (the quote exists in the email, the date is plausible), and every accept and reject is logged to measure accuracy.

## 8. Assumptions

- Every shipment has an internal record (planned milestones, documents, customer account, origin site). This is the baseline that delay is measured against.
- Operators can be reached through at least one of: an API, a DCSA feed, a terminal API or email.
- The DeCA is mandatory only on contracted domestic road legs. The e-CMR is optional.
- One account per customer or subsidiary.

## 9. Known limitations

- **Fixed clock.** "Now" is 22 Nov 2026 10:40 (Madrid).
- **A customs hold can't be lifted from the terminal feed.** A single Terminal49 snapshot can't show a hold being removed. Only a later operator event moves the shipment on.
- **Stale thresholds are fixed per mode** (24 h road, 72 h sea), not per operator or route.
- **Sorting is fixed:** worst incident first, then ETA. Other orders, such as most recently updated, could be useful.
- **Documents have no files.** "Open document" is inert.

## 10. Prioritised next steps

1. **Backend integration:** ingest operator APIs, DCSA, Terminal49 and a mailbox.
2. **Server-side transformation**, with filtering, sorting and pagination (section 3).
3. **Authentication and perimeters:** SSO, invited customer accounts and site-level users.
4. **Polling** (section 4).
5. **Real AI integration** (section 7).
6. **Editable AI reads:** ops corrects a field before accepting.
7. **Real notifications and actions:** "Notify customer" and "Contact operator" actually send.
8. **More inputs:** PDF notices and more operators.
