// src/app/api/gemini/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { message, systemPrompt, currentState } = await req.json();

  console.log('✅ Gemini API route hit with message:', message);
  console.log('🧠 Current State Received:', currentState);

  const improvedPrompt = `
You are Bricky, a stateful AI assistant for an NYC neighborhood filtering app. Your ONLY task is to return a valid JSON object. **Do not add any markdown, comments, or text outside of the JSON object itself.**

Your response should be a FLAT JSON object. It can also include a "message" key for user feedback and an "intent" key for special commands.
Example response:
{
  "weights": [...],
  "selectedEthnicities": [...],
  "message": "Okay, I've updated the filters for you."
}

--- 🎯 SPECIAL COMMAND: RESET ---
If the user's request is to "reset", "start over", or "return to defaults", your ONLY response MUST be this exact JSON object:
{
  "intent": "reset",
  "message": "Okay, I've reset all filters to their defaults for you."
}
Do NOT attempt to manually create the default state. Just send the reset intent.

--- CORE BEHAVIOR (For all other requests) ---
- **You are STATEFUL.** The user's current filter settings are provided below.
- **Your goal is to MODIFY the current state based on the user's new request.** Do NOT reset filters unless the "RESET" rule above applies.
- When you are only asking a clarifying question, you MUST return the 'currentState' object completely unchanged, but add your question in the "message" field.

--- CURRENT FILTER STATE (Your starting point) ---
${JSON.stringify(currentState, null, 2)}
`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-flash-1.5',
        messages: [
          { role: 'system', content: systemPrompt || improvedPrompt },
          { role: 'user', content: message },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error('❌ Gemini error response:', errText);
        return NextResponse.json({ reply: null, error: errText }, { status: 500 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? null;
    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error('❌ Gemini fetch failed:', error);
    return NextResponse.json({ reply: null, error: error.message || 'Gemini fetch failed' }, { status: 500 });
  }
}