-- Create affiliate_offers table
CREATE TABLE affiliate_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  placement TEXT[] NOT NULL,
  conditions JSONB DEFAULT '{}'::jsonb,
  priority INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE affiliate_offers ENABLE ROW LEVEL SECURITY;

-- Public read policy (everyone can see active offers)
CREATE POLICY "Anyone can read active offers" ON affiliate_offers
  FOR SELECT USING (is_active = true);

-- Create affiliate_clicks table
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES affiliate_offers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert clicks (including anonymous users)
CREATE POLICY "Anyone can insert clicks" ON affiliate_clicks
  FOR INSERT WITH CHECK (true);

-- Only admins can read clicks for analytics
CREATE POLICY "Admins can read all clicks" ON affiliate_clicks
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed data
INSERT INTO affiliate_offers (slug, name, category, description, url, placement, conditions, priority) VALUES
  ('factoring_triumph', 'Triumph Factoring', 'factoring', 
   'Get paid same-day on your loads. No hidden fees, simple 3% flat rate.', 
   'https://example.com/triumph?ref=loadmaster', 
   ARRAY['dashboard', 'offer_result'], 
   '{"required_signals": ["low_rpm_offer"]}', 10),
   
  ('fuel_card_ats', 'ATS Fuel Card', 'fuel_card', 
   'Save 15¢/gallon at over 8,000 truck stops nationwide.', 
   'https://example.com/ats-fuel?ref=loadmaster', 
   ARRAY['dashboard'], 
   '{"requires_user_pays_fuel": true}', 20),
   
  ('tax_atbs', 'ATBS Tax Services', 'tax_software', 
   'Trucking-specific tax prep. Maximize deductions, minimize stress.', 
   'https://example.com/atbs?ref=loadmaster', 
   ARRAY['dashboard', 'empty_state'], 
   '{}', 30),
   
  ('load_board_dat', 'DAT Load Board', 'load_board', 
   'Find more loads with the #1 load board. Try free for 30 days.', 
   'https://example.com/dat?ref=loadmaster', 
   ARRAY['empty_state'], 
   '{"requires_has_offer_history": false}', 15),
   
  ('insurance_ooida', 'OOIDA Insurance', 'insurance', 
   'Owner-operator focused coverage. Competitive rates for independents.', 
   'https://example.com/ooida?ref=loadmaster', 
   ARRAY['dashboard', 'offer_result'], 
   '{"equipment_types": ["hotshot", "straight_truck"]}', 25);