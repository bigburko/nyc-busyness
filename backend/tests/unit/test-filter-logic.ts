import { describe, it, expect } from '@jest/globals';

// Essential filtering logic
function calculateAgePercentages(demographicsData: any[], ageRange: [number, number]): any {
  const agePercent: { [key: string]: number } = {};
  const [minAge, maxAge] = ageRange;
  
  const AGE_BRACKETS = [
    { key: 'Under 5 years (%)', min: 0, max: 4 },
    { key: '25 to 29 years (%)', min: 25, max: 29 },
    { key: '65 years and over (%)', min: 65, max: 120 }
  ];
  
  for (const row of demographicsData) {
    const geoId = row.GEOID;
    let ageSum = 0;
    
    for (const bracket of AGE_BRACKETS) {
      if (minAge <= bracket.max && maxAge >= bracket.min) {
        ageSum += row[bracket.key] || 0;
      }
    }
    
    agePercent[geoId] = ageSum / 100;
  }
  
  return agePercent;
}

function calculateEthnicityPercentages(ethnicityData: any[], ethnicities: string[]): any {
  const ethnicPercent: { [key: string]: number } = {};
  
  for (const row of ethnicityData) {
    const geoId = row.GEOID;
    const total = row.total_population || 0;
    let match = 0;
    
    for (const ethnicity of ethnicities) {
      match += row[ethnicity] || 0;
    }
    
    ethnicPercent[geoId] = total > 0 ? match / total : 0;
  }
  
  return ethnicPercent;
}

function filterZonesByRent(zones: any[], rentRange: [number, number]): any[] {
  const [minRent, maxRent] = rentRange;
  const WATCHED_ZONES = ['36061019500', '36061019100'];
  
  return zones.filter(z => 
    z.avg_rent == null || 
    (z.avg_rent >= minRent && z.avg_rent <= maxRent) ||
    WATCHED_ZONES.includes(z.GEOID)
  );
}

describe('Filter Logic Tests', () => {
  const mockDemographicsData = [{
    GEOID: '12345',
    'Under 5 years (%)': 5,
    '25 to 29 years (%)': 15,
    '65 years and over (%)': 8
  }];

  const mockEthnicityData = [{
    GEOID: '12345',
    total_population: 1000,
    WEur: 600,
    BAfrAm: 300,
    HMex: 100
  }];

  const mockZones = [
    { GEOID: '12345', avg_rent: 1500 },
    { GEOID: '67890', avg_rent: 3000 },
    { GEOID: '36061019500', avg_rent: 4000 }, // watched zone
    { GEOID: '11111', avg_rent: null }
  ];

  it('should calculate age percentages for working age', () => {
    const result = calculateAgePercentages(mockDemographicsData, [25, 29]);
    expect(result['12345']).toBe(0.15);
  });

  it('should calculate age percentages for seniors', () => {
    const result = calculateAgePercentages(mockDemographicsData, [65, 120]);
    expect(result['12345']).toBe(0.08);
  });

  it('should calculate ethnicity percentages for single ethnicity', () => {
    const result = calculateEthnicityPercentages(mockEthnicityData, ['WEur']);
    expect(result['12345']).toBe(0.6);
  });

  it('should calculate ethnicity percentages for multiple ethnicities', () => {
    const result = calculateEthnicityPercentages(mockEthnicityData, ['WEur', 'BAfrAm']);
    expect(result['12345']).toBe(0.9);
  });

  it('should filter zones by rent range', () => {
    const result = filterZonesByRent(mockZones, [1000, 2000]);
    expect(result.length).toBe(3); // 1500, watched zone, null rent
    expect(result.map(z => z.GEOID)).toContain('12345');
    expect(result.map(z => z.GEOID)).toContain('36061019500'); // watched
    expect(result.map(z => z.GEOID)).toContain('11111'); // null rent
  });

  it('should include zones with null rent', () => {
    const result = filterZonesByRent(mockZones, [2000, 2500]);
    expect(result.map(z => z.GEOID)).toContain('11111');
  });

  it('should always include watched zones', () => {
    const result = filterZonesByRent(mockZones, [0, 100]);
    expect(result.map(z => z.GEOID)).toContain('36061019500');
  });

  it('should handle empty filter arrays', () => {
    const result = calculateEthnicityPercentages(mockEthnicityData, []);
    expect(result['12345']).toBe(0);
  });
});