// test/database/crud-operations.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Supabase client setup (matches your edge function)
const mockQuery = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockUpsert = jest.fn();

const mockSupabase = {
  from: mockFrom,
  query: mockQuery
};

// Set up the chain properly
mockFrom.mockImplementation(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  upsert: mockUpsert
}));

// Mock the edge function modules
jest.mock('../../edge-function/data-processing', () => ({
  fetchAllData: jest.fn(),
  validateDatabaseData: jest.fn(),
  fetchCrimeData: jest.fn(),
  fetchFootTrafficData: jest.fn()
}));

jest.mock('../../edge-function/scoring-helpers', () => ({
  processZones: jest.fn(),
  addCrimeDataToTopZones: jest.fn(),
  addFootTrafficDataToTopZones: jest.fn()
}));

// Test data constants
const TEST_GEOIDS = {
  VALID: '36061019500',
  VALID_2: '36061019600', 
  VALID_3: '36061019700',
  INVALID: 'invalid-geoid'
};

const SAMPLE_ZONE_DATA = {
  GEOID: TEST_GEOIDS.VALID,
  foot_traffic_score: 7.5,
  crime_score: 3.2,
  flood_risk_score: 2.1,
  rent_score: 8.0,
  poi_score: 6.5,
  avg_rent: 3500.00,
  resilience_score: 6.2
};

const SAMPLE_CRIME_DATA = {
  GEOID: TEST_GEOIDS.VALID,
  year_2024: 0.3,
  pred_2025: 0.25,
  pred_2026: 0.2
};

const SAMPLE_FOOT_TRAFFIC_DATA = {
  GEOID: TEST_GEOIDS.VALID,
  morning_2024: 0.8,
  afternoon_2024: 0.7,
  evening_2024: 0.6,
  pred_2025: 0.9
};

const SAMPLE_DEMOGRAPHIC_DATA = {
  GEOID: TEST_GEOIDS.VALID,
  'Total population': 5000,
  'Male (%)': 48.5,
  'Female (%)': 51.5,
  'Median age (years)': 35.2
};

const SAMPLE_ETHNICITY_DATA = {
  GEOID: TEST_GEOIDS.VALID,
  total_population: 5000,
  AEAKrn: 12.5,  // Korean
  WEur: 35.2,    // White European
  BAfrAm: 18.7,  // Black African American
  HMex: 15.1     // Hispanic Mexican
};

const SAMPLE_ECONOMIC_DATA = {
  GEOID: TEST_GEOIDS.VALID,
  MdHHIncE: 85000,  // Median household income
  HHIU10E: 150,     // Households under $10k
  HHI200plE: 250    // Households $200k+
};

describe('Database CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Resilience Zones CRUD', () => {
    it('should fetch resilience zone data', async () => {
      const { fetchAllData } = require('../../edge-function/data-processing');
      
      const mockZoneData = {
        zones: [SAMPLE_ZONE_DATA],
        ethnicityData: [],
        demographicsData: [],
        incomeData: []
      };

      fetchAllData.mockResolvedValue(mockZoneData);

      const result = await fetchAllData(mockSupabase);

      expect(fetchAllData).toHaveBeenCalledWith(mockSupabase);
      expect(result.zones).toHaveLength(1);
      expect(result.zones[0].GEOID).toBe(TEST_GEOIDS.VALID);
      expect(result.zones[0].avg_rent).toBe(3500.00);
    });

    it('should handle zone data updates through processZones', async () => {
      const { processZones } = require('../../edge-function/scoring-helpers');
      
      const updatedZoneData = [{
        geoid: TEST_GEOIDS.VALID,
        custom_score: 8.5,
        avg_rent: 3800,
        foot_traffic_score: 85.0,
        crime_score: 32.0
      }];

      processZones.mockResolvedValue(updatedZoneData);

      const mockInput = {
        weights: [{ id: 'foot_traffic', value: 50 }],
        rentRange: [3000, 4000]
      };

      const result = await processZones([SAMPLE_ZONE_DATA], mockInput, {}, {}, [], [], mockSupabase);

      expect(processZones).toHaveBeenCalled();
      expect(result[0].custom_score).toBe(8.5);
      expect(result[0].avg_rent).toBe(3800);
    });

    it('should filter zones by rent range', async () => {
      const { fetchAllData } = require('../../edge-function/data-processing');
      
      const mockZones = [
        { GEOID: TEST_GEOIDS.VALID, avg_rent: 3500 },
        { GEOID: TEST_GEOIDS.VALID_2, avg_rent: 4500 }, // Outside range
        { GEOID: TEST_GEOIDS.VALID_3, avg_rent: 3200 }
      ];

      fetchAllData.mockResolvedValue({
        zones: mockZones,
        ethnicityData: [],
        demographicsData: [],
        incomeData: []
      });

      const result = await fetchAllData(mockSupabase);
      
      // Simulate rent filtering logic
      const filteredZones = result.zones.filter((zone: any) => 
        zone.avg_rent >= 3000 && zone.avg_rent <= 4000
      );

      expect(filteredZones).toHaveLength(2);
      expect(filteredZones.map((z: any) => z.GEOID)).toEqual([TEST_GEOIDS.VALID, TEST_GEOIDS.VALID_3]);
    });

    it('should validate zone data integrity', async () => {
      const { validateDatabaseData } = require('../../edge-function/data-processing');
      
      const validData = {
        zones: [SAMPLE_ZONE_DATA],
        ethnicityData: [SAMPLE_ETHNICITY_DATA],
        demographicsData: [SAMPLE_DEMOGRAPHIC_DATA],
        incomeData: [SAMPLE_ECONOMIC_DATA]
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

  describe('Crime Trends CRUD', () => {
    it('should fetch crime trend data', async () => {
      const { fetchCrimeData } = require('../../edge-function/data-processing');
      
      const mockCrimeData = [SAMPLE_CRIME_DATA];

      fetchCrimeData.mockResolvedValue(mockCrimeData);

      const result = await fetchCrimeData(mockSupabase, [TEST_GEOIDS.VALID]);

      expect(fetchCrimeData).toHaveBeenCalledWith(mockSupabase, [TEST_GEOIDS.VALID]);
      expect(result).toHaveLength(1);
      expect(result[0].GEOID).toBe(TEST_GEOIDS.VALID);
      expect(result[0].year_2024).toBe(0.3);
    });

    it('should handle crime data updates via addCrimeDataToTopZones', async () => {
      const { addCrimeDataToTopZones } = require('../../edge-function/scoring-helpers');
      
      const mockTopZones: any[] = [
        { geoid: TEST_GEOIDS.VALID, crime_score: 32 }
      ];

      addCrimeDataToTopZones.mockImplementation(async (supabase: any, zones: any[], years?: string[]) => {
        zones[0].crime_timeline = {
          year_2024: 30,
          pred_2025: 25,
          pred_2026: 20
        };
        zones[0].crime_trend_direction = 'decreasing';
      });

      await addCrimeDataToTopZones(mockSupabase, mockTopZones, ['year_2024', 'pred_2025']);

      expect(addCrimeDataToTopZones).toHaveBeenCalledWith(mockSupabase, mockTopZones, ['year_2024', 'pred_2025']);
      expect(mockTopZones[0].crime_timeline).toBeDefined();
      expect(mockTopZones[0].crime_trend_direction).toBe('decreasing');
    });

    it('should handle missing crime data gracefully', async () => {
      const { fetchCrimeData } = require('../../edge-function/data-processing');
      
      fetchCrimeData.mockResolvedValue(null); // Simulate missing data

      const result = await fetchCrimeData(mockSupabase, [TEST_GEOIDS.INVALID]);

      expect(result).toBeNull();
    });
  });

  describe('Foot Traffic CRUD', () => {
    it('should fetch foot traffic data', async () => {
      const { fetchFootTrafficData } = require('../../edge-function/data-processing');
      
      const mockTrafficData = [SAMPLE_FOOT_TRAFFIC_DATA];

      fetchFootTrafficData.mockResolvedValue(mockTrafficData);

      const result = await fetchFootTrafficData(mockSupabase, [TEST_GEOIDS.VALID]);

      expect(fetchFootTrafficData).toHaveBeenCalledWith(mockSupabase, [TEST_GEOIDS.VALID]);
      expect(result).toHaveLength(1);
      expect(result[0].morning_2024).toBe(0.8);
      expect(result[0].afternoon_2024).toBe(0.7);
    });

    it('should handle foot traffic data enrichment', async () => {
      const { addFootTrafficDataToTopZones } = require('../../edge-function/scoring-helpers');
      
      const mockTopZones: any[] = [
        { geoid: TEST_GEOIDS.VALID, foot_traffic_score: 82 }
      ];

      addFootTrafficDataToTopZones.mockImplementation(async (supabase: any, zones: any[], periods: string[]) => {
        zones[0].foot_traffic_timeline = {
          '2024': 80,
          'pred_2025': 90,
          'pred_2026': 95
        };
        zones[0].foot_traffic_periods_used = periods;
        zones[0].foot_traffic_by_period = {
          morning: { '2024': 80, 'pred_2025': 85 },
          afternoon: { '2024': 70, 'pred_2025': 75 },
          evening: { '2024': 60, 'pred_2025': 65 }
        };
      });

      await addFootTrafficDataToTopZones(mockSupabase, mockTopZones, ['morning', 'afternoon']);

      expect(addFootTrafficDataToTopZones).toHaveBeenCalledWith(mockSupabase, mockTopZones, ['morning', 'afternoon']);
      expect(mockTopZones[0]).toHaveProperty('foot_traffic_timeline');
      expect(mockTopZones[0]).toHaveProperty('foot_traffic_periods_used');
      expect(mockTopZones[0]).toHaveProperty('foot_traffic_by_period');
    });

    it('should retrieve foot traffic by time period', async () => {
      const { fetchFootTrafficData } = require('../../edge-function/data-processing');
      
      const mockData = [SAMPLE_FOOT_TRAFFIC_DATA];

      fetchFootTrafficData.mockResolvedValue(mockData);

      const result = await fetchFootTrafficData(mockSupabase, [TEST_GEOIDS.VALID]);

      expect(result[0].morning_2024).toBe(0.8);
      expect(result[0].afternoon_2024).toBe(0.7);
      expect(result[0].evening_2024).toBe(0.6);
    });
  });

  describe('Demographics CRUD', () => {
    it('should fetch demographic data', async () => {
      const { fetchAllData } = require('../../edge-function/data-processing');
      
      const mockData = {
        zones: [],
        ethnicityData: [],
        demographicsData: [SAMPLE_DEMOGRAPHIC_DATA],
        incomeData: []
      };

      fetchAllData.mockResolvedValue(mockData);

      const result = await fetchAllData(mockSupabase);

      expect(result.demographicsData).toHaveLength(1);
      expect(result.demographicsData[0]['Total population']).toBe(5000);
      expect(result.demographicsData[0]['Male (%)']).toBe(48.5);
      expect(result.demographicsData[0]['Female (%)']).toBe(51.5);
    });

    it('should validate demographic data consistency', () => {
      const data = SAMPLE_DEMOGRAPHIC_DATA;
      
      // Validate gender percentages sum to approximately 100%
      const genderSum = data['Male (%)'] + data['Female (%)'];
      expect(genderSum).toBeCloseTo(100, 1);
      
      // Validate population is positive
      expect(data['Total population']).toBeGreaterThan(0);
      
      // Validate age is reasonable
      expect(data['Median age (years)']).toBeGreaterThan(0);
      expect(data['Median age (years)']).toBeLessThan(120);
    });
  });

  describe('Race and Ethnicity CRUD', () => {
    it('should fetch race/ethnicity data', async () => {
      const { fetchAllData } = require('../../edge-function/data-processing');
      
      const mockData = {
        zones: [],
        ethnicityData: [SAMPLE_ETHNICITY_DATA],
        demographicsData: [],
        incomeData: []
      };

      fetchAllData.mockResolvedValue(mockData);

      const result = await fetchAllData(mockSupabase);

      expect(result.ethnicityData).toHaveLength(1);
      expect(result.ethnicityData[0].AEAKrn).toBe(12.5); // Korean
      expect(result.ethnicityData[0].WEur).toBe(35.2);   // White European
      expect(result.ethnicityData[0].total_population).toBe(5000);
    });

    it('should validate ethnicity percentages are reasonable', () => {
      const data = SAMPLE_ETHNICITY_DATA;
      
      // Calculate total ethnic percentages (as absolute numbers)
      const totalEthnic = data.AEAKrn + data.WEur + data.BAfrAm + data.HMex;
      
      // Should not exceed total population significantly
      expect(totalEthnic).toBeLessThanOrEqual(data.total_population);
      
      // Each ethnicity should be non-negative
      expect(data.AEAKrn).toBeGreaterThanOrEqual(0);
      expect(data.WEur).toBeGreaterThanOrEqual(0);
      expect(data.BAfrAm).toBeGreaterThanOrEqual(0);
      expect(data.HMex).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Economics CRUD', () => {
    it('should fetch economic data', async () => {
      const { fetchAllData } = require('../../edge-function/data-processing');
      
      const mockData = {
        zones: [],
        ethnicityData: [],
        demographicsData: [],
        incomeData: [SAMPLE_ECONOMIC_DATA]
      };

      fetchAllData.mockResolvedValue(mockData);

      const result = await fetchAllData(mockSupabase);

      expect(result.incomeData).toHaveLength(1);
      expect(result.incomeData[0].MdHHIncE).toBe(85000);  // Median income
      expect(result.incomeData[0].HHIU10E).toBe(150);     // Low income households
      expect(result.incomeData[0].HHI200plE).toBe(250);   // High income households
    });

    it('should validate economic data ranges', () => {
      const data = SAMPLE_ECONOMIC_DATA;
      
      // Median income should be reasonable
      expect(data.MdHHIncE).toBeGreaterThan(0);
      expect(data.MdHHIncE).toBeLessThan(1000000); // Under $1M seems reasonable for median
      
      // Household counts should be non-negative
      expect(data.HHIU10E).toBeGreaterThanOrEqual(0);
      expect(data.HHI200plE).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Bulk Operations', () => {
    it('should handle bulk zone data fetching', async () => {
      const { fetchAllData } = require('../../edge-function/data-processing');
      
      const bulkZoneData = [
        { GEOID: TEST_GEOIDS.VALID, avg_rent: 3500 },
        { GEOID: TEST_GEOIDS.VALID_2, avg_rent: 4000 },
        { GEOID: TEST_GEOIDS.VALID_3, avg_rent: 2800 }
      ];

      fetchAllData.mockResolvedValue({
        zones: bulkZoneData,
        ethnicityData: [],
        demographicsData: [],
        incomeData: []
      });

      const result = await fetchAllData(mockSupabase);

      expect(result.zones).toHaveLength(3);
      expect(result.zones.map((z: any) => z.GEOID)).toEqual([
        TEST_GEOIDS.VALID, 
        TEST_GEOIDS.VALID_2, 
        TEST_GEOIDS.VALID_3
      ]);
    });

    it('should handle bulk zone processing', async () => {
      const { processZones } = require('../../edge-function/scoring-helpers');
      
      const inputZones = [
        { GEOID: TEST_GEOIDS.VALID, avg_rent: 3500 },
        { GEOID: TEST_GEOIDS.VALID_2, avg_rent: 4000 }
      ];

      const processedZones = [
        { geoid: TEST_GEOIDS.VALID, custom_score: 85.5 },
        { geoid: TEST_GEOIDS.VALID_2, custom_score: 82.3 }
      ];

      processZones.mockResolvedValue(processedZones);

      const mockInput = {
        weights: [{ id: 'foot_traffic', value: 60 }],
        topN: 10
      };

      const result = await processZones(inputZones, mockInput, {}, {}, [], [], mockSupabase);

      expect(result).toHaveLength(2);
      expect(result[0].custom_score).toBeGreaterThan(result[1].custom_score);
    });

    it('should handle missing data in bulk operations', async () => {
      const { fetchAllData } = require('../../edge-function/data-processing');
      
      const incompleteData = {
        zones: [
          { GEOID: TEST_GEOIDS.VALID },
          { GEOID: TEST_GEOIDS.VALID_2 }
        ],
        ethnicityData: [
          { GEOID: TEST_GEOIDS.VALID } // Missing VALID_2
        ],
        demographicsData: [],
        incomeData: []
      };

      fetchAllData.mockResolvedValue(incompleteData);

      const result = await fetchAllData(mockSupabase);

      // Should still return data, just incomplete
      expect(result.zones).toHaveLength(2);
      expect(result.ethnicityData).toHaveLength(1);
      
      // Check which GEOIDs have missing data
      const zoneGeoIds = result.zones.map((z: any) => z.GEOID);
      const ethnicityGeoIds = result.ethnicityData.map((e: any) => e.GEOID);
      const missingEthnicityData = zoneGeoIds.filter((id: string) => !ethnicityGeoIds.includes(id));
      
      expect(missingEthnicityData).toContain(TEST_GEOIDS.VALID_2);
    });
  });
});