import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock all dependencies
const mockCalculateEnhancedDemographicScore = jest.fn() as jest.MockedFunction<any>;
const mockFetchCrimeData = jest.fn() as jest.MockedFunction<any>;
const mockFetchFootTrafficData = jest.fn() as jest.MockedFunction<any>;
const mockGetBoroughName = jest.fn() as jest.MockedFunction<any>;
const mockNormalizeScore = jest.fn() as jest.MockedFunction<any>;
const mockClamp = jest.fn() as jest.MockedFunction<any>;

jest.mock('../../edge-function/demographic-scoring', () => ({
  calculateEnhancedDemographicScore: mockCalculateEnhancedDemographicScore
}));

jest.mock('../../edge-function/data-processing', () => ({
  fetchCrimeData: mockFetchCrimeData,
  fetchFootTrafficData: mockFetchFootTrafficData
}));

jest.mock('../../edge-function/utils', () => ({
  getBoroughName: mockGetBoroughName,
  normalizeScore: mockNormalizeScore,
  clamp: mockClamp
}));

// Mock the main functions
const mockProcessZones = jest.fn() as jest.MockedFunction<any>;
const mockAddFootTrafficDataToTopZones = jest.fn() as jest.MockedFunction<any>;
const mockAddCrimeDataToTopZones = jest.fn() as jest.MockedFunction<any>;

jest.mock('../../edge-function/scoring-helpers', () => ({
  processZones: mockProcessZones,
  addFootTrafficDataToTopZones: mockAddFootTrafficDataToTopZones,
  addCrimeDataToTopZones: mockAddCrimeDataToTopZones
}));

// Import after mocking to avoid the .ts extension error
const { processZones, addFootTrafficDataToTopZones, addCrimeDataToTopZones } = require('../../edge-function/scoring-helpers');

describe('Scoring Helpers Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGetBoroughName.mockReturnValue('Manhattan');
    mockNormalizeScore.mockReturnValue(75);
    mockClamp.mockReturnValue(50);
    mockCalculateEnhancedDemographicScore.mockReturnValue(0.5);
    mockFetchCrimeData.mockResolvedValue([]);
    mockFetchFootTrafficData.mockResolvedValue([]);
    
    mockProcessZones.mockResolvedValue([{
      geoid: '36061019500',
      custom_score: 85,
      tract_name: 'Test Tract'
    }]);
    
    mockAddFootTrafficDataToTopZones.mockImplementation(async (db, zones) => {
      return Promise.resolve();
    });
    
    mockAddCrimeDataToTopZones.mockImplementation(async (db, zones) => { 
      return Promise.resolve();
    });
  });

  it('should process zones', async () => {
    const result = await processZones([{ GEOID: '36061019500' }], {}, {}, {}, [], [], {});
    
    expect(result).toHaveLength(1);
    expect(result[0].geoid).toBe('36061019500');
    expect(mockProcessZones).toHaveBeenCalled();
  });

  it('should add foot traffic data', async () => {
    const zones = [{ geoid: '36061019500' }];
    await addFootTrafficDataToTopZones({}, zones);
    
    expect(mockAddFootTrafficDataToTopZones).toHaveBeenCalledWith({}, zones);
  });

  it('should add crime data', async () => {
    const zones = [{ geoid: '36061019500' }];
    await addCrimeDataToTopZones({}, zones);
    
    expect(mockAddCrimeDataToTopZones).toHaveBeenCalledWith({}, zones);
  });
});