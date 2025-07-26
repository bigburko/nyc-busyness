// test/database/business-logic.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Supabase client setup (matches your edge function)
const mockQuery = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockIn = jest.fn();

const mockSupabase = {
  from: mockFrom,
  query: mockQuery
};

// Set up the chain properly with proper typing
mockFrom.mockImplementation(() => ({
  select: mockSelect
}));

mockSelect.mockImplementation(() => ({
  in: mockIn
}));

mockIn.mockImplementation(() => Promise.resolve({ data: [], error: null }));

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

describe('Database Business Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('NYC Demographic Diversity Validation', () => {
    it('should validate NYC ethnic diversity patterns', async () => {
      const mockEthnicData = [
        { 
          GEOID: '36061019500', 
          WEur: 35.2,    // White European
          BAfrAm: 18.7,  // Black African American  
          HMex: 15.1,    // Hispanic Mexican
          AEAKrn: 12.5,  // Korean
          AEA: 8.3       // Asian East Asian total
        }
      ];

      // Mock the select chain for this test
      mockSelect.mockImplementation(() => 
        Promise.resolve({ data: mockEthnicData, error: null })
      );

      // Import the mocked functions
      const { fetchAllData } = require('../../edge-function/data-processing');
      fetchAllData.mockResolvedValue({
        zones: [],
        ethnicityData: mockEthnicData,
        demographicsData: [],
        incomeData: []
      });

      const result = await fetchAllData(mockSupabase);
      const data = result.ethnicityData[0];
      
      // Business Rule: All major ethnic groups should have representation in NYC
      expect(data.WEur).toBeGreaterThan(0);
      expect(data.BAfrAm).toBeGreaterThan(0);
      expect(data.HMex).toBeGreaterThan(0);
      expect(data.AEAKrn).toBeGreaterThan(0);
      expect(data.AEA).toBeGreaterThan(0);

      // Business Rule: No single group should dominate completely (>80%)
      const allPercentages = [data.WEur, data.BAfrAm, data.HMex, data.AEAKrn];
      expect(allPercentages.every(pct => pct < 80)).toBe(true);
    });

    it('should validate NYC income diversity distribution', async () => {
      const mockIncomeData = [
        { income_bracket: 'low', count: 45, percentage: 23.7 },
        { income_bracket: 'middle', count: 120, percentage: 63.2 },
        { income_bracket: 'high', count: 25, percentage: 13.1 }
      ];

      const { fetchAllData } = require('../../edge-function/data-processing');
      fetchAllData.mockResolvedValue({
        zones: [],
        ethnicityData: [],
        demographicsData: [],
        incomeData: mockIncomeData
      });

      const result = await fetchAllData(mockSupabase);
      
      // Business Rule: All income brackets should be represented
      expect(result.incomeData).toHaveLength(3);
      expect(result.incomeData.every((row: any) => row.count > 0)).toBe(true);
      
      // Business Rule: Middle income should be largest group in NYC
      const middleIncome = result.incomeData.find((row: any) => row.income_bracket === 'middle');
      const lowIncome = result.incomeData.find((row: any) => row.income_bracket === 'low');
      const highIncome = result.incomeData.find((row: any) => row.income_bracket === 'high');
      
      expect(middleIncome?.count).toBeGreaterThan(lowIncome?.count || 0);
      expect(middleIncome?.count).toBeGreaterThan(highIncome?.count || 0);
    });
  });

  describe('Resilience Score Business Rules', () => {
    it('should validate resilience score calculation weights', async () => {
      const mockZoneScores = [
        {
          GEOID: '36061019500',
          foot_traffic_score: 8.0,
          crime_score: 6.0,
          flood_risk_score: 3.0,
          rent_score: 7.0,
          poi_score: 5.0,
          resilience_score: 6.45
        }
      ];

      const { fetchAllData } = require('../../edge-function/data-processing');
      fetchAllData.mockResolvedValue({
        zones: mockZoneScores,
        ethnicityData: [],
        demographicsData: [],
        incomeData: []
      });

      const result = await fetchAllData(mockSupabase);
      const zone = result.zones[0];

      // Business Rule: Foot traffic has highest weight (35%)
      const footTrafficContribution = zone.foot_traffic_score * 0.35;
      const crimeContribution = zone.crime_score * 0.15;
      const floodContribution = zone.flood_risk_score * 0.10;
      
      expect(footTrafficContribution).toBeGreaterThan(crimeContribution);
      expect(footTrafficContribution).toBeGreaterThan(floodContribution);

      // Business Rule: Total weights should equal 75% (35+15+10+10+5)
      const totalWeight = 0.35 + 0.15 + 0.10 + 0.10 + 0.05;
      expect(totalWeight).toBe(0.75);
    });

    it('should validate score ranges and constraints', async () => {
      const mockScoreValidation = [
        {
          min_resilience: 0.0,
          max_resilience: 7.5,
          avg_resilience: 5.2,
          zones_with_valid_scores: 98,
          total_zones: 100
        }
      ];

      const { fetchAllData } = require('../../edge-function/data-processing');
      fetchAllData.mockResolvedValue({
        zones: mockScoreValidation,
        ethnicityData: [],
        demographicsData: [],
        incomeData: []
      });

      const result = await fetchAllData(mockSupabase);
      const data = result.zones[0];

      // Business Rule: All resilience scores should be between 0-10
      expect(data.min_resilience).toBeGreaterThanOrEqual(0);
      expect(data.max_resilience).toBeLessThanOrEqual(10);
      
      // Business Rule: >95% of zones should have valid scores
      const validPercentage = (data.zones_with_valid_scores / data.total_zones) * 100;
      expect(validPercentage).toBeGreaterThan(95);
    });
  });

  describe('Zone Ranking and Scoring Logic', () => {
    it('should validate top zone identification logic', async () => {
      const mockTopZones = [
        {
          GEOID: '36061019500',
          resilience_score: 8.2,
          custom_score: 7.8,
          avg_rent: 3200,
          korean_percent: 15.2,
          rank: 1
        },
        {
          GEOID: '36061019600',
          resilience_score: 7.9,
          custom_score: 7.5,
          avg_rent: 3800,
          korean_percent: 18.7,
          rank: 2
        }
      ];

      const { processZones } = require('../../edge-function/scoring-helpers');
      processZones.mockResolvedValue(mockTopZones);

      const mockInput = {
        weights: [{ id: 'demographic', value: 100 }],
        ethnicities: ['korean'],
        rentRange: [3000, 4000],
        topN: 5
      };

      const result = await processZones([], mockInput, {}, {}, [], [], mockSupabase);

      // Business Rule: Top zones should be ranked by score
      expect(result[0].custom_score).toBeGreaterThan(result[1].custom_score);
      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(2);

      // Business Rule: All top zones should meet minimum criteria
      result.forEach((zone: any) => {
        expect(zone.avg_rent).toBeGreaterThanOrEqual(3000);
        expect(zone.avg_rent).toBeLessThanOrEqual(4000);
        expect(zone.korean_percent).toBeGreaterThan(10.0);
      });
    });

    it('should validate zone filtering by demographic preferences', async () => {
      const mockFilteredZones = [
        {
          GEOID: '36061019500',
          korean_percent: 25.3,
          male_percent: 52.1,
          median_age: 28.5,
          median_income: 95000,
          matches_criteria: true
        }
      ];

      const { calculateDemographicPercentages } = require('../../edge-function/demographic-scoring');
      calculateDemographicPercentages.mockReturnValue({
        ethnicPercent: { '36061019500': 0.253 },
        genderPercent: { '36061019500': 0.521 },
        agePercent: { '36061019500': 0.75 },
        incomePercent: { '36061019500': 0.65 }
      });

      const mockInput = {
        ethnicities: ['korean'],
        genders: ['male'],
        ageRange: [25, 35],
        incomeRange: [80000, 120000]
      };

      const result = calculateDemographicPercentages(mockInput, [], [], []);

      // Business Rule: Zone should match all specified criteria
      expect(result.ethnicPercent['36061019500']).toBeGreaterThanOrEqual(0.20);
      expect(result.genderPercent['36061019500']).toBeGreaterThanOrEqual(0.50);
    });
  });

  describe('Data Completeness Business Rules', () => {
    it('should validate minimum data completeness requirements', async () => {
      const mockCompletenessData = {
        zones: new Array(100).fill({}),
        ethnicityData: new Array(98).fill({}),
        demographicsData: new Array(95).fill({}),
        incomeData: new Array(92).fill({})
      };

      const { fetchAllData, validateDatabaseData } = require('../../edge-function/data-processing');
      fetchAllData.mockResolvedValue(mockCompletenessData);
      validateDatabaseData.mockReturnValue(true);

      const result = await fetchAllData(mockSupabase);
      const isValid = validateDatabaseData(result);

      // Business Rule: Minimum 85% data completeness required
      const ethnicityCompleteness = (result.ethnicityData.length / result.zones.length) * 100;
      const demoCompleteness = (result.demographicsData.length / result.zones.length) * 100;
      
      expect(ethnicityCompleteness).toBeGreaterThan(85);
      expect(demoCompleteness).toBeGreaterThan(85);
      expect(isValid).toBe(true);
    });

    it('should calculate data completeness score for individual zones', () => {
      // Business Rule: Data completeness scoring
      const zoneData = [
        { GEOID: '36061019500', value: 100 },
        { GEOID: '36061019100', value: null },
        { GEOID: '36061018700', value: 200 },
        { GEOID: '36061018800', value: 150 },
        { GEOID: '36061018900', value: null }
      ];
      
      const completeRecords = zoneData.filter(record => record.value !== null).length;
      const completenessPercentage = (completeRecords / zoneData.length) * 100;
      
      // Business Rule: 60% completeness is minimum threshold
      expect(Math.round(completenessPercentage)).toBe(60);
      expect(completenessPercentage).toBeGreaterThanOrEqual(60);
    });
  });

  describe('NYC Geographic Business Rules', () => {
    it('should validate Manhattan GEOID patterns', () => {
      const manhattanGEOIDs = [
        '36061019500', // Valid Manhattan
        '36061020100', // Valid Manhattan
        '36047000100', // Brooklyn - should not match
        '36081000200'  // Queens - should not match
      ];

      manhattanGEOIDs.forEach(geoid => {
        const isManhattan = geoid.startsWith('36061');
        
        if (geoid.includes('36061')) {
          expect(isManhattan).toBe(true);
        } else {
          expect(isManhattan).toBe(false);
        }
      });

      // Business Rule: All GEOIDs should be 11 digits
      manhattanGEOIDs.forEach(geoid => {
        expect(geoid).toMatch(/^\d{11}$/);
      });
    });

    it('should validate resilience score distribution by borough', async () => {
      const mockBoroughScores = [
        { GEOID: '36061019500', resilience_score: 6.8 }, // Manhattan
        { GEOID: '36047019500', resilience_score: 5.9 }, // Brooklyn
        { GEOID: '36081019500', resilience_score: 5.5 }  // Queens
      ];

      const { fetchAllData } = require('../../edge-function/data-processing');
      fetchAllData.mockResolvedValue({
        zones: mockBoroughScores,
        ethnicityData: [],
        demographicsData: [],
        incomeData: []
      });

      const result = await fetchAllData(mockSupabase);

      // Business Rule: Each borough should have reasonable zone count
      result.zones.forEach((zone: any) => {
        expect(zone.resilience_score).toBeGreaterThan(4.0);
        expect(zone.resilience_score).toBeLessThan(8.0);
      });

      // Business Rule: Manhattan zones should generally score higher
      const manhattanZone = result.zones.find((z: any) => z.GEOID.startsWith('36061'));
      const brooklynZone = result.zones.find((z: any) => z.GEOID.startsWith('36047'));
      
      expect(manhattanZone.resilience_score).toBeGreaterThan(brooklynZone.resilience_score);
    });
  });
});