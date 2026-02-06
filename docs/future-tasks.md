# Future Enhancement: GPS-Based Deadhead Estimation

**Goal**: Auto-calculate deadhead miles using driver's current location and load pickup point.

**Status**: Backlog (implement after manual deadhead validates user demand)

## Approach Options

### 1. Google Routes API (preferred)
- Free tier: 10,000 calls/month
- Cost above free: $5/1,000 calls ($0.005 each)
- High accuracy with traffic data

### 2. Free Alternatives (fallback)
- OpenRouteService: 2,000 free calls/day
- HERE Freemium: 250,000 free/month
- Straight-line approximation with 1.3x multiplier

## Prerequisites
- Validate user demand for automatic deadhead
- User opt-in for location access
- Settings field: "Current Location" or GPS permission
- Error handling for GPS denial

## Implementation Tasks
- [ ] Add "Current Location" field to user settings
- [ ] Request GPS permission with clear explanation
- [ ] Create edge function for distance calculation API
- [ ] Auto-populate deadhead when origin entered
- [ ] Allow manual override of calculated distance
- [ ] Track API costs in analytics

## Technical Notes
- The `deadhead_miles` column already exists in the `loads` table
- Manual deadhead input was implemented in Phase 10
- This enhancement builds on top of the existing deadhead infrastructure
