import { describe, it, expect } from '@jest/globals';

// Essential validation logic
function safeDivision(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

function safePropertyAccess(obj: any, key: string): number {
  return obj[key] || 0;
}

function findMaxPercentage(percentageObject: { [key: string]: number }): number {
  let max = 1; // Default minimum of 1
  for (const geoId in percentageObject) {
    if (percentageObject[geoId] > max) {
      max = percentageObject[geoId];
    }
  }
  return max;
}

describe('Data Validation Tests', () => {
  
  it('should handle safe division with zero denominator', () => {
    expect(safeDivision(100, 50)).toBe(2);
    expect(safeDivision(100, 0)).toBe(0);
    expect(safeDivision(0, 10)).toBe(0);
  });

  it('should handle safe property access with null values', () => {
    const obj = { score: 75, nullValue: null, undefinedValue: undefined };
    
    expect(safePropertyAccess(obj, 'score')).toBe(75);
    expect(safePropertyAccess(obj, 'nullValue')).toBe(0);
    expect(safePropertyAccess(obj, 'undefinedValue')).toBe(0);
    expect(safePropertyAccess(obj, 'missing')).toBe(0);
  });

  it('should find maximum percentage correctly', () => {
    const percentages = { '12345': 1.5, '67890': 2.3, '11111': 0.8 };
    expect(findMaxPercentage(percentages)).toBe(2.3);
    
    const smallPercentages = { '12345': 0.5, '67890': 0.8 };
    expect(findMaxPercentage(smallPercentages)).toBe(1); // Default minimum
  });

  it('should handle realistic edge function data', () => {
    const incompleteZone = {
      foot_traffic_score: null,
      crime_score: undefined,
      avg_rent: 0
    };

    const footTraffic = safePropertyAccess(incompleteZone, 'foot_traffic_score');
    const crime = safePropertyAccess(incompleteZone, 'crime_score');
    const rent = safePropertyAccess(incompleteZone, 'avg_rent');

    expect(footTraffic).toBe(0);
    expect(crime).toBe(0);
    expect(rent).toBe(0);
  });
});