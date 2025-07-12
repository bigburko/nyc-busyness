import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { message, systemPrompt } = await req.json();

  console.log('✅ Gemini API route hit with message:', message);

  const improvedPrompt = `
You are Bricky, an AI assistant helping entrepreneurs filter NYC neighborhoods.

RESPOND ONLY WITH VALID JSON IN A CODE BLOCK:

\`\`\`json
{
  "filters": {
    "selectedEthnicities": ["ethnicity_names"],
    "weights": [{ "id": "weight_id", "weight": value_0_to_100 }],
    "ageRange": [min, max],
    "rentRange": [min, max], 
    "incomeRange": [min, max],
    "selectedGenders": ["male", "female"]
  },
  "message": "Brief explanation"
}
\`\`\`

ETHNICITY RULES:
- ALWAYS provide specific ethnicity terms when user gives clear intent
- Use: "South Asian", "East Asian", "Southeast Asian", "Black", "White", "Hispanic", "Middle Eastern"
- For countries: "Chinese", "Korean", "Japanese", "Filipino", "Vietnamese", "Thai", "Indian", "Pakistani", "Mexican"
- If user says just "Asian", respond with empty array and ask for specificity in message
- If user says "European", use "White"

GENDER RULES:
- NEVER return empty selectedGenders array
- Default to ["male", "female"] unless user specifically requests one gender
- If user asks for "women" use ["female"], if "men" use ["male"]
- Otherwise always include both genders

IMPORTANT: 
- Only return empty selectedEthnicities array when truly asking for clarification
- Each query REPLACES previous ethnicity selection
- Don't include weight/range data unless user specifically mentions them
- Always preserve gender selection unless explicitly requested to change

WEIGHT IDs: "foot_traffic", "crime", "demographic", "rent_score", "flood_risk", "poi"
RANGES: rentRange [26, 160], ageRange [18, 85], incomeRange [0, 250000]

Do NOT include explanations outside JSON block.
`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt || improvedPrompt },
          { role: 'user', content: message },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Gemini error response:', errText);
      return NextResponse.json({ reply: null, error: errText }, { status: 500 });
    }

    const data = await response.json();
    console.log('🧠 Gemini raw data:', data);

    const reply = data.choices?.[0]?.message?.content ?? null;
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('❌ Gemini fetch failed:', error);
    return NextResponse.json({ reply: null, error: 'Gemini fetch failed' }, { status: 500 });
  }
}