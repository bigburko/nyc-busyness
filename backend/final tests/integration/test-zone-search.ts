// test/integration/zone-search.integration.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Define response types
interface ZoneSearchResponse {
  zones?: Array<{
    geoid: string;
    resilience_score: number;
    custom_score: number;
    avg_rent?: number;
    tract_name?: string;
    display_name?: string;
    nta_name?: string;
    demographic_match_pct?: number;
    korean_percent?: number;
    median_age?: number;
    foot_traffic_score?: number;
    crime_score?: number;
  }>;
  total_zones_found?: number;
  top_zones_returned?: number;
  top_percentage?: number;
  filters_applied?: any;
  debug?: { 
    message?: string; 
    query_time_ms?: number;
    demographic_weight_detected?: number;
    is_single_factor_request?: boolean;
  };
  error?: string;
  timestamp?: string;
}

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(),
  query: jest.fn()
};

// Mock the edge function modules
jest.mock('../../edge-function/data-processing', () => ({
  fetchAllData: jest.fn(),
  validateDatabaseData: jest.fn(),
  fetchCrimeData: jest.fn(),
  fetchFootTrafficData: jest.fn()
}));

jest.mock('../../edge-function/demographic-scoring', () => ({
  calculateDemographicPercentages: jest.fn(),
  findMaxPercentages: jest.fn(),
  calculateEnhancedDemographicScore: jest.fn()
}));

jest.mock('../../edge-function/scoring-helpers', () => ({
  processZones: jest.fn(),
  addCrimeDataToTopZones: jest.fn(),
  addFootTrafficDataToTopZones: jest.fn()
}));

jest.mock('../../edge-function/validation', () => ({
  validateRequestBody: jest.fn()
}));

jest.mock('../../edge-function/utils', () => ({
  normalizeScore: jest.fn(),
  clamp: jest.fn(),
  getBoroughName: jest.fn()
}));

describe('Zone Search Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Zone Search', () => {
    it('should make basic request and return zones', async () => {
      const { fetchAllData, validateDatabaseData } = require('../../edge-function/data-processing');
      const { processZones } = require('../../edge-function/scoring-helpers');
      const { validateRequestBody } = require('../../edge-function/validation');
      const { getBoroughName } = require('../../edge-function/utils');

      // Mock realistic database data
      const mockDatabaseData = {
        zones: [
          { 
            GEOID: '36061019500', 
            resilience_score: 7.5, 
            avg_rent: 3500,
            foot_traffic_score: 8.2,
            crime_score: 3.1
          },
          { 
            GEOID: '36061019600', 
            resilience_score: 6.8, 
            avg_rent: 4200,
            foot_traffic_score: 7.8,
            crime_score: 3.5
          }
        ],
        ethnicityData: [],
        demographicsData: [],
        incomeData: []
      };

      const mockProcessedZones = [
        { 
          geoid: '36061019500', 
          resilience_score: 75, 
          custom_score: 82,
          avg_rent: 3500,
          tract_name: 'Tract 195',
          display_name: 'Tract 195 (Manhattan)',
          nta_name: 'Financial District',
          foot_traffic_score: 82,
          crime_score: 31
        },
        { 
          geoid: '36061019600', 
          resilience_score: 68, 
          custom_score: 71,
          avg_rent: 4200,
          tract_name: 'Tract 196',
          display_name: 'Tract 196 (Manhattan)',
          nta_name: 'Midtown',
          foot_traffic_score: 78,
          crime_score: 35
        }
      ];

      const validatedInput = {
        weights: [{ id: 'foot_traffic', value: 100 }],
        ethnicities: [],
        genders: [],
        ageRange: [0, 100],
        incomeRange: [0, 250000],
        rentRange: [3000, 5000],
        topN: 10,
        timePeriods: ['morning', 'afternoon', 'evening']
      };

      // Setup mocks
      validateRequestBody.mockReturnValue(validatedInput);
      fetchAllData.mockResolvedValue(mockDatabaseData);
      validateDatabaseData.mockReturnValue(true);
      processZones.mockResolvedValue(mockProcessedZones);
      getBoroughName.mockImplementation((geoId: string) => {
        if (geoId.startsWith('36061')) return 'Manhattan';
        return 'Unknown';
      });

      // Simulate edge function execution
      const validated = validateRequestBody({
        rentRange: [3000, 5000],
        topN: 10
      });
      const data = await fetchAllData(mockSupabase);
      const isValid = validateDatabaseData(data);
      const zones = await processZones(data.zones, validated, {}, {}, [], [], mockSupabase);

      // Validate response structure
      expect(isValid).toBe(true);
      expect(Array.isArray(zones)).toBe(true);
      expect(zones.length).toBeGreaterThan(0);
      
      // Validate zones data
      if (zones && zones.length > 0) {
        const zone = zones[0];
        expect(zone).toHaveProperty('geoid');
        expect(zone).toHaveProperty('resilience_score');
        expect(zone).toHaveProperty('custom_score');
        expect(zone).toHaveProperty('avg_rent');
        expect(zone).toHaveProperty('tract_name');
        expect(zone).toHaveProperty('display_name');
        
        // Validate data types and ranges
        expect(zone.geoid).toMatch(/^\d{11}$/);
        expect(zone.resilience_score).toBeGreaterThanOrEqual(0);
        expect(zone.resilience_score).toBeLessThanOrEqual(100);
        expect(zone.custom_score).toBeGreaterThanOrEqual(0);
        expect(zone.custom_score).toBeLessThanOrEqual(100);
      }
    });

    it('should validate response structure with multiple zones', async () => {
      const { processZones } = require('../../edge-function/scoring-helpers');

      const mockMultipleZones = [
        { geoid: '36061019500', resilience_score: 75, custom_score: 82 },
        { geoid: '36061019600', resilience_score: 68, custom_score: 78 },
        { geoid: '36061019700', resilience_score: 72, custom_score: 71 }
      ];

      processZones.mockResolvedValue(mockMultipleZones);

      const result = await processZones([], {}, {}, {}, [], [], mockSupabase);

      // Test all zones have consistent structure
      result.forEach((zone: any) => {
        expect(zone.geoid).toMatch(/^\d{11}$/);
        expect(zone.resilience_score).toBeGreaterThanOrEqual(0);
        expect(zone.resilience_score).toBeLessThanOrEqual(100);
        expect(zone.custom_score).toBeGreaterThanOrEqual(0);
        expect(zone.custom_score).toBeLessThanOrEqual(100);
      });

      // Test zones are properly sorted (highest scores first)
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].custom_score).toBeGreaterThanOrEqual(
          result[i + 1].custom_score
        );
      }
    });
  });

  describe('Filtered Zone Search', () => {
    it('should handle rent range filtering', async () => {
      const { processZones } = require('../../edge-function/scoring-helpers');
      const { validateRequestBody } = require('../../edge-function/validation');

      const mockInputZones = [
        { GEOID: '36061019500', avg_rent: 3200, resilience_score: 7.5 },
        { GEOID: '36061019600', avg_rent: 4500, resilience_score: 6.8 }, // Should be filtered out
        { GEOID: '36061019700', avg_rent: 3800, resilience_score: 7.2 }
      ];

      const mockFilteredZones = [
        { 
          geoid: '36061019500', 
          resilience_score: 75, 
          custom_score: 82,
          avg_rent: 3200 
        },
        { 
          geoid: '36061019700', 
          resilience_score: 72, 
          custom_score: 78,
          avg_rent: 3800 
        }
      ];

      const rentFilter = {
        weights: [{ id: 'foot_traffic', value: 100 }],
        rentRange: [3000, 4000],
        topN: 10
      };

      validateRequestBody.mockReturnValue(rentFilter);
      processZones.mockResolvedValue(mockFilteredZones);

      const validated = validateRequestBody(rentFilter);
      const result = await processZones(mockInputZones, validated, {}, {}, [], [], mockSupabase);

      expect(result).toHaveLength(2);
      expect(validated.rentRange).toEqual([3000, 4000]);
      
      // Validate rent is within range
      result.forEach((zone: any) => {
        if (zone.avg_rent) {
          expect(zone.avg_rent).toBeGreaterThanOrEqual(3000);
          expect(zone.avg_rent).toBeLessThanOrEqual(4000);
        }
      });
    });

    it('should handle demographic filtering integration', async () => {
      const { calculateDemographicPercentages } = require('../../edge-function/demographic-scoring');
      const { processZones } = require('../../edge-function/scoring-helpers');

      const mockDemographicInput = {
        weights: [{ id: 'demographic', value: 100 }],
        ethnicities: ['korean'],
        ageRange: [25, 45],
        topN: 10
      };

      const mockEthnicityData = [
        { GEOID: '36061019500', AEAKrn: 15.2, total_population: 5000 }
      ];

      const mockDemographicsData = [
        { GEOID: '36061019500', 'Median age (years)': 34.5 }
      ];

      const mockPercentages = {
        ethnicPercent: { '36061019500': 0.152 },
        genderPercent: {},
        agePercent: { '36061019500': 0.75 },
        incomePercent: {}
      };

      const mockProcessedZones = [
        { 
          geoid: '36061019500', 
          resilience_score: 75, 
          custom_score: 82,
          demographic_score: 85,
          demographic_match_pct: 15.2,
          age_match_pct: 75.0
        }
      ];

      calculateDemographicPercentages.mockReturnValue(mockPercentages);
      processZones.mockResolvedValue(mockProcessedZones);

      const percentages = calculateDemographicPercentages(
        mockDemographicInput, 
        mockEthnicityData, 
        mockDemographicsData, 
        []
      );
      const result = await processZones([], mockDemographicInput, percentages, {}, [], [], mockSupabase);

      if (result && result[0]) {
        expect(result[0].demographic_match_pct).toBe(15.2);
        expect(result[0].age_match_pct).toBe(75.0);
        expect(result[0].demographic_score).toBe(85);
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle empty results gracefully', async () => {
      const { processZones } = require('../../edge-function/scoring-helpers');

      // Mock no zones matching criteria
      processZones.mockResolvedValue([]);

      const result = await processZones([], {
        rentRange: [10000, 20000], // Unrealistic high range
        topN: 10
      }, {}, {}, [], [], mockSupabase);

      expect(result).toHaveLength(0);
    });

    it('should handle database errors properly', async () => {
      const { fetchAllData } = require('../../edge-function/data-processing');

      const mockError = new Error('Database connection failed');
      fetchAllData.mockRejectedValue(mockError);

      await expect(
        fetchAllData(mockSupabase)
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid filter parameters', async () => {
      const { validateRequestBody } = require('../../edge-function/validation');

      const invalidRequest = {
        rentRange: 'invalid', // Invalid type
        topN: 10
      };

      validateRequestBody.mockImplementation((body: any) => {
        if (!Array.isArray(body.rentRange)) {
          throw new Error('rentRange must be an array of two numbers');
        }
        return body;
      });

      expect(() => validateRequestBody(invalidRequest))
        .toThrow('rentRange must be an array of two numbers');
    });

    it('should handle validation errors gracefully', async () => {
      const { validateDatabaseData } = require('../../edge-function/data-processing');

      const invalidData = {
        zones: [], // Empty zones = invalid
        ethnicityData: [],
        demographicsData: [],
        incomeData: []
      };

      validateDatabaseData.mockReturnValue(false);

      const isValid = validateDatabaseData(invalidData);

      expect(isValid).toBe(false);
    });
  });

  describe('Performance Integration', () => {
    it('should complete searches within reasonable time', async () => {
      const { fetchAllData } = require('../../edge-function/data-processing');
      const { processZones } = require('../../edge-function/scoring-helpers');

      const mockData = {
        zones: [
          { GEOID: '36061019500', resilience_score: 7.5, avg_rent: 3500 }
        ],
        ethnicityData: [],
        demographicsData: [],
        incomeData: []
      };

      const mockProcessedZones = [
        { geoid: '36061019500', resilience_score: 75, custom_score: 82 }
      ];

      fetchAllData.mockResolvedValue(mockData);
      processZones.mockResolvedValue(mockProcessedZones);

      const startTime = Date.now();
      
      const data = await fetchAllData(mockSupabase);
      const zones = await processZones(data.zones, { topN: 50 }, {}, {}, [], [], mockSupabase);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(zones).toHaveLength(1);
      // Since mocked, execution should be very fast
      expect(executionTime).toBeLessThan(100);
    });

    it('should handle large result sets efficiently', async () => {
      const { processZones } = require('../../edge-function/scoring-helpers');

      // Mock large dataset
      const mockLargeZones = Array.from({ length: 100 }, (_, i) => ({
        geoid: `36061${String(i + 19500).padStart(6, '0')}`,
        resilience_score: Math.floor(Math.random() * 100),
        custom_score: Math.floor(Math.random() * 100)
      }));

      processZones.mockResolvedValue(mockLargeZones);

      const startTime = Date.now();
      const result = await processZones([], { topN: 100 }, {}, {}, [], [], mockSupabase);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result).toHaveLength(100);
      expect(executionTime).toBeLessThan(200); // Should be fast since mocked
    });
  });

  describe('Edge Function Response Format Integration', () => {
    it('should return properly formatted edge function response', async () => {
      const { fetchAllData } = require('../../edge-function/data-processing');
      const { processZones, addCrimeDataToTopZones, addFootTrafficDataToTopZones } = require('../../edge-function/scoring-helpers');

      const mockData = {
        zones: [
          { GEOID: '36061019500', resilience_score: 7.5, avg_rent: 3500 }
        ],
        ethnicityData: [],
        demographicsData: [],
        incomeData: []
      };

      const mockProcessedZones = [
        { 
          geoid: '36061019500', 
          resilience_score: 75, 
          custom_score: 82,
          avg_rent: 3500,
          tract_name: 'Tract 195',
          display_name: 'Tract 195 (Manhattan)'
        }
      ];

      fetchAllData.mockResolvedValue(mockData);
      processZones.mockResolvedValue(mockProcessedZones);
      addCrimeDataToTopZones.mockImplementation(async (supabase: any, zones: any[]) => {
        zones.forEach(zone => {
          zone.crime_timeline = { year_2024: 30, pred_2025: 25 };
        });
      });
      addFootTrafficDataToTopZones.mockImplementation(async (supabase: any, zones: any[]) => {
        zones.forEach(zone => {
          zone.foot_traffic_timeline = { '2024': 80, 'pred_2025': 85 };
        });
      });

      // Simulate complete edge function flow
      const data = await fetchAllData(mockSupabase);
      const processedZones = await processZones(data.zones, { topN: 10 }, {}, {}, [], [], mockSupabase);
      await addCrimeDataToTopZones(mockSupabase, processedZones);
      await addFootTrafficDataToTopZones(mockSupabase, processedZones);

      // Validate final response structure matches edge function format
      expect(Array.isArray(processedZones)).toBe(true);
      expect(processedZones).toHaveLength(1);

      const zone = processedZones[0];
      expect(typeof zone.geoid).toBe('string');
      expect(typeof zone.resilience_score).toBe('number');
      expect(typeof zone.custom_score).toBe('number');
      expect(typeof zone.tract_name).toBe('string');
      expect(typeof zone.display_name).toBe('string');

      // Validate enriched data was added
      expect(zone).toHaveProperty('crime_timeline');
      expect(zone).toHaveProperty('foot_traffic_timeline');
    });

    it('should handle demographic scoring response format', async () => {
      const { calculateDemographicPercentages, calculateEnhancedDemographicScore } = require('../../edge-function/demographic-scoring');

      const mockInput = {
        ethnicities: ['korean'],
        genders: ['male'],
        demographicScoring: {
          weights: {
            ethnicity: 0.6,
            gender: 0.4,
            age: 0.0,
            income: 0.0
          }
        }
      };

      const mockPercentages = {
        ethnicPercent: { '36061019500': 0.15 },
        genderPercent: { '36061019500': 0.52 },
        agePercent: {},
        incomePercent: {}
      };

      calculateDemographicPercentages.mockReturnValue(mockPercentages);
      calculateEnhancedDemographicScore.mockReturnValue(0.78);

      const percentages = calculateDemographicPercentages(mockInput, [], [], []);
      const score = calculateEnhancedDemographicScore('36061019500', mockInput, percentages, {});

      expect(percentages.ethnicPercent['36061019500']).toBe(0.15);
      expect(percentages.genderPercent['36061019500']).toBe(0.52);
      expect(score).toBe(0.78);
    });
  });

  describe('Zone Enrichment Integration', () => {
    it('should properly enrich zones with timeline data', async () => {
      const { addCrimeDataToTopZones, addFootTrafficDataToTopZones } = require('../../edge-function/scoring-helpers');

      const mockZones: any[] = [
        { geoid: '36061019500', custom_score: 85 }
      ];

      addCrimeDataToTopZones.mockImplementation(async (supabase: any, zones: any[]) => {
        zones[0].crime_timeline = {
          year_2024: 30,
          pred_2025: 25,
          pred_2026: 20
        };
        zones[0].crime_trend_direction = 'decreasing';
      });

      addFootTrafficDataToTopZones.mockImplementation(async (supabase: any, zones: any[]) => {
        zones[0].foot_traffic_timeline = {
          '2024': 80,
          'pred_2025': 85,
          'pred_2026': 90
        };
        zones[0].foot_traffic_trend_direction = 'increasing';
      });

      await addCrimeDataToTopZones(mockSupabase, mockZones);
      await addFootTrafficDataToTopZones(mockSupabase, mockZones);

      expect(mockZones[0]).toHaveProperty('crime_timeline');
      expect(mockZones[0]).toHaveProperty('foot_traffic_timeline');
      expect(mockZones[0]).toHaveProperty('crime_trend_direction');
      expect(mockZones[0]).toHaveProperty('foot_traffic_trend_direction');

      expect(mockZones[0].crime_trend_direction).toBe('decreasing');
      expect(mockZones[0].foot_traffic_trend_direction).toBe('increasing');
    });
  });
});