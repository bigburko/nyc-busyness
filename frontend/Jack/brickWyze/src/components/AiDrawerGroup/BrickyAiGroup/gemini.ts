// /pages/api/gemini.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  // TEMP MOCK: Replace with actual Gemini integration
  return NextResponse.json({
    reply: {
      setFilters: {
        ageRange: [30, 50],
        selectedGenders: ['female'],
        weights: [
          { id: 'crime', value: 40 },
          { id: 'foot_traffic', value: 30 },
          { id: 'rent_score', value: 30 }
        ]
      }
    }
  });
}
