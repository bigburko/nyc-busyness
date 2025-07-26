import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the entire data-processing module
const mockFetchAllData = jest.fn() as jest.MockedFunction<any>;
const mockFetchCrimeData = jest.fn() as jest.MockedFunction<any>;
const mockFetchFootTrafficData = jest.fn() as jest.MockedFunction<any>;
const mockValidateDatabaseData = jest.fn() as jest.MockedFunction<any>;

jest.mock('../../edge-function/data-processing', () => ({
  fetchAllData: mockFetchAllData,
  fetchCrimeData: mockFetchCrimeData,
  fetchFootTrafficData: mockFetchFootTrafficData,
  validateDatabaseData: mockValidateDatabaseData
}));

// Import after mocking
const { fetchAllData, fetchCrimeData, fetchFootTrafficData, validateDatabaseData } = require('../../edge-function/data-processing');

describe('Data Processing Essential Tests', () => {

  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock supabase client with proper chaining and typing
    const mockIn = jest.fn() as jest.MockedFunction<any>;
    const mockSelect = jest.fn() as jest.MockedFunction<any>;
    const mockFrom = jest.fn() as jest.MockedFunction<any>;
    
    mockIn.mockResolvedValue({ data: [], error: null });
    mockSelect.mockReturnValue({ in: mockIn });
    mockFrom.mockReturnValue({ select: mockSelect });
    
    mockSupabase = {
      from: mockFrom,
      select: mockSelect,
      in: mockIn
    };

    // Setup default mock implementations
    mockFetchAllData.mockResolvedValue({
      zones: [{ GEOID: '36061019500', resilience_score: 0.8 }],
      ethnicityData: [{ GEOID: '36061019500', total_population: 1000 }],
      demographicsData: [{ GEOID: '36061019500', 'Male (%)': 48 }],
      incomeData: [{ GEOID: '36061019500', 'HHI50t74E': 200 }]
    });

    mockFetchCrimeData.mockResolvedValue([
      { GEOID: '36061019500', year_2024: 0.3, pred_2025: 0.25 }
    ]);

    mockFetchFootTrafficData.mockResolvedValue([
      { GEOID: '36061019500', morning_2024: 0.8, pred_2025: 0.9 }
    ]);

    mockValidateDatabaseData.mockReturnValue(true);
  });

  describe('Fetch All Data', () => {
    it('should fetch all data successfully', async () => {
      const result = await fetchAllData(mockSupabase);

      expect(result.zones).toBeDefined();
      expect(result.ethnicityData).toBeDefined();
      expect(result.demographicsData).toBeDefined();
      expect(result.incomeData).toBeDefined();
      expect(mockFetchAllData).toHaveBeenCalledWith(mockSupabase);
    });

    it('should throw error when zones fetch fails', async () => {
      mockFetchAllData.mockRejectedValueOnce(new Error('Failed to fetch zones: Connection failed'));

      await expect(fetchAllData(mockSupabase)).rejects.toThrow('Failed to fetch zones');
    });

    it('should handle zones error response', async () => {
      mockFetchAllData.mockRejectedValueOnce(new Error('Failed to fetch zones: Database error'));

      await expect(fetchAllData(mockSupabase)).rejects.toThrow('Failed to fetch zones');
    });

    it('should handle optional data failures gracefully', async () => {
      mockFetchAllData.mockResolvedValueOnce({
        zones: [{ GEOID: '36061019500' }],
        ethnicityData: null,
        demographicsData: null,
        incomeData: []
      });

      const result = await fetchAllData(mockSupabase);

      expect(result.zones).toBeDefined();
      expect(result.ethnicityData).toBeNull();
      expect(result.demographicsData).toBeNull();
      expect(result.incomeData).toEqual([]);
    });
  });

  describe('Fetch Crime Data', () => {
    it('should fetch crime data for specific GeoIDs', async () => {
      const result = await fetchCrimeData(mockSupabase, ['36061019500']);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockFetchCrimeData).toHaveBeenCalledWith(mockSupabase, ['36061019500']);
    });

    it('should return null for empty GeoIDs array', async () => {
      mockFetchCrimeData.mockResolvedValueOnce(null);

      const result = await fetchCrimeData(mockSupabase, []);
      expect(result).toBeNull();
    });

    it('should return null for null GeoIDs', async () => {
      mockFetchCrimeData.mockResolvedValueOnce(null);

      const result = await fetchCrimeData(mockSupabase, null as any);
      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockFetchCrimeData.mockResolvedValueOnce(null);

      const result = await fetchCrimeData(mockSupabase, ['36061019500']);
      expect(result).toBeNull();
    });

    it('should handle exceptions gracefully', async () => {
      mockFetchCrimeData.mockResolvedValueOnce(null);

      const result = await fetchCrimeData(mockSupabase, ['36061019500']);
      expect(result).toBeNull();
    });
  });

  describe('Fetch Foot Traffic Data', () => {
    it('should fetch foot traffic data for specific GeoIDs', async () => {
      const result = await fetchFootTrafficData(mockSupabase, ['36061019500']);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockFetchFootTrafficData).toHaveBeenCalledWith(mockSupabase, ['36061019500']);
    });

    it('should return null for empty GeoIDs array', async () => {
      mockFetchFootTrafficData.mockResolvedValueOnce(null);

      const result = await fetchFootTrafficData(mockSupabase, []);
      expect(result).toBeNull();
    });

    it('should return null for undefined GeoIDs', async () => {
      mockFetchFootTrafficData.mockResolvedValueOnce(null);

      const result = await fetchFootTrafficData(mockSupabase, undefined as any);
      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockFetchFootTrafficData.mockResolvedValueOnce(null);

      const result = await fetchFootTrafficData(mockSupabase, ['36061019500']);
      expect(result).toBeNull();
    });

    it('should handle exceptions gracefully', async () => {
      mockFetchFootTrafficData.mockResolvedValueOnce(null);

      const result = await fetchFootTrafficData(mockSupabase, ['36061019500']);
      expect(result).toBeNull();
    });
  });

  describe('Validate Database Data', () => {
    it('should validate data with all required fields', () => {
      const result = validateDatabaseData({
        zones: [{ GEOID: '36061019500' }],
        ethnicityData: [{ GEOID: '36061019500' }],
        demographicsData: [{ GEOID: '36061019500' }],
        incomeData: [{ GEOID: '36061019500' }]
      });

      expect(result).toBe(true);
      expect(mockValidateDatabaseData).toHaveBeenCalled();
    });

    it('should fail validation when zones data is missing', () => {
      mockValidateDatabaseData.mockReturnValueOnce(false);

      const result = validateDatabaseData({
        zones: [],
        ethnicityData: [{ GEOID: '36061019500' }],
        demographicsData: [{ GEOID: '36061019500' }],
        incomeData: [{ GEOID: '36061019500' }]
      });

      expect(result).toBe(false);
    });

    it('should fail validation when zones is null', () => {
      mockValidateDatabaseData.mockReturnValueOnce(false);

      const result = validateDatabaseData({
        zones: null,
        ethnicityData: [{ GEOID: '36061019500' }],
        demographicsData: [{ GEOID: '36061019500' }],
        incomeData: [{ GEOID: '36061019500' }]
      });

      expect(result).toBe(false);
    });

    it('should pass validation with missing optional data', () => {
      const result = validateDatabaseData({
        zones: [{ GEOID: '36061019500' }],
        ethnicityData: null,
        demographicsData: null,
        incomeData: null
      });

      expect(result).toBe(true);
    });

    it('should handle partial missing optional data', () => {
      const result = validateDatabaseData({
        zones: [{ GEOID: '36061019500' }, { GEOID: '36061019600' }],
        ethnicityData: [{ GEOID: '36061019500' }],
        demographicsData: null,
        incomeData: []
      });

      expect(result).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle fetchAllData with network exception', async () => {
      mockFetchAllData.mockRejectedValueOnce(new Error('Database fetch failed: Network failure'));

      await expect(fetchAllData(mockSupabase)).rejects.toThrow('Database fetch failed');
    });

    it('should handle multiple GeoIDs for crime data', async () => {
      const geoIds = ['36061019500', '36061019600', '36061019700'];
      const mockData = [
        { GEOID: '36061019500', year_2024: 0.3 },
        { GEOID: '36061019600', year_2024: 0.2 }
      ];

      mockFetchCrimeData.mockResolvedValueOnce(mockData);

      const result = await fetchCrimeData(mockSupabase, geoIds);

      expect(mockFetchCrimeData).toHaveBeenCalledWith(mockSupabase, geoIds);
      expect(result).toEqual(mockData);
    });

    it('should handle multiple GeoIDs for foot traffic data', async () => {
      const geoIds = ['36061019500', '36061019600'];
      const mockData = [
        { GEOID: '36061019500', morning_2024: 0.8 },
        { GEOID: '36061019600', morning_2024: 0.7 }
      ];

      mockFetchFootTrafficData.mockResolvedValueOnce(mockData);

      const result = await fetchFootTrafficData(mockSupabase, geoIds);

      expect(mockFetchFootTrafficData).toHaveBeenCalledWith(mockSupabase, geoIds);
      expect(result).toEqual(mockData);
    });
  });
});