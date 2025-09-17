# LoadMaster GPT Supabase Secrets Setup

Run these commands in your terminal to set up the required secrets:

## Required Secrets

```bash
# OpenAI API Key (required)
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here

# Allowed Origins for CORS (required for production)
supabase secrets set ALLOWED_ORIGINS="https://www.loadmastergpt.com,http://localhost:5173"

# Supabase Configuration (required for usage tracking)
supabase secrets set SUPABASE_URL="https://zvqzucpwtpjjyeldgaeg.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key_here"
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

- Free users get 5 AI runs per month (resets on the 1st of each month)
- Pro users get 100 AI runs per month (resets based on subscription renewal date)
- The function requires SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY to enforce usage tracking
- ALLOWED_ORIGINS fallback allows localhost for development