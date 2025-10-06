# Polished Product Fluff Audit

Even with a "full" LoadMaster experience, several surface areas read more like vestigial experiments or marketing chrome than durable customer value. The sections below call out the most visible fluff so you can decide whether to trim, hide, or justify them in the polished release narrative.

## 1. Forced Business Setup + QA detours
- `Index` still imports and auto-navigates into the `BusinessSetupWizard` whenever the stored profile is incomplete, even marking sessionStorage flags to remember the override.【F:src/pages/Index.tsx†L24-L88】  
  This can feel like a defensive onboarding trap for returning users instead of a polished experience.
- The QA validation screen remains routable from the main switcher despite being an internal verification tool.【F:src/pages/Index.tsx†L30-L373】
- The same settings sheet links back into negotiation and business setup, doubling the navigation chrome without new functionality.【F:src/pages/Index.tsx†L374-L406】

**Trim option:** keep the wizard reachable from settings/help but drop the auto-redirect, and move QA tooling behind an internal flag so customers see a streamlined dashboard.

## 2. Negotiation mega-stack bolted onto the calculator
- The calculator wires in tier detection, plan billing, upgrade prompts, and feature flags before a user can run math.【F:src/components/LoadCalculator.tsx†L22-L98】
- It maintains a dense extras state (accessorial checkboxes, dimensions, stop counts) and passes them into negotiation engines, even though only a subset feeds the saved load record.【F:src/components/LoadCalculator.tsx†L101-L205】【F:src/components/LoadCalculator.tsx†L366-L406】
- A full negotiation workbench (`UnifiedNegotiationSheet`, `NegotiationPanel`, AI template suggestions) launches from the same page, turning a calculator into a sales coach.【F:src/components/LoadCalculator.tsx†L19-L195】

**Trim option:** gate the advanced negotiation workspace behind an explicit "Negotiate" action or dedicated route so the core calculator stays approachable.

## 3. Heavy OCR & AI ingestion for everyday entry
- Upload flows spin up Tesseract, SmartFieldDetector, telemetry logging, and cancellation semantics before any numbers hit the form.【F:src/components/LoadEntryMethod.tsx†L1-L200】
- The component also tracks usage limits and rate-limit bannering inside the OCR workflow, even though the index page already shows a global banner.【F:src/components/LoadEntryMethod.tsx†L23-L200】【F:src/pages/Index.tsx†L21-L492】

**Trim option:** ship OCR as an opt-in beta modal while leaving manual entry as the default polished path.

## 4. Persistent upgrade + tier chrome in a "Pro" environment
- `Index` forces `isPro={true}` when it renders the calculator and entry flows, yet the calculator still checks `useTierDetection`, `usePlan`, and toggles upgrade modals.【F:src/pages/Index.tsx†L331-L352】【F:src/components/LoadCalculator.tsx†L46-L118】
- This creates UI states (upgrade cards, tier debug logs) that surface even when the experience is already positioned as the full product.【F:src/components/LoadCalculator.tsx†L119-L215】【F:src/components/LoadCalculator.tsx†L336-L406】

**Trim option:** short-circuit tier checks when the hosting page already guarantees Pro access so only relevant controls render.

---
Paring back the above doesn’t remove flagship capabilities; it simply contains them so the polished product reads intentional instead of experimental.
