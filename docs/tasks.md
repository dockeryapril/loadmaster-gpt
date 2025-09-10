# LoadMaster GPT - Development Tasks

## Current Sprint - Enhanced OCR + LLM Pipeline

### ✅ Completed Tasks
- [x] Added variable deadhead compensation options (varies_by_load, negotiated_per_load, tiered_by_distance, customer_dependent, minimum_plus_variable)
- [x] Updated business setup questions with new deadhead compensation types
- [x] Fixed setup completion logic for new conditional questions
- [x] Improved SetupBanner UI design - removed orange styling, made more professional
- [x] Added proper conditional question handling for all deadhead compensation types
- [x] Fixed premium options alignment in NegotiationSettings - standardized to 2-column layout
- [x] Moved Weight Threshold to separate row for consistent visual alignment
- [x] Improved Heavy Load labeling to clarify it's a cost adjustment (can be negative)
- [x] **OCR Usage Limit Fixes**: Fixed OCR usage counter exceeding limits (was showing 10/5)
  - Added `decrementOCRUsage()` function for rollback on failures
  - Moved `incrementOCRUsage()` to after successful API validation instead of at start
  - Added pre-flight checks to prevent OCR attempts when limits reached
  - Added rollback logic for rate limit errors, cancellations, and failures
  - Improved error handling to prevent usage increment on failed requests
- [x] **Upgrade Page Navigation**: Fixed upgrade links to scroll to top of page
  - Updated UpgradeCard "Upgrade to PRO" button to scroll to top after navigation
  - Updated footer "Unlock AI-powered negotiations" link to scroll to top after navigation
- [x] **UI Cleanup**: Removed duplicate Equipment Type dropdown from SimpleBusinessSetup
  - Eliminated redundant Equipment Type selection in Custom Setup section
  - Equipment selection now handled at top-level to avoid duplication
- [x] **Navigation Fix**: Fixed UpgradeCard button navigation to upgrade page
  - Removed setTimeout that was interfering with React Router navigation
  - Button now properly navigates to /upgrade when clicked
- [x] **Template Selection Feedback**: Added visual feedback for template selection in SimpleBusinessSetup
  - Selected templates now highlight with primary variant and ring
  - Only one template can be selected at a time
  - Manual input changes clear template selection automatically
- [x] **Enhanced PRO RPM Display**: Implemented Gross vs Net Take-Home RPM feature for PRO users
  - Added Gross RPM calculation (rate / miles before business costs)
  - Added Net Take-Home RPM calculation (after revenue split and fixed costs)
  - Enhanced LoadCalculator display with two-column RPM breakdown
  - Shows business impact details (revenue split %, fixed costs per mile, total impact)
  - Falls back to simple RPM display for non-PRO users or missing business setup data
  - Integrated with existing business setup (revenue split % and weekly fixed costs)
  - Updated LoadCalculationResult interface to support enhanced RPM data
- [x] **Fixed Business Setup Detection**: Resolved Quick Business Setup reappearing after completion
  - Replaced old simple setup logic (only checked revenueSplitPercentage and weeklyFixedCosts)
  - Integrated comprehensive setup system using useBusinessSetup hook and isSetupComplete()
  - Now properly detects when comprehensive business setup (8/9 questions) is complete
  - Users who've completed business setup go directly to dashboard instead of setup screen
  - Fixed conflict between simple and comprehensive business setup systems
- [x] **Fixed Business Setup Save Process**: Updated Simple Business Setup to create comprehensive records
  - Modified handleBusinessSetup to use saveSetup from useBusinessSetup hook instead of just updateSettings
  - Added equipment selection requirement to Simple Business Setup component
  - Maps simple setup values to comprehensive business setup record with reasonable defaults
  - Creates complete business_setup table record that satisfies isSetupComplete() validation
  - Users now properly redirected to dashboard after completing Simple Business Setup
- [x] **Enhanced OCR + LLM Pipeline**: Upgraded OCR feature with improved field detection and validation
  - Added detection for high-priority accessorials: detention pay, lumper fees, layover pay, hazmat premiums
  - Enhanced SmartFieldDetector with improved OCR error correction prompts
  - Added comprehensive validation warnings (flag suspicious data, don't reject)
  - Enhanced field validation patterns for better trucking document recognition
  - Updated LoadFields interface to support new accessorial fields
  - Improved OCR correction interface to display new accessorial fields
  - Enhanced OpenAI edge function with increased token limit for better responses
  - Added sophisticated data warnings (rate, weight, distance, accessorial validation)
  - Maintained cost-effectiveness by keeping GPT-4o-mini model
- [x] **Enhanced Rate Detection**: Improved rate extraction from trucking documents
  - Added priority detection for "OFFER AMOUNT", "TOTAL PAY", "GROSS AMOUNT", "LOAD PAY" labels
  - Enhanced LLM prompts with specific trucking terminology and rate patterns
  - Improved fallback regex with priority-based pattern matching
  - Enhanced validation for comma-separated amounts (e.g., "$1,405.24")
  - Added debug logging for rate detection troubleshooting
  - Fixed issue where smaller amounts were incorrectly selected over main rate amounts
- [x] **Enhanced Miles Confidence Detection**: Upgraded miles field confidence assignment
  - Implemented smart pattern scoring instead of hardcoded "medium" confidence
  - Added multiple priority patterns for miles detection (high: "817 mi", medium: "distance: 817", low: context-based)
  - Created confidence calculation based on pattern quality and value reasonableness
  - Enhanced fallback detection with pattern-specific confidence assignment
  - Added value-based confidence adjustments for realistic mile ranges (50-2000 miles)
  - Clear patterns like "817 mi" now correctly receive "high" confidence

### ✅ Recently Completed Tasks
- [x] **Documentation Conflicts Resolution**: Fixed existing documentation conflicts
  - Updated supabase-secrets-setup.md to use Free/Pro terminology and correct weekly limits (4/week Free, 100/week Pro)
  - Updated masterplan.md with current Supabase-based architecture and authentication system
  - Corrected rate limiting references from daily to weekly limits
- [x] **Comprehensive Documentation Suite**: Created 5 complete instruction documents
  - User Guide: Complete user-facing documentation covering all features (Free/Pro)
  - Admin Guide: Business owner and fleet manager documentation
  - Developer Guide: Technical documentation for developers and DevOps
  - Business Setup Guide: Detailed configuration guidance for trucking operations
  - Support Guide: Technical support procedures and troubleshooting

### 🔄 In Progress Tasks
- [ ] Testing setup completion detection with all question types
- [ ] Validating conditional question logic for complex compensation structures

- [x] **Implemented Free/Pro Weekly Upload System**: Complete restructure from Lite/Core/Pro to Free/Pro model
  - Added weekly upload tracking (Free: 4/week, Pro: 100/week) with Sunday reset
  - Created useWeeklyUploads hook for Supabase-based weekly counter management
  - Built WeeklyLimitReached lockout page with Stripe checkout integration
  - Updated Upgrade page with new Free/Pro pricing and copy
  - Created WeeklyLimitBanner for usage warnings and limit notifications
  - Updated LoadEntryMethod to use weekly limits and redirect to lockout page
  - Created create-pro-subscription edge function for $10/month Pro subscriptions
  - Added database migration for weekly_upload_count and week_start_date columns
  - Updated tier display system to show "Free" instead of "Lite" in UI
  - Removed all Lite/Core references and replaced with Free/Pro terminology
  - Integrated weekly limit checking with upload buttons (OCR/camera)
  - Manual entry remains unlimited for all users as requested
- [ ] Add business setup profiles for different trucking arrangements (owner-operator, lease-operator, company driver)
- [ ] Implement setup validation against industry benchmarks
- [ ] Add setup data export/import functionality
- [ ] Create setup completion analytics and insights

### 🧪 Testing Required
1. **Setup Completion Logic**: Test all question combinations to ensure 100% completion is achievable
2. **Conditional Questions**: Verify deadhead compensation questions show/hide correctly based on selection
3. **UI Design**: Confirm SetupBanner uses proper semantic tokens and professional styling

### 📝 Notes
- Setup system now supports complex deadhead compensation scenarios common in trucking
- Banner design improved to be less pushy and more professional
- Completion logic enhanced to handle all conditional dependencies