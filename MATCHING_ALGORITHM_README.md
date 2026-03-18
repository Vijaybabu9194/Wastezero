# Volunteer-Opportunity Matching Algorithm

## Overview
This system uses a weighted ranking algorithm to recommend volunteers for an opportunity based on:
- Waste type compatibility
- Geographic proximity

The goal is to help NGOs assign the most suitable volunteer quickly and transparently.

## Inputs
For each opportunity:
- `wasteTypes` (primary)
- `requiredSkills` (fallback)
- `location.coordinates` (`lat`, `lng`)

For each volunteer:
- `skills`
- `address.coordinates` (`lat`, `lng`)
- account status checks (`isActive`, agent verification)

## Scoring Method
### 1. Waste-Type Score
Compute overlap between required waste tags and volunteer skills.

If an opportunity has required tags:
- `wasteTypeScore = matchedTags / requiredTags`

If no required tags are provided:
- `wasteTypeScore = 0`

Range: `0` to `1`

### 2. Location Score
Distance is calculated using the Haversine formula (great-circle distance from lat/lng).

- Distance is bounded by `maxDistanceKm`
- `locationScore = 1 - (boundedDistance / maxDistanceKm)`

Range: `0` to `1` (higher is closer)

### 3. Final Score
The final score is a weighted combination:

`finalScore = 0.7 * wasteTypeScore + 0.3 * locationScore`

Volunteers are sorted by:
1. Higher `finalScore`
2. Lower distance (tie-break)

## Why This Approach
This algorithm is a strong fit for Wastezero because it is:
- Relevant: optimizes for skill fit and travel practicality
- Explainable: NGOs can understand why someone is ranked higher
- Fast: suitable for real-time assignment APIs
- Tunable: weights can be adjusted as operations evolve
- Robust: still works when some location data is missing

## Why It Is Best Here
For the current workflow (user posts opportunity -> NGO assigns volunteer), this is the best practical approach because it balances:
- Assignment quality
- Operational speed
- Simplicity and maintainability

A machine learning model is not necessary yet and would increase complexity without clear added value at this stage.

## Current Endpoint Behavior
The ranking powers NGO volunteer suggestions for accepted opportunities.

Key endpoint:
- `GET /api/opportunities/:id/volunteer-matches`

Returns ranked volunteers with:
- `score`
- `scoreBreakdown` (`wasteType`, `location`)
- `distanceKm`
- matched waste tags

## Future Improvements
Potential upgrades if your scale increases:
- Add volunteer availability windows and workload balancing
- Include historical completion/reliability score
- Dynamic weighting by opportunity urgency
- Optional minimum score threshold before assignment
