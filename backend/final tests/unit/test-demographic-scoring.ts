import { describe, it, expect } from '@jest/globals';
import {
  calculateDemographicPercentages,
  findMaxPercentages,
  calculateEnhancedDemographicScore,
  evaluateCondition
} from '../../edge-function/demographic-scoring';

describe('Demographic Scoring Module Tests', () => {

  describe('Demographic Percentages Calculation', () => {
    const mockInput = {
      ethnicities: ['korean', 'chinese'],
      genders: ['male'],
      ageRange: [25, 35] as [number, number],
      incomeRange: [50000, 100000] as [number, number]
    };

    const mockEthnicityData = [
      {
        GEOID: '36061019500',
        total_population: 1000,
        AEAKrn: 200,        // Korean 20%
        AEAChnsNoT: 150     // Chinese 15%
      }
    ];

    const mockDemographicsData = [
      {
        GEOID: '36061019500',
        'Total population': 1000,
        'Male (%)': 45,
        'Female (%)': 55,
        '25 to 29 years (%)': 15,
        '30 to 34 years (%)': 10
      }
    ];

    const mockIncomeData = [
      {
        GEOID: '36061019500',
        'HHI50t74E': 200,    // $50k-$75k
        'HHI75t99E': 150,    // $75k-$100k
        'HHIU10E': 100       // Under $10k
      }
    ];

    it('should calculate ethnicity percentages correctly', () => {
      const result = calculateDemographicPercentages(
        mockInput,
        mockEthnicityData,
        mockDemographicsData,
        mockIncomeData
      );

      expect(result.ethnicPercent).toBeDefined();
      expect(result.ethnicPercent['36061019500']).toBeGreaterThan(0);
      expect(result.ethnicPercent['36061019500']).toBeLessThanOrEqual(1);
    });

    it('should calculate gender percentages correctly', () => {
      const result = calculateDemographicPercentages(
        mockInput,
        mockEthnicityData,
        mockDemographicsData,
        mockIncomeData
      );

      expect(result.genderPercent).toBeDefined();
      expect(result.genderPercent['36061019500']).toBe(0.45); // 45% male
    });

    it('should calculate age percentages correctly', () => {
      const result = calculateDemographicPercentages(
        mockInput,
        mockEthnicityData,
        mockDemographicsData,
        mockIncomeData
      );

      expect(result.agePercent).toBeDefined();
      expect(result.agePercent['36061019500']).toBe(0.25); // 25% in age range (15% + 10%)
    });

    it('should calculate income percentages correctly', () => {
      const result = calculateDemographicPercentages(
        mockInput,
        mockEthnicityData,
        mockDemographicsData,
        mockIncomeData
      );

      expect(result.incomePercent).toBeDefined();
      expect(result.incomePercent['36061019500']).toBeGreaterThan(0);
    });

    it('should handle empty data arrays', () => {
      const emptyInput = {
        ethnicities: [] as string[],
        genders: [] as string[],
        ageRange: undefined,
        incomeRange: undefined
      };

      const result = calculateDemographicPercentages(
        emptyInput,
        [],
        [],
        []
      );

      expect(result.ethnicPercent).toEqual({});
      expect(result.genderPercent).toEqual({});
      expect(result.agePercent).toEqual({});
      expect(result.incomePercent).toEqual({});
    });

    it('should prevent ethnicity overcounting', () => {
      const broadEthnicityInput = {
        ethnicities: ['asian'],
        genders: [] as string[],
        ageRange: undefined,
        incomeRange: undefined
      };

      const overlapData = [
        {
          GEOID: '36061019500',
          total_population: 1000,
          AEA: 300,        // East Asian total
          ASA: 200,        // South Asian total  
          AEAKrn: 100      // Korean (subset of East Asian)
        }
      ];

      const result = calculateDemographicPercentages(
        broadEthnicityInput,
        overlapData,
        [],
        []
      );

      // Should not exceed 100% due to deduplication
      expect(result.ethnicPercent['36061019500']).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Max Percentages Calculation', () => {
    it('should find maximum percentages across all tracts', () => {
      const ethnicPercent = {
        'tract1': 0.3,
        'tract2': 0.7,
        'tract3': 0.5
      };

      const genderPercent = {
        'tract1': 0.4,
        'tract2': 0.6,
        'tract3': 0.8
      };

      const agePercent = {
        'tract1': 0.2,
        'tract2': 0.9,
        'tract3': 0.1
      };

      const incomePercent = {
        'tract1': 0.6,
        'tract2': 0.3,
        'tract3': 0.4
      };

      const result = findMaxPercentages(
        ethnicPercent,
        genderPercent,
        agePercent,
        incomePercent
      );

      expect(result.maxEthnicPct).toBe(1); // Default minimum is 1
      expect(result.maxGenderPct).toBe(1); // Default minimum is 1
      expect(result.maxAgePct).toBe(1);    // Default minimum is 1
      expect(result.maxIncomePct).toBe(1); // Default minimum is 1
    });

    it('should handle empty percentage objects', () => {
      const result = findMaxPercentages({}, {}, {}, {});

      expect(result.maxEthnicPct).toBe(1);
      expect(result.maxGenderPct).toBe(1);
      expect(result.maxAgePct).toBe(1);
      expect(result.maxIncomePct).toBe(1);
    });
  });

  describe('Enhanced Demographic Scoring', () => {
    const mockInput = {
      ethnicities: ['korean'],
      genders: ['male'],
      ageRange: [25, 35] as [number, number],
      incomeRange: [50000, 100000] as [number, number]
    };

    const mockPercentages = {
      ethnicPercent: { '36061019500': 0.3 },
      genderPercent: { '36061019500': 0.45 },
      agePercent: { '36061019500': 0.25 },
      incomePercent: { '36061019500': 0.6 }
    };

    const mockMaxPercentages = {
      maxEthnicPct: 1,
      maxGenderPct: 1,
      maxAgePct: 1,
      maxIncomePct: 1
    };

    it('should calculate enhanced demographic score', () => {
      const result = calculateEnhancedDemographicScore(
        '36061019500',
        mockInput,
        mockPercentages,
        mockMaxPercentages
      );

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should return zero for tract with no demographic data', () => {
      const emptyPercentages = {
        ethnicPercent: {},
        genderPercent: {},
        agePercent: {},
        incomePercent: {}
      };

      const result = calculateEnhancedDemographicScore(
        '36061999999',
        mockInput,
        emptyPercentages,
        mockMaxPercentages
      );

      expect(result).toBe(0);
    });

    it('should handle advanced demographic scoring with weights', () => {
      const advancedInput = {
        ...mockInput,
        demographicScoring: {
          weights: {
            ethnicity: 0.4,
            gender: 0.3,
            age: 0.2,
            income: 0.1
          }
        }
      };

      const result = calculateEnhancedDemographicScore(
        '36061019500',
        advancedInput,
        mockPercentages,
        mockMaxPercentages
      );

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('Condition Evaluation', () => {
    const mockTractData = {
      population: 1000,
      income: 75000,
      age_median: 35,
      crime_rate: 2.5
    };

    it('should evaluate greater than conditions correctly', () => {
      expect(evaluateCondition('population > 500', mockTractData)).toBe(true);
      expect(evaluateCondition('population > 1500', mockTractData)).toBe(false);
    });

    it('should evaluate less than conditions correctly', () => {
      expect(evaluateCondition('crime_rate < 3.0', mockTractData)).toBe(true);
      expect(evaluateCondition('crime_rate < 2.0', mockTractData)).toBe(false);
    });

    it('should evaluate equals conditions correctly', () => {
      expect(evaluateCondition('age_median == 35', mockTractData)).toBe(true);
      expect(evaluateCondition('age_median == 30', mockTractData)).toBe(false);
    });

    it('should evaluate greater than or equal conditions correctly', () => {
      expect(evaluateCondition('income >= 75000', mockTractData)).toBe(true);
      expect(evaluateCondition('income >= 80000', mockTractData)).toBe(false);
    });

    it('should handle invalid condition formats', () => {
      expect(evaluateCondition('invalid condition', mockTractData)).toBe(false);
      expect(evaluateCondition('population', mockTractData)).toBe(false);
      expect(evaluateCondition('', mockTractData)).toBe(false);
    });

    it('should handle missing tract data', () => {
      expect(evaluateCondition('missing_field > 100', mockTractData)).toBe(false);
      expect(evaluateCondition('population > invalid', mockTractData)).toBe(false);
    });
  });
});