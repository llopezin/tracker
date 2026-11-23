# Shipment tracking: proposal and prototype rationale

## 1. Scope

**In the app:**

- **Three views:** `/ops` (portfolio across sites, exception filters, next action per shipment, AI review) and `/customer` and `/subsidiary` (own shipments, plain wording, proactive notice).
- **Seven synthetic shipments**, one scenario each: on time with an unrecognised status, not departed with a missing document, breakdown email with a pending AI read, stale, customs hold, at sea with only a next-stop ETA, and delivered.
- **Four raw formats** normalised to one model: DHL-shaped road JSON, DCSA T&T, Terminal49 and email read by AI.

**Left out, and why:**

- **Air transshipments:** road and sea combined in one shipment already show the multimodal problem so other transports are left out.
- **Internal users by site:** the API already filters ops by site, but the demo has a single global ops user. Site-level users depend on real authentication (next step 3).
- **Automatic refresh and real notifications:** data is fetched fresh on every visit, but there is no polling, and "Notify customer" only records the action. Both need a real backend (sections 4 and 10).

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

- **Adapters:** one per format. They map only documented codes. Everything else becomes `NOT_MAPPED`, and the raw value is kept.
- **State machine:** milestones have ranks, and a leg's status only moves forward. Older events go to history. Out-of-order events are ignored and shown to ops. Duplicates collapse into one step with several sources. An `ACTUAL` event on the next leg closes the current one. A pending or rejected AI read never reaches it.
- **Rules:** ETA, delay ("+N d" in calendar days, or "Overdue"), stale, tone, incidents, actions, filter tags and customer notice. Each has a deterministic condition.
- **View:** `mapShipments` returns one `ShipmentView[]` per audience. The customer projection never contains AI marks, unknown codes, ignored events, actions, documents or raw email. Components only ever read `ShipmentView`.

**One door to the backend.** `src/api/client.ts` is the only way the app reaches data. Today it delegates to a fake backend that runs in the browser.

- Every data call takes the role, and the fake backend applies the perimeter. The UI never filters for security.
- It returns copies after a small delay, like a real network.
- It holds the activity (AI reviews, uploads, actions done), so a change made in `/ops` reaches every role.

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

## 7. Use of AI

AI is proposed to interpret email sources. Since one of the strongest points of LLMs is interpreting natural language, AI is used to cover this key task of the scope, which could not be covered with a more deterministic approach.

A safety net is implemented where the AI-interpreted texts are only displayed to the ops role (`/ops`) to complete a review. They have an interactive option to accept or reject the update interpreted by AI. Once validated, it is displayed for other users.

## 8. Assumptions

- Every shipment has an internal record (planned milestones, documents, customer account, origin site). This is the baseline that delay is measured against.
- Operators can be reached through at least one of: an API, a DCSA feed, a terminal API or email.
- The DeCA is mandatory only on contracted domestic road legs. The e-CMR is optional.
- One account per customer or subsidiary. Internal users in the prototype see all three sites.

## 9. Known limitations

- **Demo state is in memory.** AI reviews, uploads and actions done live in the mock backend and are lost on reload.
- **Fixed clock.** "Now" is 22 Nov 2026 10:40 (Madrid), so delay and stale stay consistent with the synthetic data.
- **Mocked AI.** Answers come from a fixed map per email, so only the emails in the fixtures can be read.
- **A customs hold can't be lifted from the terminal feed.** A single Terminal49 snapshot can't show a hold being removed. Only a later operator event moves the shipment on.
- **Stale thresholds are fixed per mode** (24 h road, 72 h sea), not per operator or route.
- **Sorting is fixed:** worst incident first, then ETA. Other orders, such as most recently updated, could be useful.
- **Documents have no files.** "Open document" is inert.

## 10. Prioritised next steps

1. **Backend integration.** Ingest the existing road operators' APIs, the DCSA subscription, Terminal49 and a dedicated mailbox. Store raw payloads unchanged, so events can be re-normalised whenever a mapping improves.
2. **Move the transformation to the server.** Run the adapters, state machine and rules in a BFF, together with filtering, sorting and pagination. The client receives `ShipmentView`s ready to render, and `client.ts` switches from the mock to `fetch`.
3. **Authentication and perimeters.** Use SSO for internal users and invitation-based accounts for customers and subsidiaries. Enforce the site, account and role perimeter in the API, including site-level users (for example, Valencia only).
4. **Polling.** Set `refetchInterval` on the shipments query and monitor request volume. Move to server-side caching or SSE only if it becomes an issue (see section 4).
5. **Real AI integration.** Use an LLM call with structured output (milestone enum, ISO dates, confidence, supporting quote), run asynchronously at ingestion. Validate the output before storing it: the quote must exist in the email, the date must be plausible, and the milestone must fit the leg's mode. Calibrate the confidence threshold on labelled operator emails, and log every accept and reject.
6. **Editable AI reads.** Let ops correct a field before accepting. Store each correction and use it to measure, and later improve, the AI's accuracy.
7. **Real notifications and actions.** Make "Notify customer" and "Contact operator" actually send (email or push, opt-in per account), based on the existing notice rules.
8. **More inputs.** Add PDF notices and widen operator coverage.
