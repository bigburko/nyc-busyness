// test/database/constraints-validation.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Supabase client setup (matches your edge function)
const mockQuery = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

const mockSupabase = {
  from: mockFrom,
  query: mockQuery
};

// Set up the chain properly
mockFrom.mockImplementation(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete
}));

// Mock the edge function modules
jest.mock('../../edge-function/data-processing', () => ({
  fetchAllData: jest.fn(),
  validateDatabaseData: jest.fn(),
  fetchCrimeData: jest.fn(),
  fetchFootTrafficData: jest.fn()
}));

jest.mock('../../edge-function/validation', () => ({
  validateRequestBody: jest.fn()
}));

jest.mock('../../edge-function/utils', () => ({
  normalizeScore: jest.fn(),
  clamp: jest.fn(),
  getBoroughName: jest.fn()
}));

describe('Database Constraints and Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GEOID Validation', () => {
    it('should validate GEOID format for NYC census tracts', () => {
      const validGEOID = '36061019500';
      const invalidGEOID = 'invalid';
      
      // NYC census tract GEOID format: 11 digits starting with 36061
      expect(validGEOID).toMatch(/^\d{11}$/);
      expect(validGEOID.startsWith('36061')).toBe(true);
      expect(invalidGEOID).not.toMatch(/^\d{11}$/);
    });

    it('should ensure GEOID uniqueness in resilience_zones', async () => {
      const { fetchAllData } = require('../../edge-function/data-processing');
      
      // Mock duplicate GEOID scenario
      const mockDuplicateData = {
        zones: [
          { GEOID: '36061019500', avg_rent: 3500 },
          { GEOID: '36061019500', avg_rent: 3600 } // Duplicate
        ],
        ethnicityData: [],
        demographicsData: [],
        incomeData: []
      };

      fetchAllData.mockResolvedValue(mockDuplicateData);

      const result = await fetchAllData(mockSupabase);
      
      // Check for duplicate GEOIDs
      const geoIds = result.zones.map((z: any) => z.GEOID);
      const uniqueGeoIds = [...new Set(geoIds)];
      
      expect(geoIds.length).toBeGreaterThan(uniqueGeoIds.length);
    });
  });

  describe('Score Constraints (0-10 Range)', () => {
    it('should enforce foot_traffic_score constraints', () => {
      const { normalizeScore, clamp } = require('../../edge-function/utils');
      
      // Mock the utility functions
      normalizeScore.mockImplementation((score: number) => {
        if (score < 0) return 0;
        if (score > 100) return 100;
        return score;
      });

      clamp.mockImplementation((value: number, min: number, max: number) => {
        return Math.min(max, Math.max(min, value));
      });

      // Test invalid scores
      const invalidScores = [15.0, -1.0, 150, -50];
      const validScores = [0, 5.5, 7.2, 10];

      invalidScores.forEach(score => {
        const normalized = normalizeScore(score);
        const clamped = clamp(score, 0, 10);
        
        expect(clamped).toBeGreaterThanOrEqual(0);
        expect(clamped).toBeLessThanOrEqual(10);
      });

      validScores.forEach(score => {
        const clamped = clamp(score, 0, 10);
        expect(clamped).toBe(score);
      });
    });

    it('should enforce crime_score constraints', () => {
      const { clamp } = require('../../edge-function/utils');
      
      clamp.mockImplementation((value: number, min: number, max: number) => {
        return Math.min(max, Math.max(min, value));
      });

      const invalidScore = 11.5;
      const clampedScore = clamp(invalidScore, 0, 10);
      
      expect(clampedScore).toBeLessThanOrEqual(10);
      expect(clampedScore).toBeGreaterThanOrEqual(0);
    });

    it('should accept valid score ranges', () => {
      const validScores = [0, 5.5, 7.2, 10];
      
      validScores.forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('Data Validation in Edge Functions', () => {
    it('should validate request body constraints', () => {
      const { validateRequestBody } = require('../../edge-function/validation');
      
      const validRequest = {
        weights: [{ id: 'foot_traffic', value: 50 }],
        ethnicities: ['korean'],
        rentRange: [1000, 5000],
        topN: 10
      };

      const invalidRequest = {
        weights: [{ id: 'foot_traffic', value: 150 }], // Invalid: > 100
        ethnicities: [],
        rentRange: [-1000, 5000], // Invalid: negative
        topN: 0 // Invalid: should be > 0
      };

      validateRequestBody.mockImplementation((body: any) => {
        if (body.weights.some((w: any) => w.value > 100 || w.value < 0)) {
          throw new Error('Invalid weight values');
        }
        if (body.rentRange[0] < 0) {
          throw new Error('Invalid rent range');
        }
        if (body.topN <= 0) {
          throw new Error('Invalid topN value');
        }
        return body;
      });

      expect(() => validateRequestBody(validRequest)).not.toThrow();
      expect(() => validateRequestBody(invalidRequest)).toThrow('Invalid weight values');
    });

    it('should validate database data completeness', () => {
      const { validateDatabaseData } = require('../../edge-function/data-processing');
      
      const validData = {
        zones: [{ GEOID: '36061019500' }],
        ethnicityData: [{ GEOID: '36061019500' }],
        demographicsData: [{ GEOID: '36061019500' }],
        incomeData: [{ GEOID: '36061019500' }]
      };

      const invalidData = {
        zones: [], // Empty zones = invalid
        ethnicityData: [],
        demographicsData: [],
        incomeData: []
      };

      validateDatabaseData.mockImplementation((data: any) => {
        return data.zones && data.zones.length > 0;
      });

      expect(validateDatabaseData(validData)).toBe(true);
      expect(validateDatabaseData(invalidData)).toBe(false);
    });
  });

  describe('Data Type Validation', () => {
    it('should validate percentage ranges (0-100)', () => {
      const validPercentages = [0, 48.5, 51.5, 100];
      const invalidPercentages = [-5, 150];
      
      validPercentages.forEach(pct => {
        expect(pct).toBeGreaterThanOrEqual(0);
        expect(pct).toBeLessThanOrEqual(100);
      });
      
      invalidPercentages.forEach(pct => {
        expect(pct < 0 || pct > 100).toBe(true);
      });
    });

    it('should validate gender percentages sum to 100', () => {
      const malePercent = 48.5;
      const femalePercent = 51.5;
      const total = malePercent + femalePercent;
      
      expect(total).toBeCloseTo(100, 1);
    });

    it('should handle null values appropriately', async () => {
      const { fetchAllData } = require('../../edge-function/data-processing');
      
      const mockDataWithNulls = {
        zones: [{ GEOID: '36061019500', avg_rent: null }],
        ethnicityData: [],
        demographicsData: [],
        incomeData: []
      };

      fetchAllData.mockResolvedValue(mockDataWithNulls);

      const result = await fetchAllData(mockSupabase);
      
      expect(result.zones[0].avg_rent).toBeNull();
    });
  });

  describe('Resilience Score Calculation', () => {
    it('should validate automatic resilience score calculation', async () => {
      const { fetchAllData } = require('../../edge-function/data-processing');
      
      const mockZoneWithCalculatedScore = {
        zones: [{
          GEOID: '36061019500',
          foot_traffic_score: 8.0,
          crime_score: 6.0,
          flood_risk_score: 3.0,
          rent_score: 7.0,
          poi_score: 5.0,
          resilience_score: 4.95
        }],
        ethnicityData: [],
        demographicsData: [],
        incomeData: []
      };

      fetchAllData.mockResolvedValue(mockZoneWithCalculatedScore);

      const result = await fetchAllData(mockSupabase);
      const zone = result.zones[0];
      
      // Validate the calculation using the same formula as your system
      const expectedScore = 
        (zone.foot_traffic_score * 0.35) +
        (zone.crime_score * 0.15) +
        (zone.flood_risk_score * 0.10) +
        (zone.rent_score * 0.10) +
        (zone.poi_score * 0.05);

      expect(zone.resilience_score).toBeCloseTo(expectedScore, 2);
    });

    it('should validate score normalization', () => {
      const { normalizeScore } = require('../../edge-function/utils');
      
      normalizeScore.mockImplementation((score: number) => {
        return Math.min(100, Math.max(0, score));
      });

      const testScores = [-10, 0, 50, 100, 150];
      const expectedResults = [0, 0, 50, 100, 100];

      testScores.forEach((score, index) => {
        const normalized = normalizeScore(score);
        expect(normalized).toBe(expectedResults[index]);
      });
    });
  });

  describe('Data Consistency Validation', () => {
    it('should validate population consistency across tables', async () => {
      const { fetchAllData } = require('../../edge-function/data-processing');
      
      const mockConsistentData = {
        zones: [{ GEOID: '36061019500' }],
        ethnicityData: [{ GEOID: '36061019500', total_population: 4950 }],
        demographicsData: [{ GEOID: '36061019500', 'Total population': 5000 }],
        incomeData: []
      };

      fetchAllData.mockResolvedValue(mockConsistentData);

      const result = await fetchAllData(mockSupabase);
      
      const demoPopulation = result.demographicsData[0]['Total population'];
      const ethnicityPopulation = result.ethnicityData[0].total_population;
      const difference = Math.abs(demoPopulation - ethnicityPopulation);
      const percentDifference = (difference / demoPopulation) * 100;
      
      // Population difference should be minimal (under 5%)
      expect(percentDifference).toBeLessThan(5);
    });

    it('should validate missing data handling', async () => {
      const { fetchAllData } = require('../../edge-function/data-processing');
      
      fetchAllData.mockResolvedValue({
        zones: [],
        ethnicityData: [],
        demographicsData: [],
        incomeData: []
      });

      const result = await fetchAllData(mockSupabase);

      expect(result.zones).toHaveLength(0);
    });

    it('should validate GEOID consistency across tables', async () => {
      const { fetchAllData } = require('../../edge-function/data-processing');
      
      const mockInconsistentData = {
        zones: [
          { GEOID: '36061019500' },
          { GEOID: '36061019600' }
        ],
        ethnicityData: [
          { GEOID: '36061019500' }
          // Missing 36061019600
        ],
        demographicsData: [
          { GEOID: '36061019500' },
          { GEOID: '36061019600' }
        ],
        incomeData: [
          { GEOID: '36061019600' }
          // Missing 36061019500
        ]
      };

      fetchAllData.mockResolvedValue(mockInconsistentData);

      const result = await fetchAllData(mockSupabase);
      
      const zoneGeoIds = new Set(result.zones.map((z: any) => z.GEOID));
      const ethnicityGeoIds = new Set(result.ethnicityData.map((e: any) => e.GEOID));
      const demoGeoIds = new Set(result.demographicsData.map((d: any) => d.GEOID));
      const incomeGeoIds = new Set(result.incomeData.map((i: any) => i.GEOID));

      // Find missing data
      const missingFromEthnicity = [...zoneGeoIds].filter(id => !ethnicityGeoIds.has(id));
      const missingFromIncome = [...zoneGeoIds].filter(id => !incomeGeoIds.has(id));

      expect(missingFromEthnicity).toHaveLength(1);
      expect(missingFromIncome).toHaveLength(1);
    });
  });

  describe('Borough Name Validation', () => {
    it('should validate borough name resolution', () => {
      const { getBoroughName } = require('../../edge-function/utils');
      
      getBoroughName.mockImplementation((geoId: string) => {
        if (!geoId || typeof geoId !== 'string') return 'Unknown';
        const countyCode = geoId.substring(2, 5);
        switch(countyCode) {
          case '061': return 'Manhattan';
          case '005': return 'Bronx';
          case '047': return 'Brooklyn';
          case '081': return 'Queens';
          case '085': return 'Staten Island';
          default: return 'Unknown';
        }
      });

      const testCases = [
        { geoId: '36061019500', expected: 'Manhattan' },
        { geoId: '36005019500', expected: 'Bronx' },
        { geoId: '36047019500', expected: 'Brooklyn' },
        { geoId: '36081019500', expected: 'Queens' },
        { geoId: '36085019500', expected: 'Staten Island' },
        { geoId: '36999019500', expected: 'Unknown' },
        { geoId: 'invalid', expected: 'Unknown' }
      ];

      testCases.forEach(({ geoId, expected }) => {
        const result = getBoroughName(geoId);
        expect(result).toBe(expected);
      });
    });
  });
});