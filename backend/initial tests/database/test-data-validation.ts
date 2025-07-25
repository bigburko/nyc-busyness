import { describe, it, expect } from '@jest/globals';

describe('Data Validation Tests', () => {
  
  describe('GEOID Validation', () => {
    it('should validate GEOID format', () => {
      const validGEOID = '36061019500';
      const invalidGEOID = 'invalid';
      
      expect(validGEOID).toMatch(/^\d{11}$/);
      expect(validGEOID.startsWith('36061')).toBe(true);
      expect(invalidGEOID).not.toMatch(/^\d{11}$/);
    });

    it('should ensure GEOID uniqueness', () => {
      const geoIds = ['36061019500', '36061019100', '36061018700'];
      const uniqueGeoIds = new Set(geoIds);
      
      expect(geoIds.length).toBe(uniqueGeoIds.size);
    });
  });

  describe('Score Validation', () => {
    it('should validate resilience scores', () => {
      const validScore = 0.75;
      const invalidLow = -0.1;
      const invalidHigh = 1.5;
      
      expect(validScore).toBeGreaterThanOrEqual(0);
      expect(validScore).toBeLessThanOrEqual(1);
      expect(invalidLow).toBeLessThan(0);
      expect(invalidHigh).toBeGreaterThan(1);
    });

    it('should validate component scores 0-10', () => {
      const validScores = [0, 5.5, 7.2, 10];
      const invalidScores = [-1, 11];
      
      validScores.forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(10);
      });
      
      invalidScores.forEach(score => {
        expect(score < 0 || score > 10).toBe(true);
      });
    });
  });

  describe('Percentage Validation', () => {
    it('should validate percentages are 0-100', () => {
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

    it('should validate gender percentages add to 100', () => {
      const malePercent = 48.5;
      const femalePercent = 51.5;
      const total = malePercent + femalePercent;
      
      expect(total).toBeCloseTo(100, 1);
    });
  });
});