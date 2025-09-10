# LoadMaster GPT — Masterplan

## 🔍 App Overview & Objectives
LoadMaster GPT is a mobile-friendly web app designed to help non-forced dispatch truckers (primarily owner-operators and independent contractors) make faster, smarter decisions when evaluating load offers. It uses OCR to extract details from screenshots, calculates RPM and profit, color-codes the value of each load, and maintains a history for trend tracking and personalized evaluation.

### Goals:
- Save time evaluating loads
- Visualize value instantly (RPM + profit + weight impact)
- Track performance and trends over time
- Personalize decision-making with custom settings
- Keep data private, local, and offline-friendly

## 🎯 Target Audience
- Owner-operators and independent contractors
- Hotshot, expedite, and general freight drivers
- Drivers under **non-forced dispatch**

## 🧰 Core Features (MVP+)
- Upload screenshot for OCR extraction
- Auto-filled editable load calculator
- RPM calculation with user-defined thresholds
- Estimated take-home profit calculator (fuel, tolls, deadhead)
- Weight impact indicators
- Fuel Surcharge (FSC) field
- Load number/reference ID
- Driver notes per load
- Persistent load history (local storage)
- Auto-tagging based on thresholds
- Smart insights and summaries
- Embedded RPM + Profit trend graph
- Swipe-to-delete for entries
- Custom settings (fuel price, MPG, weight limits)
- CSV export of history

## 🧠 High-Level Technical Stack (Recommended)
- **Frontend:** React + Tailwind CSS
- **Platform:** PWA (mobile-first web app)
- **OCR:** Tesseract.js or similar JS-based OCR library
- **Data Persistence:** AsyncStorage or IndexedDB
- **State Management:** React Context or Zustand
- **Charts:** Recharts or Chart.js
- **Export:** CSV generation with browser APIs

## 📊 Conceptual Data Model
### Load Record:
- Load ID (UUID)
- Load Number (string)
- Origin City (string)
- Destination City (string)
- Miles (number)
- Rate (number)
- FSC (number)
- Weight (number)
- RPM (calculated)
- Estimated Fuel Cost
- Toll Estimate
- Deadhead Miles
- Net Profit (calculated)
- Date Added (timestamp)
- Source Image (optional, base64 or file path)
- User Notes (string)
- Tags (auto and manual)
- Flags (wasEdited, extractedFromOCR)

## 🖌️ UI/UX Design Principles
- Clean, minimal design
- Large tap targets for mobile
- Subtle animations for feedback
- Use whitespace and padding generously
- Color used sparingly but meaningfully (RPM/weight/profit)
- Quick access to insights without clutter

## 🔐 Security Considerations
- User authentication via Supabase Auth (email/password)
- Row Level Security (RLS) policies for data isolation
- Rate limiting to prevent abuse
- Secure edge functions for AI processing
- CORS protection for API endpoints

## 🪜 Development Phases or Milestones
### Phase 1 (MVP+):
- Dashboard screen with embedded trends
- Load entry flow (OCR + manual entry)
- RPM + take-home profit calculator
- Driver notes + smart thresholds
- Load history list with tags and color indicators

### Phase 2:
- Smart load insights (highest RPM lane, broker history)
- Auto-tagging enhancements
- Export CSV feature
- Expanded trend screen with filters and highlights

### Phase 3:
- Load Score (1–100)
- OCR template selection per load board
- Basic AI assistant (“Should I take this load?”)
- Cloud sync (optional)

## 🚧 Potential Challenges & Solutions
- **OCR accuracy:** Custom parsing logic per board (future)
- **User error:** Input validation + editable fields + confirmations
- **Data loss:** CSV export for backup; future cloud sync

## 🔮 Future Expansion Possibilities
- Broker rating overlays
- Load board API integrations
- Driver team sharing mode
- Personalized AI recommendations based on behavior
