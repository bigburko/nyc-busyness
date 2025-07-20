// src/app/api/gemini/route.ts - FINAL FIX: Ultra-strong single-factor detection
import { NextRequest, NextResponse } from 'next/server';

// ✅ Enhanced type definitions for demographic sub-weighting
interface DemographicWeights {
  ethnicity: number;
  gender: number;
  age: number;
  income: number;
}

interface ThresholdBonus {
  condition: string;
  bonus: number;
  description: string;
}

interface DemographicPenalty {
  condition: string;
  penalty: number;
  description: string;
}

interface DemographicScoring {
  weights: DemographicWeights;
  thresholdBonuses: ThresholdBonus[];
  penalties: DemographicPenalty[];
  reasoning?: string;
}

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
    // NEW: Demographic sub-weighting
    demographicScoring?: DemographicScoring;
    lastDemographicReasoning?: string;
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

// 🔧 NEW: Check if this is a single-factor 100% request
function isSingleFactor100Request(weights: WeightObject[]): boolean {
  const hundredWeights = weights.filter(w => w.value === 100);
  const zeroWeights = weights.filter(w => w.value === 0);
  
  // If we have exactly 1 weight at 100% and the rest at 0%, this is single-factor
  return hundredWeights.length === 1 && (hundredWeights.length + zeroWeights.length) === weights.length;
}

// ✅ Enhanced normalization logic with single-factor skip
function normalizeWeights(weights: WeightObject[]): WeightObject[] {
  if (!weights || !Array.isArray(weights)) return weights;
  
  // 🔧 CRITICAL FIX: Skip normalization for single-factor 100% requests
  if (isSingleFactor100Request(weights)) {
    console.log('✅ [Gemini API] Single-factor 100% detected, skipping normalization');
    return weights;
  }
  
  const totalWeight = weights.reduce((sum, w) => sum + (w.value || 0), 0);
  
  console.log('🔧 [Gemini API] Original frontend weights total:', totalWeight);
  
  if (totalWeight !== 100 && totalWeight > 0) {
    console.log('⚠️ [Gemini API] Normalizing frontend weights to sum to 100%');
    
    const normalizedWeights = weights.map((weight) => ({
      ...weight,
      value: Math.round((weight.value / totalWeight) * 100)
    }));
    
    const finalTotal = normalizedWeights.reduce((sum, w) => sum + w.value, 0);
    const adjustment = 100 - finalTotal;
    
    if (adjustment !== 0 && normalizedWeights.length > 0) {
      normalizedWeights[0].value += adjustment;
    }
    
    console.log('✅ [Gemini API] Normalized frontend weights:', normalizedWeights.map(w => `${w.id}: ${w.value}%`));
    return normalizedWeights;
  }
  
  return weights;
}

// NEW: Normalize demographic weights to sum to 1.0 (for edge function demographic sub-weighting only)
function normalizeDemographicWeights(weights: DemographicWeights): DemographicWeights {
  const total = weights.ethnicity + weights.gender + weights.age + weights.income;
  
  if (total === 0) {
    return { ethnicity: 0.25, gender: 0.25, age: 0.25, income: 0.25 };
  }
  
  return {
    ethnicity: weights.ethnicity / total,
    gender: weights.gender / total,
    age: weights.age / total,
    income: weights.income / total
  };
}

export async function POST(req: NextRequest) {
  const { message, systemPrompt, currentState }: RequestBody = await req.json();
  
  console.log('✅ Gemini API route hit with message:', message);
  console.log('🧠 Current State Received:', currentState);
  
  // ✅ ULTRA-STRONG prompt with ALL weights mandatory
  const improvedPrompt = `
🚨🚨🚨 MANDATORY SINGLE-FACTOR DETECTION 🚨🚨🚨

You are Bricky. Return ONLY valid JSON. NO markdown, NO comments.

🔥 CRITICAL RULE: ALWAYS RETURN ALL 6 WEIGHTS 🔥
You MUST always return ALL these weights in your response:
- foot_traffic
- demographic  
- crime
- flood_risk
- rent_score
- poi

🚨 SINGLE-FACTOR = SET ONE TO 100%, OTHERS TO 0 🚨

SINGLE ETHNICITY PATTERNS:
- "korean ethnicity" / "korean" / "korean areas" → demographic: 100, all others: 0
- "chinese" / "hispanic" / "black" → demographic: 100, all others: 0

SINGLE OTHER PATTERNS:
- "foot traffic" → foot_traffic: 100, all others: 0
- "safety" / "crime" → crime: 100, all others: 0
- "flood risk" → flood_risk: 100, all others: 0

🔥 MANDATORY RESPONSES (COPY EXACTLY): 🔥

For "korean ethnicity":
{
  "selectedEthnicities": ["korean"],
  "weights": [
    {"id": "demographic", "value": 100, "label": "Demographic Match", "icon": "👨‍👩‍👧‍👦", "color": "#34A853"},
    {"id": "foot_traffic", "value": 0, "label": "Foot Traffic", "icon": "👥", "color": "#4285F4"},
    {"id": "crime", "value": 0, "label": "Safety", "icon": "🛡️", "color": "#EA4335"},
    {"id": "flood_risk", "value": 0, "label": "Flood Risk", "icon": "🌊", "color": "#FBBC04"},
    {"id": "rent_score", "value": 0, "label": "Rent", "icon": "🏠", "color": "#FF6D01"},
    {"id": "poi", "value": 0, "label": "Points of Interest", "icon": "📍", "color": "#805AD5"}
  ],
  "demographicScoring": {
    "weights": {"ethnicity": 1.0, "gender": 0.0, "age": 0.0, "income": 0.0},
    "reasoning": "Single ethnicity focus: Korean population"
  }
}

For "foot traffic":
{
  "weights": [
    {"id": "foot_traffic", "value": 100, "label": "Foot Traffic", "icon": "👥", "color": "#4285F4"},
    {"id": "demographic", "value": 0, "label": "Demographic Match", "icon": "👨‍👩‍👧‍👦", "color": "#34A853"},
    {"id": "crime", "value": 0, "label": "Safety", "icon": "🛡️", "color": "#EA4335"},
    {"id": "flood_risk", "value": 0, "label": "Flood Risk", "icon": "🌊", "color": "#FBBC04"},
    {"id": "rent_score", "value": 0, "label": "Rent", "icon": "🏠", "color": "#FF6D01"},
    {"id": "poi", "value": 0, "label": "Points of Interest", "icon": "📍", "color": "#805AD5"}
  ]
}

For "safety":
{
  "weights": [
    {"id": "crime", "value": 100, "label": "Safety", "icon": "🛡️", "color": "#EA4335"},
    {"id": "foot_traffic", "value": 0, "label": "Foot Traffic", "icon": "👥", "color": "#4285F4"},
    {"id": "demographic", "value": 0, "label": "Demographic Match", "icon": "👨‍👩‍👧‍👦", "color": "#34A853"},
    {"id": "flood_risk", "value": 0, "label": "Flood Risk", "icon": "🌊", "color": "#FBBC04"},
    {"id": "rent_score", "value": 0, "label": "Rent", "icon": "🏠", "color": "#FF6D01"},
    {"id": "poi", "value": 0, "label": "Points of Interest", "icon": "📍", "color": "#805AD5"}
  ]
}

🔥 VALIDATION CHECKLIST: 🔥
✅ Did I return ALL 6 weights?
✅ Is the primary factor set to 100?
✅ Are all other factors set to 0?
✅ No mixed weights for single requests?

--- MULTI-FACTOR (only if 2+ things mentioned) ---
"korean women" → demographic: 100, others: 0, but ethnicity: 0.6, gender: 0.4
"foot traffic and safety" → foot_traffic: 60, crime: 40, others: 0

--- RANGES ---
- "korean" → ["korean"]
- "chinese" → ["chinese"]  
- "hispanic" → ["hispanic"]
- "low rent" → [26, 80]
- "middle-income" → [35000, 90000]

--- RESET COMMAND ---
"reset" → {"intent": "reset", "message": "Filters reset to defaults."}

--- CURRENT STATE ---
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
    
    // ✅ Enhanced processing: Normalize weights + validate + add demographic scoring
    if (reply) {
      try {
        const parsedReply = JSON.parse(reply);
        
        // ✅ Enhanced weight normalization with single-factor detection
        if (parsedReply.weights && Array.isArray(parsedReply.weights)) {
          console.log('🔧 [Gemini API] Processing frontend weights...');
          
          // Check if this is a single-factor request before normalization
          const isSingleFactor = isSingleFactor100Request(parsedReply.weights as WeightObject[]);
          console.log('🔍 [Gemini API] Single-factor 100% request detected:', isSingleFactor);
          
          parsedReply.weights = normalizeWeights(parsedReply.weights as WeightObject[]);
        }
        
        // ✅ Validate gender selection (prevent empty arrays)
        if (parsedReply.selectedGenders && Array.isArray(parsedReply.selectedGenders)) {
          if (parsedReply.selectedGenders.length === 0) {
            console.log('⚠️ [Gemini API] Empty gender selection, defaulting to both');
            parsedReply.selectedGenders = ['male', 'female'];
          }
        }
        
        // ✅ NEW: Process demographic scoring if present (for EDGE FUNCTION demographic sub-weighting)
        if (parsedReply.demographicScoring?.weights) {
          console.log('🧬 [Gemini API] Processing demographic sub-weighting for edge function...');
          parsedReply.demographicScoring.weights = normalizeDemographicWeights(
            parsedReply.demographicScoring.weights
          );
          console.log('✅ [Gemini API] Normalized demographic sub-weights:', parsedReply.demographicScoring.weights);
        }
        
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