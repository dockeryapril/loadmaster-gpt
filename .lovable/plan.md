

## Plan: Add Deadhead Miles (Manual Input) + Future Google Maps Task

### Overview
Add manual deadhead miles input to the calculator so drivers can see their **true profitability** when factoring in empty miles to pickup. Also add Google Maps API integration as a documented future enhancement task.

---

### Part 1: Manual Deadhead Miles Implementation

#### User Experience
1. **New Optional Input Field**
   - Add "Deadhead" input field in the miles row (next to loaded miles)
   - Placeholder: "Empty miles"
   - Default: empty (treated as 0 - no impact if not entered)
   - Mobile-friendly: compact field that doesn't clutter the form

2. **Enhanced Profit Calculation**
   - Fuel cost calculated on **total miles** (loaded + deadhead)
   - Variable costs calculated on **total miles**  
   - This automatically reduces profit when deadhead is entered

3. **Dual RPM Display**
   - When deadhead > 0, show both values:
     - **Loaded RPM**: Profit ÷ Loaded Miles (what brokers quote)
     - **True RPM**: Profit ÷ Total Miles (actual earnings)
   - Visual indicator that True RPM is the "real" number

4. **Guidance Badge Update**
   - Use True RPM (not loaded RPM) for decision guidance
   - Prevents users from being fooled by high loaded RPM on loads with long deadhead

#### Technical Changes

| File | Change |
|------|--------|
| `src/types/mvp.ts` | Add `deadheadMiles: string` to `LoadFormInput`, `deadheadMiles?: number` to `LoadEntrySnapshot` |
| `src/types/load.ts` | Update `calculateDetailedProfit()` to accept `deadheadMiles`, return both `loadedRpm` and `trueRpm` |
| `src/App.tsx` | Add deadhead input field, pass to calculations, display dual RPM |
| `src/components/ProfitBreakdown.tsx` | Show deadhead in cost breakdown with clear labeling |
| `src/components/GuidanceBadge.tsx` | Already accepts netRpm - just pass trueRpm instead |
| `src/store/useDecisionStore.ts` | Store deadheadMiles in decision history |
| `src/hooks/useCloudSync.ts` | Map to existing `deadhead_miles` database column |

#### Backward Compatibility
- All new fields optional with default 0
- Existing history displays correctly (deadhead assumed 0)
- No database migration needed (column already exists in `loads` table)
- Current users see no change unless they enter deadhead

---

### Part 2: Update tasks.md with Future Google Maps Task

Add new section to tasks.md:

```
## 📋 Future Enhancement: GPS-Based Deadhead Estimation

**Goal**: Auto-calculate deadhead miles using driver's current location and load pickup point.

**Status**: Backlog (implement after manual deadhead validates user demand)

**Approach Options**:
1. **Google Routes API** (preferred)
   - Free tier: 10,000 calls/month
   - Cost above free: $5/1,000 calls ($0.005 each)
   - High accuracy with traffic data
   
2. **Free Alternatives** (fallback)
   - OpenRouteService: 2,000 free calls/day
   - HERE Freemium: 250,000 free/month
   - Straight-line approximation with 1.3x multiplier

**Prerequisites**:
- Validate user demand for automatic deadhead
- User opt-in for location access
- Settings field: "Current Location" or GPS permission
- Error handling for GPS denial

**Implementation Tasks**:
- [ ] Add "Current Location" field to user settings
- [ ] Request GPS permission with clear explanation
- [ ] Create edge function for distance calculation API
- [ ] Auto-populate deadhead when origin entered
- [ ] Allow manual override of calculated distance
- [ ] Track API costs in analytics
```

---

### Example Calculation

```text
Load: $1,500 all-in, 600 loaded miles, 150 deadhead miles
Fuel: $4.00/gal, 6.5 MPG

Before (no deadhead):
  Fuel: 600 mi ÷ 6.5 MPG × $4.00 = $369
  Loaded RPM only shown

After (with deadhead):
  Fuel: 750 mi ÷ 6.5 MPG × $4.00 = $462
  Loaded RPM: Profit ÷ 600 mi
  True RPM: Profit ÷ 750 mi ← What really matters
```

---

### Testing Checklist
- [ ] Enter load with 0 deadhead → Same behavior as before
- [ ] Enter load with deadhead → Fuel cost increases, profit decreases
- [ ] Both Loaded RPM and True RPM displayed when deadhead > 0
- [ ] Guidance badge uses True RPM for decision
- [ ] Deadhead saves to history
- [ ] Deadhead syncs to cloud (for signed-in users)
- [ ] Refresh preserves deadhead in history
- [ ] Mobile layout works with additional input field

---

### Files to Modify
1. `src/types/mvp.ts` - Add deadhead to types
2. `src/types/load.ts` - Update calculation logic + return dual RPM
3. `src/App.tsx` - Add input field + display dual RPM
4. `src/components/ProfitBreakdown.tsx` - Show deadhead in breakdown
5. `src/store/useDecisionStore.ts` - Store deadhead in history
6. `src/hooks/useCloudSync.ts` - Sync to database
7. `docs/tasks.md` - Mark this phase complete + add future GPS task

