export type ResilienceScore = {
  geoid: string;
  composite_score: number;
  custom_score: number;
  [key: string]: number | string;
};

export async function fetchResilienceScores(weights = {}) {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error('❌ Missing Supabase anon key');

  const res = await fetch(
    'https://kwuwuutcvpdomfivdemt.supabase.co/functions/v1/calculate-resilience',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`, // ✅ CRITICAL HEADER
      },
      body: JSON.stringify({ weights }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ Server error', res.status, errorText);
    throw new Error('Failed to fetch resilience scores');
  }

  return res.json() as Promise<ResilienceScore[]>;
}
