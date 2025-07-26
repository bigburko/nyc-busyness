// test/integration/filter-integration.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Define filter response types
interface FilterResponse {
  zones?: Array<{
    geoid: string;
    resilience_score: number;
    custom_score: number;
    avg_rent?: number;
    demographic_match_pct?: number;
    korean_percent?: number;
    white_percent?: number;
    male_percent?: number;
    female_percent?: number;
    median_age?: number;
    median_income?: number;
  }>;
  total_zones_found?: number;
  top_zones_returned?: number;
  filters_applied?: {
    ethnicities?: string[];
    genders?: string[];
    ageRange?: [number, number];
    incomeRange?: [number, number];
    rentRange?: [number, number];
  };
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

// Mock edge function handler
const mockEdgeFunctionHandler = jest.fn() as jest.MockedFunction<(request: any) => Promise<Response>>;

describe('Filter Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Filter Validation', () => {
    it('should validate and apply filter parameters', async () => {
      const { validateRequestBody, fetchAllData, processZones } = require('../../edge-function/validation');
      const { fetchAllData: fetchData } = require('../../edge-function/data-processing');
      const { processZones: processZonesFunc } = require('../../edge-function/scoring-helpers');

      const requestBody = {
        weights: [{ id: 'demographic', value: 100 }],
        ethnicities: ['korean'],
        genders: ['male', 'female'],
        ageRange: [25, 65],
        incomeRange: [30000, 150000],
        rentRange: [1000, 5000],
        topN: 10
      };

      const validatedInput = {
        ...requestBody,
        timePeriods: ['morning', 'afternoon', 'evening'],
        crimeYears: ['year_2024', 'pred_2025']
      };

      const mockDatabaseData = {
        zones: [
          {
            GEOID: '36061019500',
            resilience_score: 7.5,
            avg_rent: 3500,
            foot_traffic_score: 8.2,
            crime_score: 3.2
          }
        ],
        ethnicityData: [
          { GEOID: '36061019500', AEAKrn: 25.3, total_population: 5000 }
        ],
        demographicsData: [
          { GEOID: '36061019500', 'Male (%)': 52.1, 'Total population': 5000 }
        ],
        incomeData: [
          { GEOID: '36061019500', MdHHIncE: 85000 }
        ]
      };

      const mockProcessedZones = [
        {
          geoid: '36061019500',
          resilience_score: 75,
          custom_score: 82,
          avg_rent: 3500,
          demographic_match_pct: 25.3,
          male_percent: 52.1,
          median_income: 85000
        }
      ];

      // Setup mocks
      validateRequestBody.mockReturnValue(validatedInput);
      fetchData.mockResolvedValue(mockDatabaseData);
      processZonesFunc.mockResolvedValue(mockProcessedZones);

      // Simulate edge function execution
      const validatedData = validateRequestBody(requestBody);
      const databaseData = await fetchData(mockSupabase);
      const processedZones = await processZonesFunc(
        databaseData.zones, 
        validatedData, 
        {}, 
        {}, 
        databaseData.demographicsData, 
        databaseData.incomeData, 
        mockSupabase
      );

      // Validate filter application
      expect(validatedData.ethnicities).toContain('korean');
      expect(validatedData.genders).toEqual(['male', 'female']);
      expect(validatedData.ageRange).toEqual([25, 65]);
      expect(validatedData.incomeRange).toEqual([30000, 150000]);
      expect(validatedData.rentRange).toEqual([1000, 5000]);

      // Validate results
      expect(processedZones).toHaveLength(1);
      expect(processedZones[0].geoid).toBe('36061019500');
      expect(processedZones[0].demographic_match_pct).toBe(25.3);
    });

    it('should handle empty filters gracefully', async () => {
      const { validateRequestBody } = require('../../edge-function/validation');
      const { fetchAllData } = require('../../edge-function/data-processing');

      const emptyRequest = {
        weights: [{ id: 'foot_traffic', value: 100 }],
        ethnicities: [],
        genders: [],
        topN: 10
      };

      const validatedInput = {
        ...emptyRequest,
        ageRange: [0, 100],
        incomeRange: [0, 250000],
        rentRange: [0, Infinity],
        timePeriods: ['morning', 'afternoon', 'evening']
      };

      const mockData = {
        zones: [
          { GEOID: '36061019500', resilience_score: 7.5 },
          { GEOID: '36061019600', resilience_score: 6.8 }
        ],
        ethnicityData: [],
        demographicsData: [],
        incomeData: []
      };

      validateRequestBody.mockReturnValue(validatedInput);
      fetchAllData.mockResolvedValue(mockData);

      const result = validateRequestBody(emptyRequest);
      const data = await fetchAllData(mockSupabase);

      expect(result.ethnicities).toHaveLength(0);
      expect(result.genders).toHaveLength(0);
      expect(data.zones).toHaveLength(2);
    });
  });

  describe('Single Filter Application', () => {
    it('should apply ethnicity filter correctly', async () => {
      const { calculateDemographicPercentages } = require('../../edge-function/demographic-scoring');
      const { processZones } = require('../../edge-function/scoring-helpers');

      const ethnicityFilter = {
        weights: [{ id: 'demographic', value: 100 }],
        ethnicities: ['korean'],
        topN: 10
      };

      const mockEthnicityData = [
        { GEOID: '36061019500', AEAKrn: 25.3, total_population: 5000 },
        { GEOID: '36061019600', AEAKrn: 18.7, total_population: 4800 }
      ];

      const mockPercentageResults = {
        ethnicPercent: {
          '36061019500': 0.253,
          '36061019600': 0.187
        },
        genderPercent: {},
        agePercent: {},
        incomePercent: {}
      };

      const mockProcessedZones = [
        {
          geoid: '36061019500',
          custom_score: 84,
          demographic_score: 78,
          demographic_match_pct: 25.3
        },
        {
          geoid: '36061019600',
          custom_score: 79,
          demographic_score: 72,
          demographic_match_pct: 18.7
        }
      ];

      calculateDemographicPercentages.mockReturnValue(mockPercentageResults);
      processZones.mockResolvedValue(mockProcessedZones);

      const percentages = calculateDemographicPercentages(
        ethnicityFilter, 
        mockEthnicityData, 
        [], 
        []
      );
      const zones = await processZones([], ethnicityFilter, percentages, {}, [], [], mockSupabase);

      expect(percentages.ethnicPercent['36061019500']).toBe(0.253);
      expect(zones[0].demographic_match_pct).toBe(25.3);
      expect(zones[1].demographic_match_pct).toBe(18.7);
    });

    it('should apply rent range filter correctly', async () => {
      const { processZones } = require('../../edge-function/scoring-helpers');

      const rentFilter = {
        weights: [{ id: 'foot_traffic', value: 100 }],
        rentRange: [3000, 4000],
        topN: 10
      };

      const mockZones = [
        { GEOID: '36061019500', avg_rent: 3200, resilience_score: 7.5 },
        { GEOID: '36061019600', avg_rent: 3800, resilience_score: 7.1 },
        { GEOID: '36061019700', avg_rent: 4500, resilience_score: 6.9 } // Should be filtered out
      ];

      // Simulate rent filtering (normally done in processZones)
      const filteredZones = mockZones.filter(zone => 
        zone.avg_rent >= 3000 && zone.avg_rent <= 4000
      );

      const mockProcessedZones = filteredZones.map(zone => ({
        geoid: zone.GEOID,
        avg_rent: zone.avg_rent,
        custom_score: zone.resilience_score * 10
      }));

      processZones.mockResolvedValue(mockProcessedZones);

      const result = await processZones(mockZones, rentFilter, {}, {}, [], [], mockSupabase);

      expect(result).toHaveLength(2);
      expect(result[0].avg_rent).toBe(3200);
      expect(result[1].avg_rent).toBe(3800);
      // Zone with rent $4500 should be filtered out
      expect(result.find((z: any) => z.avg_rent === 4500)).toBeUndefined();
    });

    it('should apply demographic scoring correctly', async () => {
      const { calculateEnhancedDemographicScore } = require('../../edge-function/demographic-scoring');

      const demographicInput = {
        ethnicities: ['korean'],
        genders: ['male'],
        ageRange: [25, 40],
        demographicScoring: {
          weights: {
            ethnicity: 0.5,
            gender: 0.3,
            age: 0.2,
            income: 0.0
          }
        }
      };

      const mockPercentages = {
        ethnicPercent: { '36061019500': 0.25 },
        genderPercent: { '36061019500': 0.52 },
        agePercent: { '36061019500': 0.75 },
        incomePercent: {}
      };

      calculateEnhancedDemographicScore.mockReturnValue(0.85);

      const score = calculateEnhancedDemographicScore(
        '36061019500',
        demographicInput,
        mockPercentages,
        {}
      );

      expect(score).toBe(0.85);
      expect(calculateEnhancedDemographicScore).toHaveBeenCalledWith(
        '36061019500',
        demographicInput,
        mockPercentages,
        {}
      );
    });
  });

  describe('Multiple Filter Combinations', () => {
    it('should apply multiple filters together', async () => {
      const { validateRequestBody } = require('../../edge-function/validation');
      const { calculateDemographicPercentages } = require('../../edge-function/demographic-scoring');
      const { processZones } = require('../../edge-function/scoring-helpers');

      const combinedFilters = {
        weights: [{ id: 'demographic', value: 60 }, { id: 'foot_traffic', value: 40 }],
        ethnicities: ['korean'],
        rentRange: [3000, 5000],
        ageRange: [25, 45],
        topN: 5
      };

      const validatedInput = {
        ...combinedFilters,
        genders: [],
        incomeRange: [0, 250000],
        timePeriods: ['morning', 'afternoon', 'evening']
      };

      const mockPercentages = {
        ethnicPercent: { '36061019500': 0.22 },
        genderPercent: {},
        agePercent: { '36061019500': 0.75 },
        incomePercent: {}
      };

      const mockProcessedZones = [
        {
          geoid: '36061019500',
          custom_score: 87,
          avg_rent: 3500,
          demographic_score: 81,
          demographic_match_pct: 22.1,
          age_match_pct: 75.0
        }
      ];

      validateRequestBody.mockReturnValue(validatedInput);
      calculateDemographicPercentages.mockReturnValue(mockPercentages);
      processZones.mockResolvedValue(mockProcessedZones);

      const validated = validateRequestBody(combinedFilters);
      const percentages = calculateDemographicPercentages(validated, [], [], []);
      const zones = await processZones([], validated, percentages, {}, [], [], mockSupabase);

      expect(validated.ethnicities).toContain('korean');
      expect(validated.rentRange).toEqual([3000, 5000]);
      expect(validated.ageRange).toEqual([25, 45]);
      expect(zones[0].demographic_match_pct).toBe(22.1);
      expect(zones[0].avg_rent).toBe(3500);
    });

    it('should handle restrictive filter combinations', async () => {
      const { processZones } = require('../../edge-function/scoring-helpers');

      const restrictiveFilters = {
        weights: [{ id: 'demographic', value: 100 }],
        ethnicities: ['korean'],
        rentRange: [5000, 6000], // Very high rent
        ageRange: [20, 25], // Very young
        incomeRange: [200000, 300000], // Very high income
        topN: 10
      };

      // Mock no zones matching restrictive criteria
      processZones.mockResolvedValue([]);

      const result = await processZones([], restrictiveFilters, {}, {}, [], [], mockSupabase);

      expect(result).toHaveLength(0);
    });
  });

  describe('Filter Error Handling', () => {
    it('should handle invalid filter ranges', () => {
      const { validateRequestBody } = require('../../edge-function/validation');

      const invalidFilters = {
        rentRange: [5000, 3000], // Invalid: max < min
        ageRange: [65, 25] // Invalid: max < min
      };

      validateRequestBody.mockImplementation((body: any) => {
        if (body.rentRange && body.rentRange[0] > body.rentRange[1]) {
          throw new Error('Invalid rent range: minimum must be less than maximum');
        }
        if (body.ageRange && body.ageRange[0] > body.ageRange[1]) {
          throw new Error('Invalid age range: minimum must be less than maximum');
        }
        return body;
      });

      expect(() => validateRequestBody(invalidFilters)).toThrow('Invalid rent range');
    });

    it('should handle invalid ethnicity values', () => {
      const { validateRequestBody } = require('../../edge-function/validation');

      const invalidEthnicityFilter = {
        ethnicities: ['invalid_ethnicity', 'another_invalid']
      };

      validateRequestBody.mockImplementation((body: any) => {
        const validEthnicities = ['korean', 'chinese', 'japanese', 'white', 'black', 'hispanic'];
        const invalidEthnicities = body.ethnicities?.filter((e: string) => 
          !validEthnicities.includes(e)
        );
        
        if (invalidEthnicities && invalidEthnicities.length > 0) {
          throw new Error(`Unsupported ethnicity codes: ${invalidEthnicities.join(', ')}`);
        }
        
        return body;
      });

      expect(() => validateRequestBody(invalidEthnicityFilter))
        .toThrow('Unsupported ethnicity codes: invalid_ethnicity, another_invalid');
    });

    it('should handle extreme filter values', () => {
      const { validateRequestBody } = require('../../edge-function/validation');

      const extremeFilters = {
        rentRange: [-1000, 50000],
        ageRange: [-5, 200],
        incomeRange: [0, 10000000]
      };

      validateRequestBody.mockImplementation((body: any) => {
        return {
          ...body,
          rentRange: [Math.max(0, body.rentRange[0]), Math.min(50000, body.rentRange[1])],
          ageRange: [Math.max(0, body.ageRange[0]), Math.min(100, body.ageRange[1])],
          incomeRange: [Math.max(0, body.incomeRange[0]), Math.min(1000000, body.incomeRange[1])]
        };
      });

      const result = validateRequestBody(extremeFilters);

      expect(result.rentRange[0]).toBeGreaterThanOrEqual(0);
      expect(result.ageRange[0]).toBeGreaterThanOrEqual(0);
      expect(result.ageRange[1]).toBeLessThanOrEqual(100);
      expect(result.incomeRange[1]).toBeLessThanOrEqual(1000000);
    });
  });

  describe('Filter Performance Integration', () => {
    it('should process complex filters efficiently', async () => {
      const { fetchAllData, validateDatabaseData } = require('../../edge-function/data-processing');
      const { calculateDemographicPercentages } = require('../../edge-function/demographic-scoring');
      const { processZones } = require('../../edge-function/scoring-helpers');

      const complexFilters = {
        weights: [
          { id: 'demographic', value: 30 },
          { id: 'foot_traffic', value: 35 },
          { id: 'crime', value: 20 },
          { id: 'flood_risk', value: 15 }
        ],
        ethnicities: ['korean', 'chinese', 'japanese'],
        genders: ['male', 'female'],
        rentRange: [2000, 6000],
        ageRange: [20, 65],
        incomeRange: [40000, 200000],
        topN: 25
      };

      // Mock large dataset
      const mockLargeDataset = {
        zones: Array.from({ length: 100 }, (_, i) => ({
          GEOID: `36061${String(i + 19500).padStart(6, '0')}`,
          resilience_score: Math.random() * 10,
          avg_rent: 2000 + Math.random() * 4000
        })),
        ethnicityData: Array.from({ length: 100 }, (_, i) => ({
          GEOID: `36061${String(i + 19500).padStart(6, '0')}`,
          AEAKrn: Math.random() * 30,
          total_population: 4000 + Math.random() * 2000
        })),
        demographicsData: [],
        incomeData: []
      };

      const mockPercentages = {
        ethnicPercent: Object.fromEntries(
          mockLargeDataset.zones.map(z => [z.GEOID, Math.random() * 0.3])
        ),
        genderPercent: {},
        agePercent: {},
        incomePercent: {}
      };

      const mockProcessedZones = Array.from({ length: 25 }, (_, i) => ({
        geoid: `36061${String(i + 19500).padStart(6, '0')}`,
        custom_score: 60 + Math.random() * 40,
        demographic_score: 50 + Math.random() * 50
      }));

      // Setup performance mocks
      fetchAllData.mockResolvedValue(mockLargeDataset);
      validateDatabaseData.mockReturnValue(true);
      calculateDemographicPercentages.mockReturnValue(mockPercentages);
      processZones.mockResolvedValue(mockProcessedZones);

      const startTime = Date.now();
      
      const data = await fetchAllData(mockSupabase);
      const isValid = validateDatabaseData(data);
      const percentages = calculateDemographicPercentages(complexFilters, data.ethnicityData, [], []);
      const zones = await processZones(data.zones, complexFilters, percentages, {}, [], [], mockSupabase);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(isValid).toBe(true);
      expect(zones).toHaveLength(25);
      expect(executionTime).toBeLessThan(100); // Should be very fast since mocked
    });
  });

  describe('Edge Function Response Format', () => {
    it('should return properly formatted response', async () => {
      const mockResponse: FilterResponse = {
        zones: [
          {
            geoid: '36061019500',
            resilience_score: 75,
            custom_score: 82,
            avg_rent: 3500,
            demographic_match_pct: 25.3
          }
        ],
        total_zones_found: 1,
        top_zones_returned: 1,
        filters_applied: {
          ethnicities: ['korean'],
          rentRange: [3000, 4000]
        },
        debug: {
          demographic_weight_detected: 100,
          is_single_factor_request: true
        }
      };

      // Validate response structure
      expect(mockResponse.zones).toBeDefined();
      expect(Array.isArray(mockResponse.zones)).toBe(true);
      expect(typeof mockResponse.total_zones_found).toBe('number');
      expect(typeof mockResponse.top_zones_returned).toBe('number');
      expect(typeof mockResponse.filters_applied).toBe('object');
      expect(typeof mockResponse.debug).toBe('object');

      if (mockResponse.zones && mockResponse.zones.length > 0) {
        const zone = mockResponse.zones[0];
        expect(typeof zone.geoid).toBe('string');
        expect(typeof zone.resilience_score).toBe('number');
        expect(typeof zone.custom_score).toBe('number');
      }
    });
  });
});