export type ResilienceScore = {
  geoid: string;
  composite_score: number;
  custom_score: number;
  demographic_score?: number;
  demographic_match_pct?: number;
  gender_match_pct?: number;
  age_match_pct?: number;
  income_match_pct?: number;
  combined_match_pct?: number;
  [key: string]: number | string | undefined;
};

interface FetchParams {
  weights?: any[];
  rentRange?: [number, number];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  ageRange?: [number, number];
  incomeRange?: [number, number];
}

export async function fetchResilienceScores({
  weights = [],
  rentRange = [0, Infinity],
  selectedEthnicities = [],
  selectedGenders = [],
  ageRange = [0, 100],
  incomeRange = [0, 250000],
}: FetchParams) {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error('❌ Missing Supabase anon key');

  const res = await fetch(
    'https://kwuwuutcvpdomfivdemt.supabase.co/functions/v1/calculate-resilience',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        weights,
        rentRange,
        ethnicities: selectedEthnicities,
        genders: selectedGenders,
        ageRange,
        incomeRange,
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ Server error', res.status, errorText);
    throw new Error('Failed to fetch resilience scores');
  }

  const result = await res.json();
  return result.zones as ResilienceScore[];
}
