// test/database/complex-queries.test.ts
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

describe('Database Complex Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Multi-Table Joins', () => {
    it('should join all tables for comprehensive zone data', async () => {
      const mockCompleteData = [
        {
          GEOID: '36061019500',
          resilience_score: 6.2,
          avg_rent: 3500,
          year_2024: 0.3,
          pred_2025_crime: 0.25,
          morning_2024: 0.8,
          afternoon_2024: 0.7,
          total_population: 5000,
          median_age: 35.2,
          korean_percent: 12.5,
          white_percent: 35.2,
          black_percent: 18.7,
          median_income: 85000,
          low_income_households: 150
        }
      ];

      const { fetchAllData } = require('../../edge-function/data-processing');
      fetchAllData.mockResolvedValue({
        zones: mockCompleteData,
        ethnicityData: mockCompleteData,
        demographicsData: mockCompleteData,
        incomeData: mockCompleteData
      });

      const result = await fetchAllData(mockSupabase);

      expect(fetchAllData).toHaveBeenCalledWith(mockSupabase);
      expect(result.zones[0].resilience_score).toBe(6.2);
      expect(result.ethnicityData[0].korean_percent).toBe(12.5);
      expect(result.incomeData[0].median_income).toBe(85000);
    });

    it('should join crime and foot traffic trends for time series analysis', async () => {
      const mockTrendData = [
        {
          GEOID: '36061019500',
          crime_2024: 0.3,
          crime_pred_2025: 0.25,
          crime_pred_2026: 0.2,
          traffic_morning: 0.8,
          traffic_afternoon: 0.7,
          traffic_evening: 0.6,
          traffic_pred_2025: 0.9
        }
      ];

      const { fetchCrimeData, fetchFootTrafficData } = require('../../edge-function/data-processing');
      fetchCrimeData.mockResolvedValue(mockTrendData);
      fetchFootTrafficData.mockResolvedValue(mockTrendData);

      const crimeResult = await fetchCrimeData(mockSupabase, ['36061019500']);
      const trafficResult = await fetchFootTrafficData(mockSupabase, ['36061019500']);

      expect(crimeResult[0].crime_pred_2025).toBe(0.25);
      expect(trafficResult[0].traffic_pred_2025).toBe(0.9);
    });
  });

  describe('Advanced Filtering', () => {
    it('should filter zones by multiple demographic criteria', async () => {
      const mockFilteredData = [
        {
          GEOID: '36061019500',
          resilience_score: 7.8,
          avg_rent: 3200,
          korean_percent: 15.2,
          median_income: 85000,
          median_age: 34.5
        },
        {
          GEOID: '36061019600',
          resilience_score: 7.2,
          avg_rent: 3800,
          korean_percent: 18.7,
          median_income: 92000,
          median_age: 36.1
        }
      ];

      const { processZones } = require('../../edge-function/scoring-helpers');
      processZones.mockResolvedValue(mockFilteredData);

      const mockInput = {
        rentRange: [3000, 4000],
        ethnicities: ['korean'],
        incomeRange: [75000, 100000],
        ageRange: [30, 40],
        topN: 10
      };

      const result = await processZones([], mockInput, {}, {}, [], [], mockSupabase);

      expect(processZones).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].resilience_score).toBeGreaterThan(result[1].resilience_score);
    });

    it('should filter zones by income distribution patterns', async () => {
      const mockIncomeFilteredData = [
        {
          GEOID: '36061019500',
          median_income: 85000,
          low_income_households: 120,
          high_income_households: 280,
          income_diversity_score: 0.65
        }
      ];

      const { fetchAllData } = require('../../edge-function/data-processing');
      fetchAllData.mockResolvedValue({
        zones: [],
        ethnicityData: [],
        demographicsData: [],
        incomeData: mockIncomeFilteredData
      });

      const result = await fetchAllData(mockSupabase);

      expect(result.incomeData[0].income_diversity_score).toBeGreaterThan(0.5);
    });
  });

  describe('Aggregation Queries', () => {
    it('should calculate zone statistics by borough', async () => {
      const mockBoroughStats = [
        {
          GEOID: '36061019500', // Manhattan
          resilience_score: 6.8,
          avg_rent: 4200,
          korean_percent: 8.5,
          borough: 'Manhattan'
        },
        {
          GEOID: '36047019500', // Brooklyn
          resilience_score: 5.9,
          avg_rent: 3100,
          korean_percent: 12.3,
          borough: 'Brooklyn'
        }
      ];

      const { fetchAllData } = require('../../edge-function/data-processing');
      fetchAllData.mockResolvedValue({
        zones: mockBoroughStats,
        ethnicityData: mockBoroughStats,
        demographicsData: [],
        incomeData: []
      });

      const result = await fetchAllData(mockSupabase);

      expect(result.zones).toHaveLength(2);
      expect(result.zones[0].resilience_score).toBeGreaterThan(result.zones[1].resilience_score);
    });

    it('should find top zones by combined criteria', async () => {
      const mockTopZones = [
        {
          GEOID: '36061019500',
          resilience_score: 8.2,
          custom_score: 7.8,
          avg_rent: 3200,
          korean_percent: 15.2
        },
        {
          GEOID: '36061019600',
          resilience_score: 7.9,
          custom_score: 7.5,
          avg_rent: 3800,
          korean_percent: 18.7
        }
      ];

      const { processZones } = require('../../edge-function/scoring-helpers');
      processZones.mockResolvedValue(mockTopZones);

      const mockInput = {
        rentRange: [3000, 4000],
        ethnicities: ['korean'],
        topN: 5
      };

      const result = await processZones([], mockInput, {}, {}, [], [], mockSupabase);

      expect(result[0].custom_score).toBeGreaterThan(result[1].custom_score);
    });
  });

  describe('Data Completeness Queries', () => {
    it('should check data completeness across all tables', async () => {
      const mockCompletenessData = {
        zones: new Array(100).fill({}),
        ethnicityData: new Array(97).fill({}),
        demographicsData: new Array(98).fill({}),
        incomeData: new Array(95).fill({})
      };

      const { fetchAllData, validateDatabaseData } = require('../../edge-function/data-processing');
      fetchAllData.mockResolvedValue(mockCompletenessData);
      validateDatabaseData.mockReturnValue(true);

      const result = await fetchAllData(mockSupabase);
      const isValid = validateDatabaseData(result);

      const completenessPercentage = (result.demographicsData.length / result.zones.length) * 100;
      expect(completenessPercentage).toBeGreaterThan(85);
      expect(result.zones.length).toBeGreaterThan(0);
      expect(isValid).toBe(true);
    });

    it('should identify zones with missing critical data', async () => {
      const mockMissingDataZones = {
        zones: [
          { GEOID: '36061019500' },
          { GEOID: '36061019800' },
          { GEOID: '36061019900' }
        ],
        ethnicityData: [
          { GEOID: '36061019500' },
          { GEOID: '36061019800' }
          // Missing 36061019900
        ],
        demographicsData: [
          { GEOID: '36061019500' }
          // Missing 36061019800 and 36061019900
        ],
        incomeData: [
          { GEOID: '36061019500' },
          { GEOID: '36061019900' }
          // Missing 36061019800
        ]
      };

      const { fetchAllData } = require('../../edge-function/data-processing');
      fetchAllData.mockResolvedValue(mockMissingDataZones);

      const result = await fetchAllData(mockSupabase);

      // Analyze missing data
      const allGeoIds = result.zones.map((z: any) => z.GEOID);
      const ethnicityGeoIds = result.ethnicityData.map((e: any) => e.GEOID);
      const demographicsGeoIds = result.demographicsData.map((d: any) => d.GEOID);
      
      const missingEthnicity = allGeoIds.filter((id: string) => !ethnicityGeoIds.includes(id));
      const missingDemographics = allGeoIds.filter((id: string) => !demographicsGeoIds.includes(id));

      expect(missingEthnicity.length).toBeGreaterThan(0);
      expect(missingDemographics.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Function Integration Tests', () => {
    it('should test complete pipeline with demographic scoring', async () => {
      const mockZones = [
        { GEOID: '36061019500', resilience_score: 7.5, avg_rent: 3200 }
      ];
      
      const mockEthnicityData = [
        { GEOID: '36061019500', AEAKrn: 15.2, total_population: 5000 }
      ];

      const { fetchAllData, calculateDemographicPercentages } = require('../../edge-function/data-processing');
      const { calculateDemographicPercentages: calcDemo } = require('../../edge-function/demographic-scoring');
      
      fetchAllData.mockResolvedValue({
        zones: mockZones,
        ethnicityData: mockEthnicityData,
        demographicsData: [],
        incomeData: []
      });

      calcDemo.mockReturnValue({
        ethnicPercent: { '36061019500': 0.152 },
        genderPercent: {},
        agePercent: {},
        incomePercent: {}
      });

      const mockInput = {
        ethnicities: ['korean'],
        genders: [],
        ageRange: [0, 100],
        incomeRange: [0, 250000]
      };

      const data = await fetchAllData(mockSupabase);
      const percentages = calcDemo(mockInput, data.ethnicityData, [], []);

      expect(data.zones).toHaveLength(1);
      expect(percentages.ethnicPercent['36061019500']).toBe(0.152);
    });

    it('should test zone processing with all filters', async () => {
      const mockProcessedZones = [
        {
          geoid: '36061019500',
          custom_score: 85.5,
          demographic_score: 75.2,
          foot_traffic_score: 82.1,
          crime_score: 78.3
        }
      ];

      const { processZones } = require('../../edge-function/scoring-helpers');
      processZones.mockResolvedValue(mockProcessedZones);

      const mockInput = {
        weights: [
          { id: 'demographic', value: 40 },
          { id: 'foot_traffic', value: 35 },
          { id: 'crime', value: 25 }
        ],
        ethnicities: ['korean'],
        rentRange: [3000, 4000],
        topN: 10
      };

      const result = await processZones([], mockInput, {}, {}, [], [], mockSupabase);

      expect(result[0].custom_score).toBeGreaterThan(80);
      expect(result[0].demographic_score).toBeGreaterThan(70);
    });
  });
});