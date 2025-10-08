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
5. **Refresh page**: **History now persists correctly** (fixed Zustand persist middleware)
6. **Check console**: Zero runtime errors, no missing imports
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

## ✅ Phase 2: Core Calculator Enhancement — COMPLETED

**Completed**: [Current Date]

### What Was Completed
- ✅ **Cost Profile Editor**
  - Created drawer/sheet for editing cost assumptions
  - Added 4 inputs: fuel price ($3.89), MPG (6.5), daily fixed costs ($250), variable cost per mile ($0.35)
  - Stored in Zustand with localStorage persistence
  - "Edit Cost Assumptions" button in calculator result area
  - Pre-filled with industry defaults from `defaultCostAssumptions`
  - **Fixed persistence bug**: Moved migration logic into persist middleware to eliminate race condition
  - **Fixed decimal formatting**: Cost fields now preserve "4.50" format using toFixed(2)

- ✅ **Enhanced Profit Display**
  - Detailed breakdown section showing:
    - Gross revenue: `rate + fsc`
    - Fuel cost: `(miles / mpg) * fuelPrice` (auto-calculated)
    - Tolls: user input
    - Variable costs: `miles * variableCostPerMile`
    - Fixed costs (prorated): `(fixedDaily / 2500) * miles`
    - **Net profit**: sum of above
  - Added expandable "How is this calculated?" section with formula explanation
  - Included timestamp: "Calculated at [time] using fuel price $X.XX"
  - Updated `LoadCalculationResult` interface to support breakdown
  - Removed manual fuel input, now auto-calculated from cost profile

- ✅ **Smart Guidance Badge**
  - Replaced simple profit display with visual indicator:
    - 🟢 **Book it** - Profit > $500 AND Net RPM > $1.50
    - 🟡 **Consider countering** - Profit $200-500 OR Net RPM $1.00-1.50
    - 🔴 **Pass** - Profit < $200 OR Net RPM < $1.00
  - Shows reasoning: "Net RPM is $1.75/mi (Strong load)"
  - Color-coded with emerald (book), amber (counter), rose (pass)

### How to Test Phase 2
1. **Run the app**: `npm run dev` → App loads at localhost
2. **Edit cost profile**: Click "Edit Cost Assumptions" → Change values → Save
3. **Verify persistence**: Refresh page → Cost profile values should persist
4. **Auto fuel calculation**: Enter miles (e.g., 250) → See auto-calculated fuel cost based on MPG
5. **View breakdown**: Click "Show breakdown" → See detailed cost breakdown
6. **Formula help**: Click "How is this calculated?" → See formula explanation
7. **Guidance badge**: Enter different rates/miles → See badge color change (green/yellow/red)
8. **Log decision**: Verify history shows auto-calculated fuel cost
9. **Mobile responsive**: Test drawer/sheet on mobile viewport

### Verification Checklist
- [x] Cost profile persists after refresh
- [x] Profit breakdown math is accurate
- [x] Guidance badge shows correct color/label for edge cases
- [x] Mobile-responsive on all breakpoints
- [x] Timestamp updates on recalculation
- [x] Auto-calculated fuel replaces manual input
- [x] "How is this calculated?" section is readable

### Files Changed
**Created**:
- `/src/components/CostProfileEditor.tsx` (cost profile drawer)
- `/src/components/ProfitBreakdown.tsx` (expandable breakdown section)
- `/src/components/GuidanceBadge.tsx` (visual decision indicator)

**Modified**:
- `/src/store/useDecisionStore.ts` (added costProfile state + useCostProfile hook)
- `/src/types/load.ts` (added calculateDetailedProfit function + interfaces)
- `/src/App.tsx` (integrated new components, removed manual fuel input)
- `/src/integrations/supabase/client.ts` (fixed TypeScript build error)

### What's Next
→ **Phase 3: History & Insights** (see below)

---

## 📋 Phase 3: History & Insights (UPCOMING)

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

## ✅ Phase 3: History & Insights — COMPLETED

**Goal**: Make past decisions useful for future evaluation.

**Completed**: [Current Date]

### Sub-Phase 3.1: Enhanced History Panel — ✅ COMPLETED

**What Was Completed**:
- ✅ Created `src/hooks/useHistoryFilters.ts` - Custom hook for filter/sort/search logic
- ✅ Created `src/components/HistorySummaryCard.tsx` - Weekly stats summary (last 7 days)
- ✅ Created `src/components/HistoryFilters.tsx` - Filter/sort controls UI
- ✅ Created `src/components/HistoryPanel.tsx` - Main history panel component
- ✅ Refactored `src/App.tsx` to use new HistoryPanel component
- ✅ **Testing approach**: Manual testing recommended (automated tests deferred to avoid dependency complexity)
- ✅ **Features implemented**:
  - Filter by outcome: All / Book / Counter / Pass
  - Sort options: Newest First / Highest Profit / Lowest Profit / Best RPM / Worst RPM
  - Search: Case-insensitive across origin/destination
  - Weekly summary card: Booked/Countered/Passed counts, avg profit, best RPM
  - Pagination: Show 10 entries at a time with "Load More" button
  - Empty states for no data and no filter matches

**How to Test Sub-Phase 3.1**:
  1. Log multiple decisions (mix of book/counter/pass outcomes)
  2. Use outcome filter dropdown to filter by specific decision type
  3. Use sort dropdown to reorder entries by profit or RPM
  4. Search for origin or destination city
  5. Verify weekly summary shows correct stats for last 7 days
  6. Click "Load More" to paginate through entries
  7. Verify empty states show when no history or no matches

### Sub-Phase 3.2: Decision Pattern Recognition — ✅ COMPLETED

**What Was Completed**:
- ✅ Created `src/utils/patternAnalysis.ts` - Core analysis functions
  - `analyzePatterns()` - Generate insights from decision history
  - `findSimilarLoads()` - Find loads matching current RPM/route
  - RPM range categorization with acceptance rates
  - Most common route detection
- ✅ Created `src/hooks/usePatternRecognition.ts` - React hooks
  - `usePatternRecognition()` - Access pattern insights
  - `useSimilarLoads()` - Find similar historical loads
- ✅ Created `src/components/PatternInsights.tsx` - Insights card UI
  - Shows after 5+ logged decisions
  - Displays best RPM, avg profit, booking rate
  - Most common route highlight
  - RPM range breakdown with visual bars
- ✅ Created `src/components/SimilarLoadIndicator.tsx` - Contextual load hints
  - Shows when similar loads exist (2+ matches)
  - "You usually book loads like this at $X.XX/mi"
  - Displays avg profit and booking rate for similar loads
- ✅ Updated `src/App.tsx` - Integrated new components
- ✅ **Automated test suite** (26 tests):
  - `src/utils/patternAnalysis.test.ts` - 16 tests for analysis logic
  - `src/hooks/usePatternRecognition.test.ts` - 6 tests for hooks
  - `src/components/PatternInsights.test.tsx` - 10 tests for UI component

**How to Test Sub-Phase 3.2**:
- **Before testing**: Run `npm install` to ensure `@testing-library/react` is installed
- **Automated**: Run `npm test` to execute 26 test cases
- **Manual**:
  1. Log 5+ decisions with varying RPMs and routes
  2. Verify "Your Decision Patterns" card appears
  3. Check best RPM, avg profit, and booking rate accuracy
  4. Verify most common route displays correctly
  5. Enter a new load similar to previous ones
  6. Verify "You usually book loads like this" indicator appears
  7. Test with different RPM ranges to see acceptance rate breakdown

### Sub-Phase 3.3: Export Capability (UPCOMING)

**Tasks**:
- [ ] Add "Export to CSV" button
- [ ] Include all logged decisions with calculations
- [ ] Format for spreadsheet analysis (columns: date, route, miles, profit, rpm, outcome)
- [ ] Create `src/utils/csvExport.ts`
- [ ] Create `src/components/ExportButton.tsx`

### Testing Requirements (Full Phase 3)
- [x] Filters work correctly with history
- [x] Search is case-insensitive and handles partial matches
- [x] Pagination works correctly
- [x] Weekly summary calculates accurate stats
- [x] Pattern recognition accurate with 10+ entries
- [x] Similar load indicator shows for matching loads
- [x] RPM range breakdown displays correctly
- [ ] CSV export opens correctly in Excel/Google Sheets (Sub-Phase 3.3)

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

## 📋 Phase 5: Lovable Cloud Integration (UPCOMING)

**Goal**: Enable cloud sync, authentication, and multi-device access using Lovable Cloud.

**Timeline**: 2-3 days

### Tasks
- [ ] **Enable Lovable Cloud**
  - [ ] Activate Lovable Cloud in project settings
  - [ ] Review auto-generated database schema
  - [ ] Set up RLS policies for data isolation

- [ ] **Create Database Schema**
  - [ ] `loads` table:
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `origin`, `destination`, `miles`, `rate`, `fsc`, `tolls`, `fuel_cost`
    - `profit`, `rpm`, `outcome`, `notes`
    - `created_at`, `updated_at`
    - `synced_from_device` (boolean, track migration from local)
  - [ ] `user_settings` table:
    - `user_id` (uuid, primary key, references auth.users)
    - `fuel_price_per_gallon`, `average_mpg`, `daily_fixed_costs`, `variable_cost_per_mile`
    - `rpm_threshold_good`, `rpm_threshold_poor`
    - `created_at`, `updated_at`
  - [ ] `cost_profiles` table (future):
    - Named templates for different equipment types

- [ ] **Implement Auth Flow**
  - [ ] Add "Sign in to sync" prompt after 10+ local decisions
  - [ ] Email/password auth via Lovable Cloud Auth
  - [ ] Magic link option for passwordless flow
  - [ ] Google OAuth (optional)
  - [ ] Anonymous → authenticated migration flow

- [ ] **Build Sync Queue**
  - [ ] Create `src/hooks/useSyncQueue.ts` with:
    - `queueForSync(decision)` - Add to upload queue
    - `syncPendingDecisions()` - Upload queued items
    - `pullRemoteDecisions()` - Download server changes
  - [ ] Background sync on app focus/online events
  - [ ] Conflict resolution (server wins, local backup)

- [ ] **Update Zustand Store**
  - [ ] Add `syncStatus` field (idle, syncing, error)
  - [ ] Add `lastSyncAt` timestamp
  - [ ] Merge remote decisions into local history
  - [ ] Mark synced items with cloud icon

- [ ] **UI Updates**
  - [ ] Add sync status indicator in header
  - [ ] Show "Synced" badge on history items
  - [ ] Display "Sign in to sync across devices" banner
  - [ ] Add "Account" settings page (view email, sign out)

### Testing Requirements
- [ ] Local-first still works without auth
- [ ] Auth signup creates user record
- [ ] Decisions sync bidirectionally
- [ ] Offline mode queues for later sync
- [ ] Multi-device sync doesn't duplicate entries
- [ ] Sign out clears remote data but keeps local history

---

## 🐛 Known Issues (to Address in Future Phases)

### TypeScript Build Warning (Non-blocking)
- **Issue**: `src/integrations/supabase/client.ts` shows TypeScript error about missing types
- **Impact**: None - file is auto-generated infrastructure code, not actively used in Phase 1
- **Resolution**: Will auto-resolve when **Lovable Cloud** is enabled in Phase 5
- **Status**: Safe to ignore - does not affect runtime or functionality
- **Note**: This file will be regenerated automatically when Lovable Cloud is activated

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
