# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/7b6e4b51-f031-49bf-b926-3f276a952c00

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/7b6e4b51-f031-49bf-b926-3f276a952c00) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected
in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/7b6e4b51-f031-49bf-b926-3f276a952c00) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Testing

Comprehensive automated test suite covering ~85% of critical functionality:

```bash
# Run all tests
npm run test

# Run tests in watch mode  
npm run test:watch

# Run with coverage
npm run test:coverage
```

**Test Coverage:**
- ✅ Business setup calculations, OCR processing, integration flows, error handling
- ⚠️ Semi-automated: OCR accuracy (requires sample images)
- 🔧 Manual: UI/UX, camera integration, cross-browser compatibility

## Environment Variables

The project requires the following environment variables:

- `SUPABASE_URL` – URL of your Supabase project.
- `SUPABASE_ANON_KEY` – anonymous key for your Supabase project.
- `OPENAI_API_KEY` – your OpenAI API key.
- `ALLOWED_ORIGINS` – comma-separated list of allowed origins for CORS. Requests from origins outside this list will receive a `403` response.

## Cargo Van and Straight Truck Support

The calculator supports cargo vans and straight trucks with built-in surcharges for common extras. Defaults are applied automatically when the related toggle is enabled.

### Default surcharge values

| Cargo Van | Amount |
|-----------|-------:|
| Rush (pickup within 6&nbsp;hrs) | $50 |
| Weekend | $50 |
| After hours | $50 |
| Inside delivery | $50 |
| Residential | $50 |
| Multi-stop (per extra stop) | $30 |

| Straight Truck | Amount |
|----------------|-------:|
| Rush (pickup within 6&nbsp;hrs) | $125 |
| Weekend | $75 |
| Inside delivery | $50 |
| Residential | $75 |
| Liftgate | $75 |
| Pallet jack | $50 |
| Multi-stop (per extra stop) | $50 |

### Enabling extras in the calculator

1. Choose **Cargo Van** or **Straight Truck** in the equipment dropdown.
2. Open the **Extras** section.
3. Toggle options like **Weekend**, **After Hours**, **Inside**, **Residential**, **Liftgate**, **Pallet Jack**, or set the number of **Stops**.
4. The calculator adds the corresponding surcharge to the settle‑for rate and negotiation guidance.

These default surcharge values are defined in [`packages/engine/src/equipmentProfiles.ts`](packages/engine/src/equipmentProfiles.ts).

## Negotiation templates and AI polishing

- **File locations**
  - Script templates: [`src/features/negotiation/templates.ts`](src/features/negotiation/templates.ts)
  - AI polish helper: [`src/features/negotiation/enhanceWithAI.ts`](src/features/negotiation/enhanceWithAI.ts)

### Modifying templates, tone, and channel

- Edit `templates.ts` to change how ask, settle, and bottom scripts are generated.
- To add or adjust tone or channel options, update the `Tone` and `Channel` types and their related logic in `buildMessage` and `channelWrap`.

### Enabling the AI polish button

- The **Improve with AI** button in the negotiation panel sends the current script to the `enhanceWithAI` helper, which calls the `openai-chat` Edge Function via `callOpenAIWithRateLimit`.
- This button appears only for **Pro** plan users (`usePlan` hook). Upgrade to Pro and ensure the Edge Function is deployed to enable AI polishing.
