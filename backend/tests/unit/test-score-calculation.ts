import { describe, it, expect } from '@jest/globals';

// Type for Weights
interface Weights {
  foot_traffic: number;
  demographic: number;
  crime: number;
  flood_risk: number;
  rent_score: number;
  poi: number;
}

// Score calculation logic
function calculateCustomScore(
  footTrafficScore: number,
  demographicScore: number | null,
  crimeScore: number,
  floodRiskScore: number,
  rentScore: number,
  poiScore: number,
  weights: Weights
): number {
  return (
    footTrafficScore * weights.foot_traffic +
    (demographicScore ?? 0) * weights.demographic +
    crimeScore * weights.crime +
    floodRiskScore * weights.flood_risk +
    rentScore * weights.rent_score +
    poiScore * weights.poi
  );
}

// Custom weight application logic
function applyWeights(weights: { id: keyof Weights; value: number }[]): Weights {
  const defaultWeights: Weights = {
    foot_traffic: 0.35,
    demographic: 0.25,
    crime: 0.15,
    flood_risk: 0.10,
    rent_score: 0.10,
    poi: 0.05,
  };

  const finalWeights = { ...defaultWeights };
  for (const w of weights) {
    if (w.id && typeof w.value === 'number') {
      finalWeights[w.id] = w.value / 100;
    }
  }

  return finalWeights;
}

// Tests
describe('Score Calculation Tests', () => {
  const defaultWeights: Weights = {
    foot_traffic: 0.35,
    demographic: 0.25,
    crime: 0.15,
    flood_risk: 0.10,
    rent_score: 0.10,
    poi: 0.05,
  };

  it('should calculate score with default weights', () => {
    const result = calculateCustomScore(0.8, 0.6, 0.7, 0.4, 0.9, 0.5, defaultWeights);
    expect(result).toBeCloseTo(0.69, 2);
  });

  it('should handle null demographic score', () => {
    const result = calculateCustomScore(0.8, null, 0.7, 0.4, 0.9, 0.5, defaultWeights);
    expect(result).toBeCloseTo(0.54, 2);
  });

  it('should apply custom weights correctly', () => {
    const customWeights: Weights = {
      foot_traffic: 0.60,
      demographic: 0.20,
      crime: 0.10,
      flood_risk: 0.05,
      rent_score: 0.03,
      poi: 0.02,
    };
    const result = calculateCustomScore(0.9, 0.5, 0.6, 0.3, 0.7, 0.4, customWeights);
    expect(result).toBeCloseTo(0.744, 2);
  });

  it('should use default weights when no custom weights provided', () => {
    const result = applyWeights([]);
    expect(result).toEqual(defaultWeights);
  });

  it('should apply single custom weight', () => {
    const result = applyWeights([{ id: 'foot_traffic', value: 50 }]);
    expect(result.foot_traffic).toBe(0.50);
    expect(result.demographic).toBe(0.25); // unchanged
  });

  it('should handle perfect scores', () => {
    const result = calculateCustomScore(1.0, 1.0, 1.0, 1.0, 1.0, 1.0, defaultWeights);
    expect(result).toBeCloseTo(1.0, 2);
  });

  it('should handle zero scores', () => {
    const result = calculateCustomScore(0, 0, 0, 0, 0, 0, defaultWeights);
    expect(result).toBe(0);
  });

  it('should verify weights sum to 1.0', () => {
    const result = applyWeights([]);
    const sum = Object.values(result).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 2);
  });
});
