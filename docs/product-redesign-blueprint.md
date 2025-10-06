# LoadMaster Reboot Blueprint

## Product vision
- Deliver a focused owner-operator copilot that answers one question extremely well: *“Is this load worth taking right now?”*
- Blend instant profitability math, recent market context, and a short list of actions so drivers can decide within 30 seconds.
- Start web-first with an offline-friendly mobile layout; grow into a lightweight native wrapper once workflows are validated.

## Target personas
1. **Solo owner-operators (prime persona)**
   - Haul dry van/reefer or hotshot; negotiate with a handful of brokers daily.
   - Pain: juggling DAT/123Loadboard, spreadsheets, and gut feel during phone calls.
   - Success: understands RPM + take-home profit, logs 5–10 loads/day, wants insight but not heavy admin.
2. **Dispatcher / small fleet back-office**
   - Coordinates 3–10 trucks, cares about consistency and fast quoting.
   - Needs shared history and a way to hand off negotiation context.
3. **Future persona: carrier sales rep / brokerage analyst**
   - Nice-to-have, but de-prioritized until the driver experience is sticky.

## Core value loop
1. Capture a load opportunity manually (origin, destination, miles, all-in rate, accessorials).
2. Immediately compute RPM, margin after fixed/variable costs, and a quick yes/no guidance indicator.
3. Surface market context (recent RPM averages, diesel index, historical win rate) in a single glance.
4. Log decision (accept/decline/counter) and sync with a simple timeline so patterns emerge over days.
5. Use the history to auto-suggest counter offers and remind drivers of broker relationships.

## MVP surface area
- **Single responsive page** with three panels: load entry, instant result, and recent history.
- **Local-first persistence** using IndexedDB/Service Worker; optional Supabase sync once auth is enabled.
- **Anonymous usage** allowed; account creation limited to email/password or magic link.
- **No OCR/AI pipeline**; drop files in a “coming soon” slot. Focus engineering on math accuracy.
- **Cost model editor** kept simple: default fixed cost template + optional advanced settings drawer.
- **Guided tour** (3 steps) to teach the calculation and history review, then out of the way.

## Architecture starting point
- Frontend: React + Vite + TanStack Query (for future network sync) + Tailwind for rapid layout.
- State: Zustand store for calculator inputs/results with persistence middleware.
- Data sync: background queue that batches changes to Supabase when user signs in.
- Telemetry: privacy-first, store aggregated events locally and send opt-in usage stats nightly.
- API: Supabase Postgres with row-level security, but all routes optional at first boot.
- Testing: Vitest + Playwright smoke flows (load entry, history, cost configuration).

## Domain model (v1)
| Entity | Purpose | Key fields |
| --- | --- | --- |
| `LoadOpportunity` | User-entered load snapshot | id (UUID), createdAt, origin, destination, equipment, miles, rateAllIn, fuelSurcharge, accessorials, brokerName |
| `Decision` | Outcome of a considered load | loadId, decisionType (accepted/declined/countered), targetRate, notes |
| `CostProfile` | Driver-specific fixed & variable assumptions | id, userId, name, fixedCostsPerDay, variableCostsPerMile, fuelEfficiency, targetMargin |
| `MarketSnapshot` | Aggregated external data for quick reference | laneKey, avgRPM7d, avgRPM30d, dieselIndex, source |

## Roadmap phases
### Phase 0 – Validate core calculator (4 weeks)
- Ship MVP surface with local persistence and manual load capture.
- Instrument qualitative feedback loop (in-app “was this helpful?”).
- Shadow 3–5 owner-operators to refine wording and flow.

### Phase 1 – Light collaboration & sync (6 weeks)
- Add optional Supabase login, multi-device sync, and shared history for dispatchers.
- Introduce broker contact notebook and negotiation note templates.
- Release public landing page + waitlist to funnel non-invited users.

### Phase 2 – Smart insights (8 weeks)
- Integrate external market APIs (e.g., DAT RateView, DOE diesel) with caching layer.
- Suggest counter offers using historical acceptance rates + market data.
- Offer weekly email summary with top-performing brokers and lanes.

### Phase 3 – Premium automations (later)
- Revisit OCR/LLM ingestion after 1,000 active loads/month benchmark.
- Launch mobile wrappers (Capacitor) with offline sync.
- Add Stripe subscriptions and tiered entitlements for fleet features.

## Design tenets
- **Fast**: tap to result < 200 ms on mid-range Android.
- **Trustworthy**: show formulas, assumptions, and last updated timestamps for market data.
- **Opinionated but flexible**: default cost profiles + quick toggles instead of forcing deep setup.
- **Calm**: no modal labyrinth; use inline drawers and contextual help.

## Success metrics
- Time-to-first-decision under 60 seconds for new users.
- 70% of daily active users log ≥3 loads/day within two weeks of onboarding.
- Net Promoter Score ≥ +30 after Phase 1, primarily among owner-operators.
- Conversion of invited dispatchers to weekly active collaboration > 40%.

## Team practices
- Maintain a living design system in Storybook before scaling UI.
- Use feature flags for experimental insights; ship behind dark launches.
- Conduct biweekly ride-alongs or interviews with target drivers.

## Nice-to-haves to defer
- Advanced analytics dashboards beyond weekly summary.
- AI-generated negotiation scripts without validated human demand.
- Complex subscription tiers; start with free + single paid upgrade when needed.
- Partner integrations (e.g., factoring companies) until core loop is sticky.

