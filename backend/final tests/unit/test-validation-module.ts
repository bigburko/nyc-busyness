import { describe, it, expect } from '@jest/globals';

// Basic validation functions
function validateRequestBody(body: any): {
  weights: any[];
  ethnicities: string[];
  genders: string[];
  ageRange: number[];
  incomeRange: number[];
  rentRange: number[];
  topN: number;
  crimeYears: string[];
  timePeriods: string[];
  demographicScoring: any;
} {
  if (!body) {
    body = {};
  }

  const weights: any[] = [];
  if (Array.isArray(body.weights)) {
    for (const w of body.weights) {
      if (w && w.id && typeof w.value === 'number' && !isNaN(w.value) && w.value >= 0 && w.value <= 100) {
        weights.push(w);
      }
    }
  }

  const ethnicities: string[] = [];
  if (Array.isArray(body.ethnicities)) {
    for (const e of body.ethnicities) {
      if (typeof e === 'string' && e.length > 0) {
        ethnicities.push(e);
      }
    }
  }

  const genders: string[] = [];
  if (Array.isArray(body.genders)) {
    for (const g of body.genders) {
      if (g === 'male' || g === 'female') {
        genders.push(g);
      }
    }
  }

  let ageRange: number[] = [0, 100];
  if (Array.isArray(body.ageRange) && body.ageRange.length === 2) {
    let min = body.ageRange[0];
    let max = body.ageRange[1];
    if (typeof min === 'number' && typeof max === 'number') {
      if (min < 0) min = 0;
      if (min > 100) min = 100;
      if (max < 0) max = 0;
      if (max > 100) max = 100;
      ageRange = [min, max];
    }
  }

  let incomeRange: number[] = [0, 250000];
  if (Array.isArray(body.incomeRange) && body.incomeRange.length === 2) {
    let min = body.incomeRange[0];
    let max = body.incomeRange[1];
    if (typeof min === 'number' && typeof max === 'number') {
      if (min < 0) min = 0;
      if (max < 0) max = 0;
      incomeRange = [min, max];
    }
  }

  let rentRange: number[] = [0, Infinity];
  if (Array.isArray(body.rentRange) && body.rentRange.length === 2) {
    let min = body.rentRange[0];
    let max = body.rentRange[1];
    if (typeof min === 'number') {
      if (min < 0) min = 0;
      if (max === Infinity || (typeof max === 'number' && max >= 0)) {
        rentRange = [min, max];
      }
    }
  }

  let topN: number = 10;
  if (typeof body.topN === 'number' && body.topN > 0 && body.topN <= 100) {
    topN = body.topN;
  }

  let timePeriods: string[] = ['morning', 'afternoon', 'evening'];
  if (Array.isArray(body.timePeriods)) {
    const validPeriods: string[] = [];
    for (const p of body.timePeriods) {
      if (p === 'morning' || p === 'afternoon' || p === 'evening') {
        validPeriods.push(p);
      }
    }
    if (validPeriods.length > 0) {
      timePeriods = validPeriods;
    }
  }

  return {
    weights,
    ethnicities,
    genders,
    ageRange,
    incomeRange,
    rentRange,
    topN,
    crimeYears: body.crimeYears || ['year_2024', 'pred_2025'],
    timePeriods,
    demographicScoring: body.demographicScoring || null
  };
}

function validateDemographicScoring(scoring: any): boolean {
  if (!scoring || !scoring.weights) return false;

  const weights = scoring.weights;
  if (typeof weights.ethnicity !== 'number' ||
      typeof weights.gender !== 'number' ||
      typeof weights.age !== 'number' ||
      typeof weights.income !== 'number') return false;

  if (weights.ethnicity < 0 || weights.ethnicity > 1) return false;
  if (weights.gender < 0 || weights.gender > 1) return false;
  if (weights.age < 0 || weights.age > 1) return false;
  if (weights.income < 0 || weights.income > 1) return false;

  return true;
}

function validateWeightStructure(weights: any): {
  valid: boolean;
  errors: string[];
  totalWeight: number;
} {
  const errors: string[] = [];
  let totalWeight = 0;

  if (!Array.isArray(weights)) {
    return {
      valid: false,
      errors: ['Weights must be an array'],
      totalWeight: 0
    };
  }

  const validIds = ['foot_traffic', 'demographic', 'crime', 'flood_risk', 'rent_score', 'poi'];
  const usedIds: string[] = [];

  for (let i = 0; i < weights.length; i++) {
    const weight = weights[i];

    if (!weight || typeof weight !== 'object') {
      errors.push(`Weight at index ${i} must be an object`);
      continue;
    }

    if (typeof weight.id !== 'string') {
      errors.push(`Invalid weight id: ${weight.id}`);
      continue;
    }

    if (!validIds.includes(weight.id)) {
      errors.push(`Invalid weight id: ${weight.id}`);
      continue;
    }

    if (usedIds.includes(weight.id)) {
      errors.push(`Duplicate weight id: ${weight.id}`);
      continue;
    }
    usedIds.push(weight.id);

    if (typeof weight.value !== 'number' || isNaN(weight.value) || weight.value < 0 || weight.value > 100) {
      errors.push(`Weight ${weight.id} value must be between 0 and 100`);
      continue;
    }

    totalWeight += weight.value;
  }

  return {
    valid: errors.length === 0,
    errors,
    totalWeight
  };
}

function sanitizeStringArray(arr: any, maxLength: number = 50): string[] {
  if (!Array.isArray(arr)) return [];

  const result: string[] = [];
  let count = 0;

  for (const item of arr) {
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed.length > 0 && trimmed.length <= maxLength) {
        result.push(trimmed);
        count++;
        if (count >= 20) break;
      }
    }
  }

  return result;
}

function validateNumericRange(range: any, min: number, max: number): number[] | null {
  if (!Array.isArray(range) || range.length !== 2) return null;

  const start = range[0];
  const end = range[1];

  if (typeof start !== 'number' || typeof end !== 'number' || isNaN(start) || isNaN(end)) {
    return null;
  }

  if (start > end || start < min || end > max) {
    return null;
  }

  return [start, end];
}

// Jest Test Suite
describe('Validation Module Tests', () => {
  describe('Request Body Validation', () => {
    it('should validate complete valid request', () => {
      const validRequest = {
        weights: [
          { id: 'foot_traffic', value: 40 },
          { id: 'demographic', value: 30 },
          { id: 'crime', value: 20 }
        ],
        ethnicities: ['korean', 'chinese'],
        genders: ['male', 'female'],
        ageRange: [25, 65],
        incomeRange: [50000, 150000],
        topN: 15
      };

      const result = validateRequestBody(validRequest);

      expect(result.weights.length).toBe(3);
      expect(result.ethnicities).toEqual(['korean', 'chinese']);
      expect(result.genders).toEqual(['male', 'female']);
      expect(result.ageRange).toEqual([25, 65]);
      expect(result.topN).toBe(15);
    });

    it('should apply defaults for missing fields', () => {
      const result = validateRequestBody({});
      expect(result.weights).toEqual([]);
      expect(result.ethnicities).toEqual([]);
      expect(result.genders).toEqual([]);
      expect(result.ageRange).toEqual([0, 100]);
      expect(result.incomeRange).toEqual([0, 250000]);
      expect(result.rentRange).toEqual([0, Infinity]);
      expect(result.topN).toBe(10);
      expect(result.timePeriods).toEqual(['morning', 'afternoon', 'evening']);
    });

    it('should filter invalid weights', () => {
      const request = {
        weights: [
          { id: 'foot_traffic', value: 40 },
          { id: 'invalid_type' },
          { value: 30 },
          { id: 'crime', value: -10 },
          { id: 'demographic', value: 25 }
        ]
      };
      const result = validateRequestBody(request);
      expect(result.weights.length).toBe(2);
      expect(result.weights[0].id).toBe('foot_traffic');
      expect(result.weights[1].id).toBe('demographic');
    });

    it('should clamp age ranges to valid bounds', () => {
      const result = validateRequestBody({ ageRange: [-10, 150] });
      expect(result.ageRange).toEqual([0, 100]);
    });

    it('should filter invalid genders and time periods', () => {
      const result = validateRequestBody({
        genders: ['male', 'female', 'other'],
        timePeriods: ['morning', 'evening', 'night']
      });
      expect(result.genders).toEqual(['male', 'female']);
      expect(result.timePeriods).toEqual(['morning', 'evening']);
    });
  });

  describe('Demographic Scoring Validation', () => {
    it('should validate correct demographic scoring structure', () => {
      expect(validateDemographicScoring({
        weights: { ethnicity: 0.4, gender: 0.3, age: 0.2, income: 0.1 }
      })).toBe(true);
    });

    it('should reject missing weights object', () => {
      expect(validateDemographicScoring({})).toBe(false);
    });

    it('should reject invalid weight values', () => {
      expect(validateDemographicScoring({
        weights: { ethnicity: 1.5, gender: -0.1, age: 'a', income: 0.5 }
      })).toBe(false);
    });

    it('should reject missing required weight keys', () => {
      expect(validateDemographicScoring({
        weights: { ethnicity: 0.5, gender: 0.3 }
      })).toBe(false);
    });

    it('should handle null/undefined input', () => {
      expect(validateDemographicScoring(null)).toBe(false);
      expect(validateDemographicScoring(undefined)).toBe(false);
    });
  });

  describe('Weight Structure Validation', () => {
    it('should validate correct weight structure', () => {
      const result = validateWeightStructure([
        { id: 'foot_traffic', value: 40 },
        { id: 'demographic', value: 30 },
        { id: 'crime', value: 20 }
      ]);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.totalWeight).toBe(90);
    });

    it('should detect duplicate weight IDs', () => {
      const result = validateWeightStructure([
        { id: 'foot_traffic', value: 40 },
        { id: 'foot_traffic', value: 30 }
      ]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duplicate weight id: foot_traffic');
    });

    it('should reject invalid weight IDs and values', () => {
      const result = validateWeightStructure([
        { id: 'invalid_weight', value: 40 },
        { id: 'foot_traffic', value: -10 },
        { id: 'demographic', value: 150 }
      ]);
      expect(result.valid).toBe(false);
    });

    it('should handle non-array input', () => {
      const result = validateWeightStructure('not_an_array');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Weights must be an array');
    });
  });

  describe('String Array Sanitization', () => {
    it('should sanitize valid string arrays', () => {
      expect(sanitizeStringArray(['korean', 'chinese'])).toEqual(['korean', 'chinese']);
    });

    it('should filter non-string values and trim whitespace', () => {
      expect(sanitizeStringArray(['  korean ', 123, null, 'chinese'])).toEqual(['korean', 'chinese']);
    });

    it('should remove empty strings and enforce length limits', () => {
      const longStr = 'x'.repeat(100);
      expect(sanitizeStringArray(['', '   ', longStr, 'short'], 10)).toEqual(['short']);
    });

    it('should handle non-array input', () => {
      expect(sanitizeStringArray(null)).toEqual([]);
      expect(sanitizeStringArray('string')).toEqual([]);
    });
  });

  describe('Numeric Range Validation', () => {
    it('should validate correct numeric ranges', () => {
      expect(validateNumericRange([25, 65], 0, 100)).toEqual([25, 65]);
    });

    it('should reject invalid range formats', () => {
      expect(validateNumericRange([25], 0, 100)).toBeNull();
      expect(validateNumericRange('string', 0, 100)).toBeNull();
    });

    it('should reject invalid values or order', () => {
      expect(validateNumericRange([65, 25], 0, 100)).toBeNull();
      expect(validateNumericRange([NaN, 30], 0, 100)).toBeNull();
      expect(validateNumericRange([0, 150], 0, 100)).toBeNull();
    });

    it('should allow edge bounds', () => {
      expect(validateNumericRange([0, 0], 0, 100)).toEqual([0, 0]);
      expect(validateNumericRange([100, 100], 0, 100)).toEqual([100, 100]);
    });
  });
});
