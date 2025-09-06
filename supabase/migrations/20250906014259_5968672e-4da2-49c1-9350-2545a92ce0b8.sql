-- Add new columns for equipment-specific settings
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS use_equipment_defaults BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS equipment_rpm_overrides JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS equipment_mpg_overrides JSONB DEFAULT '{}';

-- Update fuel price default to current market average
UPDATE user_settings 
SET fuel_price = 3.89 
WHERE fuel_price = 3.50;

-- Create index for better performance on equipment settings
CREATE INDEX IF NOT EXISTS idx_user_settings_equipment_overrides 
ON user_settings USING GIN (equipment_rpm_overrides, equipment_mpg_overrides);

-- Add helpful comment
COMMENT ON COLUMN user_settings.use_equipment_defaults IS 'Whether to use industry-standard equipment-specific defaults for MPG and RPM calculations';
COMMENT ON COLUMN user_settings.equipment_rpm_overrides IS 'User-specific RPM targets per equipment type (JSON: {cargo_van: {green: 2.1, yellow: 1.8, red: 1.5}, ...})';
COMMENT ON COLUMN user_settings.equipment_mpg_overrides IS 'User-specific MPG settings per equipment type (JSON: {cargo_van: 15, straight_truck: 8, hotshot: 6.5})';