// src/app/api/gemini/route.ts
import { NextRequest, NextResponse } from 'next/server';

// ✅ Type definitions for better type safety
interface RequestBody {
  message: string;
  systemPrompt?: string;
  currentState?: {
    weights?: Array<{ id: string; value: number; label: string; icon: string; color: string }>;
    rentRange?: [number, number];
    selectedEthnicities?: string[];
    selectedGenders?: string[];
    ageRange?: [number, number];
    incomeRange?: [number, number];
    [key: string]: unknown;
  };
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  [key: string]: unknown;
}

// ✅ FIXED: Proper typing for weight objects
interface WeightObject {
  id: string;
  value: number;
  label: string;
  icon: string;
  color: string;
}

// ✅ FIXED: Proper typing for normalization function
function normalizeWeights(weights: WeightObject[]): WeightObject[] {
  if (!weights || !Array.isArray(weights)) return weights;
  
  const totalWeight = weights.reduce((sum, w) => sum + (w.value || 0), 0);
  
  console.log('🔧 [Gemini API] Original weights total:', totalWeight);
  
  if (totalWeight !== 100 && totalWeight > 0) {
    console.log('⚠️ [Gemini API] Normalizing weights to sum to 100%');
    
    // Normalize each weight proportionally
    const normalizedWeights = weights.map((weight) => ({
      ...weight,
      value: Math.round((weight.value / totalWeight) * 100)
    }));
    
    // Final adjustment to ensure exact 100%
    const finalTotal = normalizedWeights.reduce((sum, w) => sum + w.value, 0);
    const adjustment = 100 - finalTotal;
    
    if (adjustment !== 0 && normalizedWeights.length > 0) {
      normalizedWeights[0].value += adjustment;
    }
    
    console.log('✅ [Gemini API] Normalized weights:', normalizedWeights.map(w => `${w.id}: ${w.value}%`));
    return normalizedWeights;
  }
  
  return weights;
}

export async function POST(req: NextRequest) {
  const { message, systemPrompt, currentState }: RequestBody = await req.json();
  
  console.log('✅ Gemini API route hit with message:', message);
  console.log('🧠 Current State Received:', currentState);
  
  const improvedPrompt = `
You are Bricky, a stateful AI assistant for an NYC neighborhood filtering app. Your ONLY task is to return a valid JSON object. **Do not add any markdown, comments, or text outside of the JSON object itself.**

Your response should be a FLAT JSON object. It can also include a "message" key for user feedback and an "intent" key for special commands. Example response:
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

--- WEIGHT CONSTRAINTS ---
When adjusting weights, try to make them sum close to 100%, but don't worry about exact precision - the system will normalize them automatically.

--- CURRENT FILTER STATE (Your starting point) ---
${JSON.stringify(currentState, null, 2)}
`;

  try {
    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt || improvedPrompt },
      { role: 'user', content: message },
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Gemini error response:', errText);
      return NextResponse.json({ reply: null, error: errText }, { status: 500 });
    }

    const data: OpenRouterResponse = await response.json();
    let reply = data.choices?.[0]?.message?.content ?? null;
    
    // ✅ NORMALIZE WEIGHTS BEFORE RETURNING
    if (reply) {
      try {
        const parsedReply = JSON.parse(reply);
        
        // If the response contains weights, normalize them
        if (parsedReply.weights && Array.isArray(parsedReply.weights)) {
          parsedReply.weights = normalizeWeights(parsedReply.weights as WeightObject[]);
        }
        
        // Convert back to JSON string
        reply = JSON.stringify(parsedReply);
        
      } catch (parseError) {
        console.error('❌ Failed to parse/normalize Gemini response:', parseError);
        // Return original reply if parsing fails
      }
    }
    
    return NextResponse.json({ reply });

  } catch (error: unknown) {
    console.error('❌ Gemini fetch failed:', error);
    
    let errorMessage = 'Gemini fetch failed';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return NextResponse.json({ reply: null, error: errorMessage }, { status: 500 });
  }
}