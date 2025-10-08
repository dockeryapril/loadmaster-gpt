# LoadMaster Reboot - Development Tasks

## 🎯 Product Vision
LoadMaster reboot focuses on a single question: **"Is this load worth taking right now?"**

We're building a mobile-first, local-first calculator that delivers instant profitability verdicts in under 30 seconds, with optional advanced features layered progressively.

---

## ✅ Phase 1: Clean Slate Architecture — COMPLETED

**Completed**: [Current Date]

### What Was Completed
- ✅ **Archived legacy codebase** to `/archive/v1-*` directories
  - Moved complex components (business setup, negotiation, OCR correction)
  - Moved hooks (Supabase integrations, tier detection, equipment-aware calculations)
  - Moved pages (auth, upgrade, FAQ, landing)
  - Moved features (AI enhancement, negotiation engine)
  - Moved types (businessSetup, negotiation, equipment)
  - Moved AI/OCR utilities (LLM extraction, vision processing)
  - Moved utils (API wrappers, tier management, CSV export)
  - Preserved `/src/components/ui/` shadcn component library

- ✅ **Consolidated reboot code** from `/apps/core` and `/src`
  - Kept clean `App.tsx` as single-page calculator
  - Merged OCRDropzone as placeholder for future Phase
  - Removed duplicate implementations

- ✅ **Simplified type system**
  - Kept only `src/types/mvp.ts` with core types
  - Added `CostAssumptions` interface for Phase 2
  - Created minimal `src/types/load.ts` with profit calculation
  - Removed complex type dependencies

- ✅ **Cleaned up dependencies**
  - Removed `openai` (no LLM in reboot)
  - Removed `tesseract.js` (OCR deferred to Phase 3+)
  - Removed `recharts` (charts deferred)
  - Removed `react-hook-form` (using plain inputs)
  - Kept essentials: React, Vite, Tailwind, Zustand, shadcn/ui

- ✅ **Created feature flag system**
  - Built `src/utils/featureFlags.ts` for progressive feature enablement
  - Gated all advanced features behind flags
  - Default: all flags disabled (local-first calculator only)

- ✅ **Documented reboot architecture**
  - Created comprehensive `docs/reboot-architecture.md`
  - Documented active files vs archived files
  - Outlined technology stack and design principles
  - Mapped future phases and migration path

### How to Test Phase 1
1. **Run the app**: `npm run dev` → App loads at localhost
2. **Manual entry**: Enter origin, destination, miles, rate → See instant profit calculation
3. **Log decision**: Select outcome (Book/Counter/Pass) → Click "Log decision"
4. **Verify history**: Decision appears in history panel with correct data
5. **Refresh page**: History persists (Zustand + localStorage)
6. **Check console**: Zero errors, no missing imports
7. **Responsive design**: Test on mobile viewport (320px+)

### Verification Checklist
- [x] App runs without errors
- [x] No references to removed dependencies
- [x] Clean console (no import errors)
- [x] Manual load entry works
- [x] Profit calculation accurate (rate + fsc - tolls - fuelCost)
- [x] History persists after refresh
- [x] Mobile-responsive design
- [x] `/archive` directory exists with legacy code
- [x] Feature flags in place for future phases

### Files Changed
**Created**:
- `/archive/v1-components/` (archived legacy components)
- `/archive/v1-hooks/` (archived legacy hooks)
- `/archive/v1-pages/` (archived legacy pages)
- `/archive/v1-features/` (archived legacy features)
- `/archive/v1-types/` (archived complex types)
- `/archive/v1-ai/` (archived AI/OCR logic)
- `/archive/v1-utils/` (archived utilities)
- `/archive/v1-integrations/` (archived Supabase code)
- `/src/types/load.ts` (simplified profit calculation)
- `/src/utils/featureFlags.ts` (feature flag system)
- `/docs/reboot-architecture.md` (comprehensive documentation)

**Modified**:
- `/src/types/mvp.ts` (added CostAssumptions for Phase 2)
- `/package.json` (removed unused dependencies)
- `/docs/tasks.md` (this file - updated with Phase 1 completion)

**Deleted**:
- `/apps/core/` (consolidated into `/src`, no longer needed)

### What's Next
→ **Phase 2: Core Calculator Enhancement** (see below)

---

## 📋 Phase 2: Core Calculator Enhancement (UPCOMING)

**Goal**: Make profit calculations trustworthy, transparent, and guidance-driven.

**Timeline**: 2-3 days

### Tasks
- [ ] **Cost Profile Editor**
  - [ ] Create drawer/modal for editing cost assumptions
  - [ ] Add 4 inputs: fuel price, MPG, daily fixed costs, variable cost per mile
  - [ ] Store in Zustand with localStorage persistence
  - [ ] Show "Edit Assumptions" link in calculator result area
  - [ ] Pre-fill with industry defaults from `defaultCostAssumptions`

- [ ] **Enhanced Profit Display**
  - [ ] Show detailed breakdown section:
    - Gross revenue: `rate + fsc`
    - Fuel cost: `(miles / mpg) * fuelPrice`
    - Tolls: `tolls`
    - Variable costs: `miles * variableCostPerMile`
    - Fixed costs (prorated): `fixedDaily / expectedLoadsPerDay`
    - **Net profit**: sum of above
  - [ ] Add expandable "How is this calculated?" section with formula explanation
  - [ ] Include timestamp: "Calculated at [time] using fuel price $X.XX"
  - [ ] Update `LoadCalculationResult` interface to support breakdown

- [ ] **Smart Guidance Badge**
  - [ ] Replace simple profit number with visual indicator:
    - 🟢 **Book it** - Profit > $500 AND Net RPM > $1.50
    - 🟡 **Consider countering** - Profit $200-500 OR Net RPM $1.00-1.50
    - 🔴 **Pass** - Profit < $200 OR Net RPM < $1.00
  - [ ] Show reasoning: "Net RPM is $1.75/mi (Good) and profit is $650 (Strong)"
  - [ ] Make thresholds editable in cost profile (future enhancement)

### Testing Requirements
- [ ] Cost profile persists after refresh
- [ ] Profit breakdown math is accurate
- [ ] Guidance badge shows correct color/label for edge cases
- [ ] Mobile-responsive on all breakpoints
- [ ] Timestamp updates on recalculation

---

## 📋 Phase 3: History & Insights (UPCOMING)

**Goal**: Make past decisions useful for future evaluation.

**Timeline**: 2-3 days

### Tasks
- [ ] **Enhanced History Panel**
  - [ ] Add filters: Show All / Book / Counter / Pass
  - [ ] Add sort: Newest First / Highest Profit / Best RPM
  - [ ] Add search by origin/destination
  - [ ] Show weekly summary card: "This week: 3 booked, 2 passed, avg profit $425"
  - [ ] Add pagination (show 10 at a time)

- [ ] **Decision Pattern Recognition**
  - [ ] Track acceptance rate by RPM range (e.g., "80% of loads >$2.00/mi were booked")
  - [ ] Highlight similar loads: "You usually book loads like this at $X.XX/mi"
  - [ ] Simple stats card: avg profit, best RPM, most common route

- [ ] **Export Capability**
  - [ ] Add "Export to CSV" button
  - [ ] Include all logged decisions with calculations
  - [ ] Format for spreadsheet analysis (columns: date, route, miles, profit, rpm, outcome)

### Testing Requirements
- [ ] Filters work correctly with history
- [ ] Search is case-insensitive and handles partial matches
- [ ] CSV export opens correctly in Excel/Google Sheets
- [ ] Pattern recognition accurate with 10+ entries

---

## 📋 Phase 4: Onboarding Flow (UPCOMING)

**Goal**: Get new users to first decision in under 60 seconds.

**Timeline**: 1-2 days

### Tasks
- [ ] **3-Step Inline Tour**
  - [ ] Step 1: "Enter load details here" (highlight form)
  - [ ] Step 2: "See instant profit calculation" (highlight result)
  - [ ] Step 3: "Log your decision to track patterns" (highlight history)
  - [ ] Use simple tooltips (not modal maze)
  - [ ] Dismissable, never shows again after completion
  - [ ] Store tour completion in localStorage

- [ ] **Smart Defaults**
  - [ ] Pre-fill cost assumptions with industry averages
  - [ ] Show "These are typical values—edit anytime" message
  - [ ] No forced setup wizard

### Testing Requirements
- [ ] Tour shows only on first visit
- [ ] Tour doesn't block core functionality
- [ ] Tour completion persists after refresh
- [ ] Mobile-friendly tooltip positioning

---

## 📋 Phase 5: Future-Proofing (UPCOMING)

**Goal**: Prepare for OCR, sync, and authentication without implementing them.

**Timeline**: 1 day

### Tasks
- [ ] **Sync Queue Placeholder**
  - [ ] Create `src/store/syncQueue.ts` with stub functions
  - [ ] Add `queueForSync(decision: LoadEntrySnapshot)` placeholder
  - [ ] Document how sync will work when enabled
  - [ ] Store decisions locally, queue for upload when auth ships

- [ ] **Auth Hook Stub**
  - [ ] Create `src/hooks/useAuth.ts` returning `{ user: null, isAuthenticated: false }`
  - [ ] Future-proof components to check `isAuthenticated` before showing sync options
  - [ ] Add "Sign in to sync" placeholder UI (hidden behind feature flag)

- [ ] **Progressive Feature Enablement**
  - [ ] Document re-enabling process for each archived feature
  - [ ] Create migration checklist for OCR, business setup, negotiation
  - [ ] Test feature flag toggling

### Testing Requirements
- [ ] Sync queue functions exist but don't execute
- [ ] Auth hook returns expected default values
- [ ] Feature flags can be toggled without breaking app

---

## 🐛 Known Issues (to Address in Future Phases)

- None currently (Phase 1 clean slate)

---

## 📝 Notes & Decisions

### Why Archive Instead of Delete?
Legacy code represents months of development and domain knowledge. Archiving allows us to:
1. Reference complex logic when re-implementing features
2. Preserve business setup profiles, equipment definitions, negotiation templates
3. Maintain audit trail of architectural decisions
4. Selectively restore features without rebuilding from scratch

### Why Local-First?
1. **Reliability**: Works offline, no backend dependencies
2. **Speed**: Sub-200ms calculations, no API latency
3. **Privacy**: Data stays on device until user opts into sync
4. **Cost**: Zero infrastructure costs for core functionality
5. **Simplicity**: Easier to test, debug, and maintain

### When to Re-enable Backend?
Only after core loop is validated:
- Users consistently log 10+ decisions
- Feedback confirms calculator is trustworthy
- Clear demand for cloud sync and multi-device access

---

**Last Updated**: Phase 1 completion
**Next Review**: Before Phase 2 kickoff
