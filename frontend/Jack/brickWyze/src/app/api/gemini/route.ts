// src/app/api/gemini/route.ts - UPDATED: Edge function provides individual scores, frontend handles weighting
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

// ✅ Keep your original normalization logic - these weights are for FRONTEND use
function normalizeWeights(weights: WeightObject[]): WeightObject[] {
  if (!weights || !Array.isArray(weights)) return weights;
  
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
  
  // ✅ UPDATED prompt with new defaults and examples
  const improvedPrompt = `
You are Bricky, a stateful AI assistant for an NYC neighborhood filtering app. Your ONLY task is to return a valid JSON object. **Do not add any markdown, comments, or text outside of the JSON object itself.**

--- 🏗️ SYSTEM ARCHITECTURE ---
The edge function provides individual scores (0-100 scale):
- foot_traffic_score, crime_score, flood_risk_score, rent_score, poi_score, demographic_score, resilience_score
- Frontend applies user's weight sliders to combine these into final scores
- Your "weights" parameter controls FRONTEND combination, not edge function calculation

--- 🎯 SPECIAL COMMAND: RESET ---
If the user's request is to "reset", "start over", or "return to defaults", your ONLY response MUST be this exact JSON object:
{
  "intent": "reset",
  "message": "Okay, I've reset all filters to their defaults for you."
}

--- 🧬 DEMOGRAPHIC SUB-WEIGHTING RULES ---

**STEP 1: IDENTIFY TARGET DEMOGRAPHICS (for demographicScoring weights)**
Look for WHO the business is targeting - ALL these should get weights:
- "Hispanic women" → ethnicity + gender mentioned
- "young professionals" → age + income mentioned  
- "middle-income Hispanic residents" → ethnicity + income mentioned
- "middle age Hispanic girls" → ethnicity + gender + age mentioned
- "wealthy Chinese customers" → ethnicity + income mentioned

**IMPORTANT: Income levels ALWAYS refer to target population demographics:**
- "middle-income residents" = targeting people with middle income
- "professionals" = targeting high-income people  
- "low-income families" = targeting people with low income
- These should ALL be included in demographic weights

**STEP 2: IDENTIFY AREA CHARACTERISTICS (for filter ranges only)**
Look for WHAT KIND OF AREA they want (these don't affect demographic weights):
- "high rent areas" → set rentRange: [100, 160] 
- "average to high rent" → set rentRange: [60, 160]
- "affordable areas" → set rentRange: [26, 80]
- "high foot traffic" → increase foot_traffic weight in main weights array

**STEP 3: SET FRONTEND WEIGHTS (for main score combination)**
The "weights" array controls how frontend combines individual scores:
- If user mentions "foot traffic is important" → increase foot_traffic weight
- If user mentions "safety matters" → increase crime weight  
- If user mentions "demographic fit crucial" → increase demographic weight
- These weights control final score = (foot_traffic_score × foot_traffic_weight) + (demographic_score × demographic_weight) + etc.

**DEFAULT WEIGHTS (when no specific priorities mentioned):**
- foot_traffic: 45% (primary factor for business success)
- crime: 25% (safety is important)
- flood_risk: 15% (environmental risk)
- rent_score: 10% (cost consideration)
- poi: 5% (commercial ecosystem)
- demographic: 0% (only when demographic filters are selected)

When users select demographic filters, suggest increasing demographic weight to 20-30%.

**CRITICAL EXAMPLES:**

Example 1: "café for middle age Hispanic girls in areas with middle-income Hispanic residents, foot traffic is very important"
{
  "ageRange": [35, 55],
  "selectedGenders": ["female"],
  "selectedEthnicities": ["hispanic"],
  "incomeRange": [35000, 90000],
  "rentRange": [60, 160],
  "weights": [
    {"id": "foot_traffic", "value": 50, "label": "Foot Traffic", "icon": "👥", "color": "#4285F4"},
    {"id": "demographic", "value": 30, "label": "Demographic Match", "icon": "👨‍👩‍👧‍👦", "color": "#34A853"},
    {"id": "crime", "value": 15, "label": "Safety", "icon": "🛡️", "color": "#EA4335"},
    {"id": "flood_risk", "value": 3, "label": "Flood Risk", "icon": "🌊", "color": "#FBBC04"},
    {"id": "rent_score", "value": 2, "label": "Rent", "icon": "🏠", "color": "#FF6D01"}
  ],
  "demographicScoring": {
    "weights": {"ethnicity": 0.4, "gender": 0.25, "age": 0.25, "income": 0.1},
    "reasoning": "Target demographics: Hispanic (ethnicity), girls (gender), middle age (age), middle-income residents (income). All mentioned factors weighted."
  }
}

Example 2: "café for middle-income Hispanic women, safety is crucial"
{
  "selectedGenders": ["female"], 
  "selectedEthnicities": ["hispanic"],
  "incomeRange": [35000, 90000],
  "weights": [
    {"id": "demographic", "value": 45, "label": "Demographic Match", "icon": "👨‍👩‍👧‍👦", "color": "#34A853"},
    {"id": "crime", "value": 30, "label": "Safety", "icon": "🛡️", "color": "#EA4335"},
    {"id": "foot_traffic", "value": 20, "label": "Foot Traffic", "icon": "👥", "color": "#4285F4"},
    {"id": "flood_risk", "value": 3, "label": "Flood Risk", "icon": "🌊", "color": "#FBBC04"},
    {"id": "rent_score", "value": 2, "label": "Rent", "icon": "🏠", "color": "#FF6D01"}
  ],
  "demographicScoring": {
    "weights": {"ethnicity": 0.4, "gender": 0.3, "income": 0.3, "age": 0.0},
    "reasoning": "Target demographics: Hispanic (ethnicity), women (gender), middle-income (income). Age not specified."
  }
}

Example 3: "best areas for foot traffic and safety" (no demographic filters)
{
  "weights": [
    {"id": "foot_traffic", "value": 60, "label": "Foot Traffic", "icon": "👥", "color": "#4285F4"},
    {"id": "crime", "value": 35, "label": "Safety", "icon": "🛡️", "color": "#EA4335"},
    {"id": "flood_risk", "value": 3, "label": "Flood Risk", "icon": "🌊", "color": "#FBBC04"},
    {"id": "rent_score", "value": 2, "label": "Rent", "icon": "🏠", "color": "#FF6D01"}
  ]
}

--- RENT RANGE MAPPING ---
- "low rent/affordable/cheap" → [26, 80]
- "average/moderate rent" → [60, 120] 
- "high rent/expensive" → [100, 160]
- "average to high rent" → [60, 160]

--- INCOME RANGE MAPPING ---
- "low-income" → [0, 35000]
- "middle-income" → [35000, 90000]
- "high-income/professionals/wealthy" → [75000, 250000]

--- AGE RANGE MAPPING ---
- "young/teenagers" → [18, 35]
- "middle-aged/middle age" → [35, 55]
- "elderly/seniors" → [55, 100]

--- CORE BEHAVIOR ---
- You are STATEFUL - modify current state based on requests
- ALWAYS ensure selectedGenders has at least one value
- Include demographicScoring for business demographic queries
- Distinguish between target demographics vs area characteristics
- Set main weights based on user priorities (foot traffic, safety, etc.)
- Default demographic weight to 0% unless demographic filters are selected

--- CURRENT FILTER STATE ---
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
        
        // ✅ Your original weight normalization (keeping this working for FRONTEND weights)
        if (parsedReply.weights && Array.isArray(parsedReply.weights)) {
          console.log('🔧 [Gemini API] Normalizing frontend weights for UI sliders...');
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