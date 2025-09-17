# LoadMaster GPT - Developer Documentation

**Version:** 2.0  
**Last Updated:** January 2024  
**Target Audience:** Developers, Technical Team, DevOps Engineers

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Development Environment](#development-environment)
3. [Project Structure](#project-structure)
4. [Authentication System](#authentication-system)
5. [Database Schema](#database-schema)
6. [OCR Engine](#ocr-engine)
7. [Negotiation Engine](#negotiation-engine)
8. [API Documentation](#api-documentation)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Monitoring & Debugging](#monitoring-debugging)

---

## Architecture Overview

### Technology Stack
```
Frontend:  React 18 + TypeScript + Tailwind CSS + Vite
Backend:   Supabase (PostgreSQL + Edge Functions + Auth)
OCR:       Tesseract.js + OpenAI GPT-4o-mini
State:     React Context + React Query (@tanstack/react-query)
UI:        Radix UI components (shadcn/ui)
Charts:    Recharts
Testing:   Vitest + React Testing Library
Deploy:    Vercel (Frontend) + Supabase (Backend)
```

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │ ── │  Supabase API   │ ── │  PostgreSQL DB  │
│                 │    │                 │    │                 │
│ • OCR Interface │    │ • Row Level     │    │ • User Data     │
│ • Load Calc     │    │   Security      │    │ • Load History  │
│ • Negotiation   │    │ • Edge Functions│    │ • Settings      │
│ • Dashboard     │    │ • Real-time API │    │ • Rate Limits   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         └────────────── │ External APIs   │
                         │                 │
                         │ • OpenAI GPT    │
                         │ • Stripe        │
                         │ • Tesseract.js  │
                         └─────────────────┘
```

### Core Components
- **React Frontend:** Mobile-first PWA with responsive design
- **Supabase Backend:** Database, auth, edge functions, real-time sync
- **OCR Pipeline:** Tesseract.js → OpenAI field extraction → validation
- **Business Logic:** Load calculations, RPM analysis, profit estimation
- **User Management:** Authentication, subscription tiers, rate limiting

---

## Development Environment

### Prerequisites
```bash
# Required versions
Node.js >= 18.0.0
npm >= 8.0.0
Git >= 2.30.0

# Optional but recommended
Supabase CLI >= 1.100.0
```

### Environment Setup
```bash
# 1. Clone repository
git clone <repository-url>
cd loadmaster-gpt

# 2. Install dependencies
npm install

# 3. Environment configuration
cp .env.example .env
# Edit .env with your configuration

# 4. Start development server
npm run dev

# 5. Run Supabase locally (optional)
supabase start
```

### Environment Variables
```bash
# .env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Secrets (set via CLI)
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:5173
```

### Development Scripts
```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build

# Testing
npm run test         # Run all tests
npm run test:watch   # Watch mode
npm run test:ui      # Testing UI
npm run coverage     # Coverage report

# Linting & Formatting
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix lint issues
npm run type-check   # TypeScript check

# Database
npm run db:start     # Start Supabase locally
npm run db:stop      # Stop local Supabase
npm run db:reset     # Reset local database
```

---

## Project Structure

### Directory Organization
```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components (shadcn)
│   ├── Dashboard.tsx    # Main dashboard
│   ├── LoadCalculator.tsx
│   └── ...
├── contexts/            # React contexts
│   ├── AuthContext.tsx  # Authentication state
│   └── RateLimitContext.tsx
├── hooks/               # Custom React hooks
│   ├── useAuth.ts
│   ├── useOCRProcessor.ts
│   └── ...
├── integrations/        # External service integrations
│   └── supabase/
│       ├── client.ts    # Supabase client setup
│       └── types.ts     # Auto-generated types
├── lib/                 # Utility libraries
│   ├── utils.ts         # General utilities
│   └── normalize.ts     # Data normalization
├── pages/               # Page components
│   ├── Index.tsx        # Home/Dashboard page
│   ├── Auth.tsx         # Authentication page
│   └── ...
├── types/               # TypeScript type definitions
│   ├── load.ts          # Load data types
│   ├── negotiation.ts   # Negotiation types
│   └── ...
├── utils/               # Business logic utilities
│   ├── apiWrapper.ts    # API wrapper with error handling
│   ├── OCRPreprocessor.ts
│   └── ...
└── ai/                  # AI/OCR related code
    ├── extractText.ts   # Tesseract integration
    ├── extractVision.ts # OpenAI integration
    └── ...

supabase/
├── functions/           # Edge functions
│   ├── openai-chat/     # OCR field extraction
│   └── create-pro-subscription/
├── migrations/          # Database migrations
└── config.toml         # Supabase configuration
```

### Key Components Architecture

#### Load Calculator Component
```typescript
// src/components/LoadCalculator.tsx
interface LoadCalculatorProps {
  initialData?: Partial<LoadFields>;
  onCalculationComplete: (result: LoadCalculationResult) => void;
  showBusinessBreakdown?: boolean; // Pro feature
}

// Handles:
// - Form validation and submission
// - Real-time calculations
// - Pro/Free feature differentiation
// - Equipment-aware calculations
```

#### OCR Processing Pipeline
```typescript
// src/hooks/useOCRProcessor.ts
interface OCRProcessor {
  processImage: (file: File) => Promise<LoadFields>;
  status: 'idle' | 'processing' | 'success' | 'error';
  error: string | null;
}

// Pipeline stages:
// 1. Image preprocessing (contrast, resize)
// 2. Tesseract OCR extraction
// 3. OpenAI field detection and correction
// 4. Validation and confidence scoring
```

#### Authentication Context
```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
```

---

## Authentication System

### Supabase Auth Integration
```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);
```

### User Session Management
```typescript
// Session handling with automatic refresh
useEffect(() => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      setUser(session.user);
    } else if (event === 'SIGNED_OUT') {
      setUser(null);
    } else if (event === 'TOKEN_REFRESHED' && session) {
      setUser(session.user);
    }
  });

  return () => subscription.unsubscribe();
}, []);
```

### Row Level Security (RLS)
```sql
-- Example RLS policy for user_settings table
CREATE POLICY "Users can only access their own settings" 
ON user_settings 
FOR ALL 
USING (auth.uid() = user_id);

-- All user data tables have similar policies
-- Ensures complete data isolation between users
```

### Protected Route Component
```typescript
// src/components/ProtectedRoute.tsx
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) {
    window.location.href = '/auth';
    return null;
  }
  
  return <>{children}</>;
}
```

---

## Database Schema

### Core Tables
```sql
-- User settings and preferences
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  fuel_price DECIMAL(5,3) DEFAULT 3.500,
  vehicle_mpg DECIMAL(4,1) DEFAULT 10.0,
  good_rpm_threshold DECIMAL(4,2) DEFAULT 2.00,
  fair_rpm_threshold DECIMAL(4,2) DEFAULT 1.50,
  weekly_upload_count INTEGER DEFAULT 0,
  week_start_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Business setup configuration
CREATE TABLE business_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  equipment_type VARCHAR(50) NOT NULL,
  revenue_split_percentage INTEGER DEFAULT 100,
  weekly_fixed_costs DECIMAL(8,2) DEFAULT 0,
  deadhead_compensation VARCHAR(50),
  -- ... additional business fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Load history
CREATE TABLE loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  origin_city VARCHAR(255),
  destination_city VARCHAR(255),
  miles INTEGER,
  rate DECIMAL(8,2),
  fuel_surcharge DECIMAL(8,2) DEFAULT 0,
  weight INTEGER,
  load_number VARCHAR(100),
  notes TEXT,
  -- Calculated fields
  rpm DECIMAL(4,2),
  fuel_cost DECIMAL(8,2),
  estimated_profit DECIMAL(8,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Indexes & Performance
```sql
-- Performance indexes
CREATE INDEX idx_loads_user_id_created_at ON loads(user_id, created_at DESC);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_business_setup_user_id ON business_setup(user_id);

-- Partial indexes for active data
CREATE INDEX idx_loads_recent ON loads(user_id, created_at) 
  WHERE created_at > (now() - interval '90 days');
```

### Database Functions
```sql
-- Monthly usage reset helper
CREATE OR REPLACE FUNCTION reset_usage_if_needed(p_user_id uuid)
RETURNS void AS $$
DECLARE
  settings_record RECORD;
  new_month_start date;
BEGIN
  SELECT current_month_start
  INTO settings_record
  FROM user_settings
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  new_month_start := (date_trunc('month', CURRENT_DATE))::date;

  IF settings_record.current_month_start IS NULL OR settings_record.current_month_start < new_month_start THEN
    UPDATE user_settings
    SET monthly_usage_count = 0,
        current_month_start = new_month_start,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## OCR Engine

### Tesseract.js Integration
```typescript
// src/ai/extractText.ts
import { createWorker } from 'tesseract.js';

export async function extractTextFromImage(file: File): Promise<string> {
  const worker = await createWorker();
  
  try {
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    // Configure for better text detection
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,/$()- ',
      preserve_interword_spaces: '1',
    });

    const { data: { text } } = await worker.recognize(file);
    return text;
  } finally {
    await worker.terminate();
  }
}
```

### OpenAI Field Extraction
```typescript
// src/ai/extractVision.ts
interface FieldExtractionResult {
  fields: Partial<LoadFields>;
  confidence: Record<string, 'high' | 'medium' | 'low'>;
  warnings: string[];
}

export async function extractFieldsFromText(
  ocrText: string
): Promise<FieldExtractionResult> {
  const response = await supabase.functions.invoke('openai-chat', {
    body: {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a trucking industry expert...`
        },
        {
          role: 'user',
          content: `Extract load information from: ${ocrText}`
        }
      ]
    }
  });
  
  return response.data;
}
```

### Image Preprocessing
```typescript
// src/utils/OCRPreprocessor.ts
export class OCRPreprocessor {
  static async preprocessImage(file: File): Promise<File> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = await this.loadImage(file);
    
    // Resize for optimal OCR (target ~1000px width)
    const scale = Math.min(1000 / img.width, 1000 / img.height, 1);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    
    // Draw with contrast enhancement
    ctx.filter = 'contrast(150%) brightness(110%)';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    return this.canvasToFile(canvas, file.type);
  }
}
```

### Smart Field Detection
```typescript
// src/utils/SmartFieldDetector.ts
export class SmartFieldDetector {
  static detectRate(text: string): { value: number; confidence: string } {
    const patterns = [
      { regex: /\$[\d,]+\.?\d*/g, priority: 'high' },
      { regex: /TOTAL[:\s]+\$?([\d,]+\.?\d*)/i, priority: 'high' },
      { regex: /RATE[:\s]+\$?([\d,]+\.?\d*)/i, priority: 'medium' }
    ];
    
    // Priority-based pattern matching with confidence scoring
    for (const pattern of patterns) {
      const matches = text.match(pattern.regex);
      if (matches) {
        const value = this.parseAmount(matches[0]);
        return { 
          value, 
          confidence: pattern.priority as 'high' | 'medium' | 'low'
        };
      }
    }
    
    return { value: 0, confidence: 'low' };
  }
}
```

---

## Negotiation Engine

### Message Templates System
```typescript
// src/features/negotiation/templates.ts
interface MessageTemplate {
  id: string;
  name: string;
  category: 'rate_negotiation' | 'detention' | 'accessorials';
  template: string;
  variables: string[];
}

export const NEGOTIATION_TEMPLATES: MessageTemplate[] = [
  {
    id: 'rate_increase_professional',
    name: 'Professional Rate Increase',
    category: 'rate_negotiation',
    template: `I appreciate the load offer for {origin} to {destination}. 
    Given the current market conditions and my operating costs for this {miles}-mile run, 
    I would need ${targetRate} to make this work profitably. 
    I can guarantee on-time delivery with my {safetyRecord} safety record.`,
    variables: ['origin', 'destination', 'miles', 'targetRate', 'safetyRecord']
  }
];
```

### AI Message Enhancement
```typescript
// src/features/negotiation/enhanceWithAI.ts
interface EnhancementRequest {
  userMessage: string;
  context: LoadContext;
  tone: 'professional' | 'direct' | 'friendly';
  channel: 'phone' | 'email' | 'loadboard';
}

export async function enhanceMessage(
  request: EnhancementRequest
): Promise<string> {
  const response = await supabase.functions.invoke('openai-chat', {
    body: {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional trucking negotiation expert.
          Transform the user's message into a ${request.tone} ${request.channel} communication.
          Context: ${JSON.stringify(request.context)}`
        },
        {
          role: 'user',
          content: request.userMessage
        }
      ]
    }
  });
  
  return response.data.choices[0].message.content;
}
```

### Negotiation Context
```typescript
// src/types/negotiation.ts
interface LoadContext {
  origin: string;
  destination: string;
  miles: number;
  currentRate: number;
  targetRate: number;
  equipment: string;
  urgency?: 'standard' | 'expedited' | 'emergency';
  marketConditions?: 'tight' | 'normal' | 'soft';
}

interface NegotiationSettings {
  defaultTone: 'professional' | 'direct' | 'friendly';
  preferredChannel: 'phone' | 'email' | 'loadboard';
  autoEnhance: boolean;
  customTemplates: MessageTemplate[];
}
```

---

## API Documentation

### Supabase Edge Functions

#### OpenAI Chat Function
```typescript
// supabase/functions/openai-chat/index.ts
interface OpenAIRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
}

export default async function handler(req: Request): Promise<Response> {
  // CORS handling
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Rate limiting
  const deviceId = req.headers.get('x-device-id');
  if (deviceId) {
    const usage = await checkRateLimit(deviceId);
    if (usage > DAILY_LIMIT) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429 }
      );
    }
  }

  // OpenAI API call
  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return new Response(await openaiResponse.text(), {
    status: openaiResponse.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

#### Pro Subscription Function
```typescript
// supabase/functions/create-pro-subscription/index.ts
interface SubscriptionRequest {
  userId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export default async function handler(req: Request): Promise<Response> {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2023-10-16',
  });

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    payment_method_types: ['card'],
    line_items: [{ price: request.priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: request.successUrl,
    cancel_url: request.cancelUrl,
    metadata: { userId: request.userId },
  });

  return new Response(JSON.stringify({ url: session.url }));
}
```

### Client-Side API Wrapper
```typescript
// src/utils/apiWrapper.ts
export class RateLimitExceededError extends Error {
  constructor(message: string, public resetTime: Date) {
    super(message);
    this.name = 'RateLimitExceededError';
  }
}

export async function callOpenAIFunction(
  messages: ChatMessage[]
): Promise<OpenAIResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('openai-chat', {
      body: { model: 'gpt-4o-mini', messages }
    });
    
    if (error?.status === 429) {
      throw new RateLimitExceededError(
        'Daily OCR limit exceeded',
        new Date(Date.now() + 24 * 60 * 60 * 1000)
      );
    }
    
    return data;
  } catch (error) {
    console.error('OpenAI function call failed:', error);
    throw error;
  }
}
```

---

## Testing

### Test Architecture
```typescript
// src/test/setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Supabase client for testing
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

afterEach(() => {
  cleanup();
});
```

### Component Testing
```typescript
// src/test/components/LoadCalculator.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoadCalculator } from '@/components/LoadCalculator';

describe('LoadCalculator', () => {
  it('calculates RPM correctly', async () => {
    render(<LoadCalculator />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText(/miles/i), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/rate/i), { target: { value: '1000' } });
    
    // Verify calculation
    await waitFor(() => {
      expect(screen.getByText(/\$2\.00/)).toBeInTheDocument(); // RPM
    });
  });
  
  it('shows pro features for pro users', () => {
    render(<LoadCalculator showBusinessBreakdown={true} />);
    
    expect(screen.getByText(/gross rpm/i)).toBeInTheDocument();
    expect(screen.getByText(/net take-home/i)).toBeInTheDocument();
  });
});
```

### Integration Testing
```typescript
// src/test/integration/ocrDataFlow.test.ts
describe('OCR Data Flow Integration', () => {
  it('processes image through complete pipeline', async () => {
    const mockImage = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Mock Tesseract response
    vi.mocked(createWorker).mockResolvedValue({
      recognize: vi.fn().mockResolvedValue({
        data: { text: 'LOAD: DAL to HOU, 250 miles, $500' }
      })
    } as any);
    
    // Mock OpenAI response
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: {
        fields: {
          origin_city: 'Dallas, TX',
          destination_city: 'Houston, TX',
          miles: 250,
          rate: 500
        },
        confidence: { rate: 'high', miles: 'high' }
      }
    });
    
    const result = await processOCRImage(mockImage);
    
    expect(result.fields.origin_city).toBe('Dallas, TX');
    expect(result.fields.rate).toBe(500);
  });
});
```

### Business Logic Testing
```typescript
// src/test/businessSetup.test.ts
describe('Business Setup Logic', () => {
  it('calculates net RPM correctly for pro users', () => {
    const businessSetup = {
      revenue_split_percentage: 80, // Driver keeps 80%
      weekly_fixed_costs: 1000,
      equipment_type: 'straight_truck'
    };
    
    const loadData = {
      rate: 2000,
      miles: 500
    };
    
    const result = calculateEnhancedRPM(loadData, businessSetup);
    
    expect(result.grossRPM).toBe(4.00); // $2000 / 500 miles
    expect(result.netRPM).toBeLessThan(4.00); // After split and costs
    expect(result.businessImpact).toHaveProperty('revenueSplit');
  });
});
```

### Coverage Requirements
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

---

## Deployment

### Production Environment
```yaml
# vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "functions": {
    "app/api/*.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Environment Configuration
```bash
# Production environment variables (Vercel)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Supabase Edge Function Secrets
supabase secrets set OPENAI_API_KEY=your-key
supabase secrets set STRIPE_SECRET_KEY=your-key
supabase secrets set ALLOWED_ORIGINS="https://yourdomain.com"
```

### Build Process
```bash
# Production build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test:ci

# Deploy to Vercel
vercel --prod
```

### Database Migrations
```bash
# Create new migration
supabase migration new migration_name

# Apply migrations to production
supabase db push

# Verify migration
supabase db diff
```

### Monitoring Setup
```typescript
// Error tracking and performance monitoring
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Performance monitoring
const performance = {
  measureOCRProcessing: (duration: number) => {
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `OCR processing took ${duration}ms`,
      level: 'info',
    });
  }
};
```

---

## Monitoring & Debugging

### Debug Mode
```typescript
// src/utils/debug.ts
export const DEBUG = new URLSearchParams(window.location.search).get('debug') === '1';

export function debugLog(message: string, data?: any) {
  if (DEBUG) {
    console.log(`[LoadMaster Debug] ${message}`, data);
  }
}

// Usage in components
if (DEBUG) {
  console.log('OCR processing started', { file: file.name, size: file.size });
}
```

### Error Handling
```typescript
// src/utils/errorLogger.ts
export class ErrorLogger {
  static async logError(error: Error, context: Record<string, any>) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Log to Sentry or similar service
    Sentry.captureException(error, { extra: errorData });
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorData);
    }
  }
}
```

### Performance Monitoring
```typescript
// src/utils/perfMetrics.ts
export class PerformanceMonitor {
  static measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    
    return fn().finally(() => {
      const duration = performance.now() - start;
      debugLog(`${name} completed in ${duration.toFixed(2)}ms`);
      
      // Send to analytics
      if (window.gtag) {
        window.gtag('event', 'timing_complete', {
          name,
          value: Math.round(duration)
        });
      }
    });
  }
}
```

### Health Checks
```typescript
// Health monitoring for critical services
export async function healthCheck(): Promise<HealthStatus> {
  const checks = await Promise.allSettled([
    checkSupabaseConnection(),
    checkOpenAIFunction(),
    checkStripeService()
  ]);
  
  return {
    supabase: checks[0].status === 'fulfilled',
    openai: checks[1].status === 'fulfilled',
    stripe: checks[2].status === 'fulfilled',
    timestamp: new Date().toISOString()
  };
}
```

---

## API Reference

### Load Calculation Engine
```typescript
interface LoadCalculationEngine {
  calculateBasicRPM(rate: number, miles: number): number;
  calculateEnhancedRPM(
    load: LoadData, 
    business: BusinessSetup
  ): EnhancedRPMResult;
  estimateProfit(
    load: LoadData, 
    settings: UserSettings
  ): ProfitEstimation;
}
```

### OCR Processing Pipeline
```typescript
interface OCRPipeline {
  processImage(file: File): Promise<OCRResult>;
  preprocessImage(file: File): Promise<File>;
  extractText(file: File): Promise<string>;
  extractFields(text: string): Promise<FieldExtractionResult>;
  validateFields(fields: LoadFields): ValidationResult;
}
```

### User Management
```typescript
interface UserManager {
  getCurrentUser(): Promise<User | null>;
  updateUserSettings(settings: Partial<UserSettings>): Promise<void>;
  getUserPlan(): Promise<'free' | 'pro'>;
  checkUploadLimits(): Promise<UploadLimitInfo>;
}
```

---

*This developer documentation covers the core technical aspects of LoadMaster GPT. For business logic and user experience details, refer to the User Guide and Admin Guide documentation.*