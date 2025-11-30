-- Update affiliate offers to show only DAT, ATBS, and OOIDA on dashboard

-- Update DAT Load Board: add dashboard placement, remove restrictions
UPDATE affiliate_offers 
SET 
  placement = ARRAY['dashboard', 'empty_state'],
  conditions = '{}'::jsonb,
  priority = 10
WHERE slug = 'load_board_dat';

-- Update ATBS Tax Services: ensure dashboard placement
UPDATE affiliate_offers 
SET 
  placement = ARRAY['dashboard', 'empty_state'],
  priority = 20
WHERE slug = 'tax_atbs';

-- Update OOIDA Insurance: remove equipment restrictions
UPDATE affiliate_offers 
SET 
  placement = ARRAY['dashboard'],
  conditions = '{}'::jsonb,
  priority = 30
WHERE slug = 'insurance_ooida';

-- Deactivate other offers for now
UPDATE affiliate_offers 
SET is_active = false
WHERE slug IN ('factoring_triumph', 'fuel_card_ats');