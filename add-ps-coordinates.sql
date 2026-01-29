-- Quick fix: Add sample coordinates to existing police stations in Delhi
-- This will add coordinates for the first 10 police stations

UPDATE "PoliceStation"
SET
  latitude = 28.6139 + (RANDOM() * 0.2 - 0.1),  -- Random latitude around Delhi center
  longitude = 77.2090 + (RANDOM() * 0.2 - 0.1)  -- Random longitude around Delhi center
WHERE latitude IS NULL OR longitude IS NULL;

-- Verify the update
SELECT id, name, code, latitude, longitude
FROM "PoliceStation"
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
LIMIT 10;
