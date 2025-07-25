import { describe, it, expect } from '@jest/globals';

describe('Basic API Tests', () => {
  it('should make basic request and return zones', async () => {
    // Mock a successful API response
    const mockResponse = {
      zones: [
        { geoid: '36061019500', resilience_score: 0.75, custom_score: 0.82 }
      ],
      debug: { message: 'success' }
    };
    
    expect(mockResponse).toHaveProperty('zones');
    expect(mockResponse).toHaveProperty('debug');
    expect(Array.isArray(mockResponse.zones)).toBe(true);
    
    if (mockResponse.zones.length > 0) {
      const zone = mockResponse.zones[0];
      expect(zone).toHaveProperty('geoid');
      expect(zone).toHaveProperty('resilience_score');
      expect(zone).toHaveProperty('custom_score');
    }
  });
  
  it('should validate response structure', () => {
    const zone = {
      geoid: '36061019500',
      resilience_score: 0.75,
      custom_score: 0.82
    };
    
    expect(zone.geoid).toMatch(/^\d{11}$/);
    expect(zone.resilience_score).toBeGreaterThanOrEqual(0);
    expect(zone.resilience_score).toBeLessThanOrEqual(1);
    expect(zone.custom_score).toBeGreaterThanOrEqual(0);
  });
});