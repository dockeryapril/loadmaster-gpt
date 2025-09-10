# LoadMaster GPT Supabase Secrets Setup

Run these commands in your terminal to set up the required secrets:

## Required Secrets

```bash
# OpenAI API Key (required)
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here

# Allowed Origins for CORS (required for production)
supabase secrets set ALLOWED_ORIGINS="https://www.loadmastergpt.com,http://localhost:5173"

# Supabase Configuration (required for rate limiting)
supabase secrets set SUPABASE_URL="https://zvqzucpwtpjjyeldgaeg.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key_here"

# Rate Limit Settings (updated for Free/Pro tiers)
supabase secrets set CORE_LIMIT_PER_DAY=4
supabase secrets set PRO_LIMIT_PER_DAY=100
```

## How to find your keys:

1. **OpenAI API Key**: Get from https://platform.openai.com/api-keys
2. **Supabase Service Role Key**: 
   - Go to your Supabase project settings
   - Navigate to API section
   - Copy the "service_role" key (not the anon key)

## Verify secrets are set:

```bash
supabase secrets list
```

## Notes:

- Free users get 4 OCR runs per week (resets Sundays)
- Pro users get 100 OCR runs per week (resets Sundays)
- The function will work without rate limiting if SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are missing
- ALLOWED_ORIGINS fallback allows localhost for development
- If rate limiting database setup is missing, run the SQL in `setup-rate-limiting.sql`