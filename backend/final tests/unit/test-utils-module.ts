import {
 VALID_GENDERS,
 VALID_TIME_PERIODS,
 DEFAULT_TIME_PERIODS,
 DEFAULT_CRIME_YEARS,
 jsonResponse,
 getSampleEntries,
 getBoroughName,
 normalizeScore,
 clamp,
 roundTo
} from '../../edge-function/utils';

describe('Constants', () => {
 test('VALID_GENDERS should contain male and female', () => {
   expect(VALID_GENDERS).toEqual(['male', 'female']);
 });

 test('VALID_TIME_PERIODS and DEFAULT_TIME_PERIODS should match expected values', () => {
   const expected = ['morning', 'afternoon', 'evening'];
   expect(VALID_TIME_PERIODS).toEqual(expected);
   expect(DEFAULT_TIME_PERIODS).toEqual(expected);
 });

 test('DEFAULT_CRIME_YEARS should contain correct years', () => {
   expect(DEFAULT_CRIME_YEARS).toEqual([
     'year_2020',
     'year_2021',
     'year_2022',
     'year_2023',
     'year_2024',
     'pred_2025',
     'pred_2026',
     'pred_2027'
   ]);
 });
});

describe('jsonResponse', () => {
 test('returns correct JSON response with status', async () => {
   const data = { message: 'hello' };
   const response = jsonResponse(data, 201);
   expect(response.status).toBe(201);
   expect(response.headers.get('Content-Type')).toBe('application/json');
   const text = await response.text();
   expect(JSON.parse(text)).toEqual(data);
 });

 test('returns 200 by default', () => {
   const response = jsonResponse({ ok: true });
   expect(response.status).toBe(200);
 });
});

describe('getSampleEntries', () => {
 test('returns first N entries from an object', () => {
   const input = { a: 1, b: 2, c: 3, d: 4 };
   const result = getSampleEntries(input, 2);
   expect(Object.keys(result)).toEqual(['a', 'b']);
 });

 test('handles empty or invalid input', () => {
   expect(getSampleEntries(null as any)).toEqual({});
   expect(getSampleEntries([] as any)).toEqual({});
   expect(getSampleEntries('test' as any)).toEqual({});
 });
});

describe('getBoroughName', () => {
 test('returns correct boroughs based on geoId', () => {
   expect(getBoroughName('3606100000000')).toBe('Manhattan');
   expect(getBoroughName('3600500000000')).toBe('Bronx');
   expect(getBoroughName('3604700000000')).toBe('Brooklyn');
   expect(getBoroughName('3608100000000')).toBe('Queens');
   expect(getBoroughName('3608500000000')).toBe('Staten Island');
 });

 test('returns Unknown for invalid or unknown geoIds', () => {
   expect(getBoroughName('')).toBe('Unknown');
   expect(getBoroughName('999999')).toBe('Unknown');
   expect(getBoroughName(null as any)).toBe('Unknown');
 });
});

describe('normalizeScore', () => {
 test('normalizes within 0-100 range', () => {
   expect(normalizeScore(-10)).toBe(0);
   expect(normalizeScore(50)).toBe(50);
   expect(normalizeScore(120)).toBe(100);
 });

 test('handles null, undefined, NaN gracefully', () => {
   expect(normalizeScore(null as any)).toBe(0);
   expect(normalizeScore(undefined as any)).toBe(0);
   expect(normalizeScore('bad' as any)).toBe(0);
 });
});

describe('clamp', () => {
 test('returns value within min/max bounds', () => {
   expect(clamp(5, 0, 10)).toBe(5);
   expect(clamp(-1, 0, 10)).toBe(0);
   expect(clamp(100, 0, 10)).toBe(10);
 });
});

describe('roundTo', () => {
 test('correctly rounds to given decimal places', () => {
   expect(roundTo(3.14159, 2)).toBe(3.14);
   expect(roundTo(3.14159, 0)).toBe(3);
   expect(roundTo(3.9999, 2)).toBe(4);
 });

 test('handles invalid inputs', () => {
   expect(roundTo(null as any, 2)).toBe(0);
   expect(roundTo(undefined as any, 2)).toBe(0);
   expect(roundTo('bad' as any, 2)).toBe(0);
 });
});