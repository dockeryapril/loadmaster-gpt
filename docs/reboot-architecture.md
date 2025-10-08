# LoadMaster Reboot Architecture

## Core Principle
Local-first, single-page calculator focused on instant profitability decisions.

**Goal**: Answer "Is this load worth taking?" in under 30 seconds.

## Current State: Phase 1 - Clean Slate ✅

### Active Files (Reboot Core)
```
/src
├── App.tsx                      # Main single-page calculator interface
├── main.tsx                     # React entry point
├── index.css                    # Design system tokens
├── types/
│   ├── mvp.ts                  # Core data types (LoadFormInput, LoadEntrySnapshot, CostAssumptions)
│   └── load.ts                 # Profit calculation utilities
├── store/
│   └── useDecisionStore.ts     # Zustand store with localStorage persistence
├── lib/
│   └── zustand/                # State management utilities
├── components/
│   ├── ui/                     # shadcn component library (preserved)
│   └── OCRDropzone.tsx         # Placeholder for future OCR (Phase 3+)
└── utils/
    └── featureFlags.ts         # Progressive feature enablement
```

### Archived Files (Legacy Full-Featured App)
All previous complex features moved to `/archive/v1-*`:
- `/archive/v1-components/` - Business setup wizard, negotiation panels, OCR correction, etc.
- `/archive/v1-hooks/` - Complex business logic, Supabase integrations, tier detection
- `/archive/v1-pages/` - Auth, upgrade, FAQ, landing pages
- `/archive/v1-features/` - Negotiation engine, AI enhancement
- `/archive/v1-types/` - Complex type definitions (businessSetup, negotiation, equipment)
- `/archive/v1-ai/` - LLM extraction, vision processing, telemetry
- `/archive/v1-utils/` - API wrappers, tier management, CSV export
- `/archive/v1-integrations/` - Supabase client and types
- `/archive/v1-contexts/` - Auth and rate limit providers

**Note**: These files are preserved for reference and future re-integration, not deleted.

## Technology Stack

### Core Dependencies (Minimal)
- **React 18.3** - UI framework
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling with semantic tokens
- **Zustand** - Lightweight state management
- **date-fns** - Date formatting
- **Lucide React** - Icons

### UI Components
- **shadcn/ui** - Radix-based accessible components
- All components use semantic design tokens from `index.css`

### Removed Dependencies (Phase 1 Cleanup)
- ❌ `openai` - No LLM in reboot (deferred to Phase 3+)
- ❌ `tesseract.js` - OCR deferred to Phase 3+
- ❌ `recharts` - Charts deferred to Phase 3+
- ❌ `react-hook-form` - Using plain controlled inputs
- ❌ `@supabase/supabase-js` - Sync deferred to Phase 5+

## Data Flow

### Local-First Storage
```
User Input → Form State → Zustand Store → localStorage
                ↓
          Profit Calculation
                ↓
          Decision Logging
                ↓
          History Display (from localStorage)
```

### No Backend Dependencies (Phase 1)
- All data stored locally in browser
- No authentication required
- No API calls
- No external services

### Future Backend Integration (Lovable Cloud)
When backend features are enabled in later phases:
- **Lovable Cloud** - Managed Supabase backend with zero-config setup
- **Authentication** - Email/password, magic links, Google OAuth
- **Database** - PostgreSQL with automatic schema generation
- **Storage** - File uploads for future OCR screenshots
- **Edge Functions** - Serverless functions for AI enhancements
- **Row-Level Security** - Automatic data isolation per user
- Background sync queue for offline support
- Optional authentication (anonymous usage still supported)

**Why Lovable Cloud?**
- Faster time-to-market (no external Supabase project setup)
- Aligned with local-first architecture (sync when ready)
- Built-in development tools (database viewer, logs, schema editor)
- Cost-effective for MVP phase
- Easy migration path if external Supabase needed later

## Feature Flags System

All advanced features are gated behind flags in `src/utils/featureFlags.ts`:

```typescript
export const features = {
  ocrEnabled: false,           // Phase 3+
  authEnabled: false,          // Phase 5+
  supabaseSync: false,         // Phase 5+
  stripeIntegration: false,    // Deferred
  aiEnhancement: false,        // Deferred
  businessSetup: false,        // Phase 4
  advancedNegotiation: false,  // Deferred
};
```

Components check flags before rendering conditional features:
```typescript
{isFeatureEnabled('ocrEnabled') && <OCRDropzone />}
```

## Design System

### Semantic Tokens (index.css)
All colors use CSS custom properties:
- `--primary` - Primary brand color
- `--foreground` - Text color
- `--muted` - Secondary text
- `--border` - Border color
- `--background` - Background color

**Never use direct colors** like `text-white`, `bg-gray-100`, etc.

### Component Styling
- All UI components use semantic tokens
- Tailwind configured to reference CSS variables
- Dark mode ready (not enabled in Phase 1)

## Testing Strategy

### Phase 1 Testing
- ✅ Manual load entry works
- ✅ Profit calculation accurate
- ✅ History persists after refresh
- ✅ No console errors
- ✅ App runs without missing dependencies

### Future Testing (Phase 2+)
- Unit tests for calculator logic (Vitest)
- Component tests for form inputs
- Integration tests for history persistence
- E2E smoke tests (Playwright)

## Development Workflow

### Running the App
```bash
npm run dev        # Start development server
npm run build      # Production build
npm run preview    # Preview production build
```

### File Structure Rules
1. **Keep it simple** - Single-page app, no routing in Phase 1
2. **Inline styles** - Use Tailwind directly in components
3. **No abstractions** - Avoid premature component extraction
4. **Local state first** - Only use Zustand for history/settings

### When to Extract Components
- When code exceeds 400 lines
- When logic is reused in 3+ places
- When a section has independent state

## Backend Architecture (Future Phases)

### Phase 2-3: Authentication & Sync (Lovable Cloud)
**Tables to create:**
- `loads` - Synced load entries with user_id FK
- `user_settings` - Cost profiles, preferences, RPM thresholds
- `cost_profiles` - Named cost assumption templates

**RLS Policies:**
- Users can only read/write their own loads
- Users can only read/write their own settings
- Enable anonymous usage with device-based IDs

**Auth Flow:**
1. Start anonymous (local-first)
2. Optional sign-up prompt after 10+ decisions logged
3. Background sync queue uploads local history on first auth
4. Bi-directional sync with conflict resolution (server wins)

### Phase 4+: Advanced Features (Lovable Cloud)
**Edge Functions:**
- `/ocr-extract` - Image to structured load data (when OCR re-enabled)
- `/ai-guidance` - LLM-powered negotiation suggestions (when AI re-enabled)
- `/broker-lookup` - Third-party API integrations

**Lovable AI Integration:**
- Document Q&A for rate con analysis
- Sentiment detection for broker communications
- Load recommendation engine based on history patterns

## Next Phases

### Phase 2: Core Calculator Enhancement (2-3 days)
- Cost profile editor
- Enhanced profit display with breakdown
- Smart guidance badge (Book/Counter/Pass)

### Phase 3: History & Insights (2-3 days)
- Enhanced history panel with filters
- Decision pattern recognition
- CSV export

### Phase 4: Onboarding Flow (1-2 days)
- 3-step inline tour
- Smart defaults

### Phase 5: Lovable Cloud Integration (2-3 days)
- Enable Lovable Cloud backend
- Authentication with email/magic links
- Database schema creation (loads, user_settings, cost_profiles)
- Sync queue implementation
- Multi-device access

## Lovable Cloud Implementation Notes

### When to Enable
- After Phase 1-4 are validated with local-first architecture
- When 3+ beta testers request multi-device sync
- After confirming core calculator provides consistent value

### Activation Checklist
1. Enable Lovable Cloud in project settings
2. Define database schema using Lovable's UI or SQL
3. Set up RLS policies for user data isolation
4. Test auth flow in staging environment
5. Implement sync queue with exponential backoff
6. Add sync status UI indicators
7. Document sync behavior for users

### Cost Considerations
- Free tier includes: Basic database, auth, and Edge Functions
- Usage-based pricing for: Database storage, Edge Function calls, Lovable AI requests
- Monitor usage via Lovable Cloud dashboard
- Set up alerts for approaching limits

### Rollback Plan
If Lovable Cloud integration causes issues:
1. Toggle `features.supabaseSync = false` in feature flags
2. App reverts to local-first mode
3. Users retain local data, sync pauses
4. Fix issues, re-enable sync, queue catches up

## Migration Path

### Re-enabling Legacy Features
When ready to add back advanced features:

1. **Review archived code** in `/archive/v1-*`
2. **Adapt to reboot architecture** - Keep local-first principle
3. **Enable feature flag** in `featureFlags.ts`
4. **Test thoroughly** - Ensure no breaking changes
5. **Document changes** in this file

### Example: Re-enabling OCR
```typescript
// 1. Copy archived OCR components
cp archive/v1-components/OCRCorrectionInterface.tsx src/components/

// 2. Update feature flag
features.ocrEnabled = true

// 3. Wire up in App.tsx
{isFeatureEnabled('ocrEnabled') && <OCRDropzone onParse={applyOcr} />}

// 4. Test and iterate
```

## Success Metrics

### Phase 1 Goals ✅
- [x] Clean, single-purpose calculator
- [x] No external dependencies
- [x] Sub-200ms calculation time
- [x] History persists reliably
- [x] Zero console errors
- [x] Mobile-responsive design

### Overall Reboot Success
- Users get to first decision in <60 seconds
- 90%+ uptime (local-first = high reliability)
- Clear upgrade path to advanced features
- Maintainable codebase for long-term evolution

---

**Last Updated**: Phase 1 completion
**Next Review**: Before Phase 2 kickoff
