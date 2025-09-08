# LoadMaster GPT - Development Tasks

## Current Sprint - Setup System Improvements

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

### 🔄 In Progress Tasks
- [ ] Testing setup completion detection with all question types
- [ ] Validating conditional question logic for complex compensation structures

### 📋 Upcoming Tasks
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