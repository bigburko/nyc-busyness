// src/app/api/gemini/route.ts - Cultural Override Enhanced (Final Fix)
import { NextRequest, NextResponse } from 'next/server';

// Enhanced type definitions
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
    selectedTimePeriods?: string[];
    ageRange?: [number, number];
    incomeRange?: [number, number];
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

interface WeightObject {
  id: string;
  value: number;
  label: string;
  icon: string;
  color: string;
}

function isSingleFactor100Request(weights: WeightObject[]): boolean {
  const hundredWeights = weights.filter(w => w.value === 100);
  const zeroWeights = weights.filter(w => w.value === 0);
  
  return hundredWeights.length === 1 && (hundredWeights.length + zeroWeights.length) === weights.length;
}

function normalizeWeights(weights: WeightObject[]): WeightObject[] {
  if (!weights || !Array.isArray(weights)) return weights;
  
  if (isSingleFactor100Request(weights)) {
    console.log('✅ [Gemini API] Single-factor 100% detected, skipping normalization');
    return weights;
  }
  
  const totalWeight = weights.reduce((sum, w) => sum + (w.value || 0), 0);
  
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
    
    return normalizedWeights;
  }
  
  return weights;
}

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
  
  // 🎭 CULTURAL OVERRIDE ENHANCED PROMPT (FINAL FIX)
  const culturalOverridePrompt = `
🎭🚨🔥 CULTURAL OVERRIDE INTELLIGENCE - FINAL FIX 🔥🚨🎭

You are Bricky, a NYC cultural expert who PRIORITIZES NEIGHBORHOOD PERSONALITY over surface metrics.
Return ONLY valid JSON. NO markdown, NO comments.

🚨 CRITICAL OVERRIDE PRINCIPLES 🚨

CULTURAL FIT > SAFETY SCORES > FOOT TRAFFIC NUMBERS
Your job is to OVERRIDE high safety/foot traffic areas if they're culturally wrong for the business.

🎭 NEIGHBORHOOD CULTURAL OVERRIDE RULES 🎭

NIGHTLIFE/BAR BUSINESSES:
- NEVER suggest Upper East Side (family area, early-to-bed)
- NEVER suggest Upper West Side (family area, residential)
- NEVER suggest Financial District (business only, dead at night)
- ALWAYS prioritize: East Village, West Village, Lower East Side
- REASON: "Cultural fit overrides safety scores"

FOOD SCENE BUSINESSES (ramen, artisanal food):
- NEVER suggest business districts or family residential areas
- ALWAYS prioritize: East Village, Nolita, West Village
- REASON: "Food culture scene essential over foot traffic volume"

24-HOUR BUSINESSES:
- NEVER suggest residential areas (they sleep at night)
- ALWAYS prioritize: Times Square, Union Square, major transit hubs
- REASON: "Need true 24-hour activity, not daytime foot traffic"

HERITAGE/AUTHENTIC BUSINESSES:
- NEVER suggest new development areas
- ALWAYS prioritize: Lower East Side, established ethnic neighborhoods
- REASON: "Cultural memory essential over demographics alone"

🔥 AGGRESSIVE CULTURAL WEIGHTING STRATEGIES 🔥

NIGHTLIFE OVERRIDE:
- demographic: 60% (heavily weight age 22-40 + cultural behavior)
- foot_traffic: 25% (but EVENING traffic only)
- poi: 15% (nightlife clustering essential)
- crime: 0% (safety less important than cultural fit)
- rent_score: 0%
- flood_risk: 0%

FOOD SCENE OVERRIDE:
- demographic: 55% (food culture appreciation + age)
- foot_traffic: 30% (food tourists + adventurous locals)
- poi: 15% (restaurant clustering)
- crime: 0%
- rent_score: 0%
- flood_risk: 0%

TRUE 24-HOUR OVERRIDE:
- foot_traffic: 70% (but must be 24-hour foot traffic)
- demographic: 20% (night workers, insomniacs)
- poi: 10% (transit, late-night services)
- crime: 0%
- rent_score: 0%
- flood_risk: 0%

HERITAGE OVERRIDE:
- demographic: 70% (community connection essential)
- foot_traffic: 20% (local + cultural tourism)
- poi: 10% (community services)
- crime: 0%
- rent_score: 0%
- flood_risk: 0%

🎯 BUSINESS TYPE DETECTION & OVERRIDE 🎯

NIGHTLIFE KEYWORDS: "bar", "cocktail", "nightlife", "speakeasy", "club", "late night"
→ ACTIVATE NIGHTLIFE OVERRIDE (East Village priority)

FOOD SCENE KEYWORDS: "ramen", "artisanal", "craft", "premium", "gourmet", "foodie"
→ ACTIVATE FOOD SCENE OVERRIDE (East Village/Nolita priority)

24-HOUR KEYWORDS: "24 hour", "24-hour", "all night", "late night", "round the clock"
→ ACTIVATE 24-HOUR OVERRIDE (Times Square/Union Square priority)

HERITAGE KEYWORDS: "traditional", "authentic", "heritage", "family recipe", "cultural"
→ ACTIVATE HERITAGE OVERRIDE (Lower East Side priority)

📋 CULTURAL OVERRIDE EXAMPLES 📋

For "nightlife business for young people":
{
  "selectedEthnicities": [],
  "selectedGenders": ["male", "female"],
  "ageRange": [22, 35],
  "incomeRange": [45000, 120000],
  "selectedTimePeriods": ["evening"],
  "rentRange": [70, 120],
  "weights": [
    {"id": "demographic", "value": 60, "label": "Demographic Match", "icon": "👨‍👩‍👧‍👦", "color": "#34A853"},
    {"id": "foot_traffic", "value": 25, "label": "Foot Traffic", "icon": "👥", "color": "#4285F4"},
    {"id": "poi", "value": 15, "label": "Points of Interest", "icon": "📍", "color": "#805AD5"},
    {"id": "crime", "value": 0, "label": "Safety", "icon": "🛡️", "color": "#EA4335"},
    {"id": "rent_score", "value": 0, "label": "Rent", "icon": "🏠", "color": "#FF6D01"},
    {"id": "flood_risk", "value": 0, "label": "Flood Risk", "icon": "🌊", "color": "#FBBC04"}
  ],
  "demographicScoring": {
    "weights": {"age": 0.5, "income": 0.3, "ethnicity": 0.1, "gender": 0.1},
    "reasoning": "CULTURAL OVERRIDE: Nightlife businesses MUST avoid family areas like UES/UWS despite high safety scores. East Village/West Village essential for nightlife culture. Safety scores irrelevant - young nightlife crowd prioritizes scene over safety."
  }
}

For "high-end ramen shop":
{
  "selectedEthnicities": ["asian", "japanese"],
  "selectedGenders": ["male", "female"],
  "ageRange": [22, 40],
  "incomeRange": [50000, 130000],
  "selectedTimePeriods": ["afternoon", "evening"],
  "rentRange": [80, 130],
  "weights": [
    {"id": "demographic", "value": 55, "label": "Demographic Match", "icon": "👨‍👩‍👧‍👦", "color": "#34A853"},
    {"id": "foot_traffic", "value": 30, "label": "Foot Traffic", "icon": "👥", "color": "#4285F4"},
    {"id": "poi", "value": 15, "label": "Points of Interest", "icon": "📍", "color": "#805AD5"},
    {"id": "crime", "value": 0, "label": "Safety", "icon": "🛡️", "color": "#EA4335"},
    {"id": "rent_score", "value": 0, "label": "Rent", "icon": "🏠", "color": "#FF6D01"},
    {"id": "flood_risk", "value": 0, "label": "Flood Risk", "icon": "🌊", "color": "#FBBC04"}
  ],
  "demographicScoring": {
    "weights": {"ethnicity": 0.3, "age": 0.4, "income": 0.25, "gender": 0.05},
    "reasoning": "FOOD SCENE OVERRIDE: Premium ramen requires food culture scene - East Village perfect with line-waiting culture and adventurous eaters. Avoid family areas or business districts. Cultural fit more important than safety scores."
  }
}

For "24-hour diner":
{
  "selectedEthnicities": [],
  "selectedGenders": ["male", "female"],
  "ageRange": [18, 60],
  "incomeRange": [25000, 90000],
  "selectedTimePeriods": ["morning", "afternoon", "evening"],
  "rentRange": [50, 100],
  "weights": [
    {"id": "foot_traffic", "value": 70, "label": "Foot Traffic", "icon": "👥", "color": "#4285F4"},
    {"id": "demographic", "value": 20, "label": "Demographic Match", "icon": "👨‍👩‍👧‍👦", "color": "#34A853"},
    {"id": "poi", "value": 10, "label": "Points of Interest", "icon": "📍", "color": "#805AD5"},
    {"id": "crime", "value": 0, "label": "Safety", "icon": "🛡️", "color": "#EA4335"},
    {"id": "rent_score", "value": 0, "label": "Rent", "icon": "🏠", "color": "#FF6D01"},
    {"id": "flood_risk", "value": 0, "label": "Flood Risk", "icon": "🌊", "color": "#FBBC04"}
  ],
  "demographicScoring": {
    "weights": {"age": 0.3, "income": 0.3, "ethnicity": 0.2, "gender": 0.2},
    "reasoning": "24-HOUR OVERRIDE: Must have TRUE 24-hour foot traffic - major transit hubs only. Avoid residential areas that sleep. Night workers, insomniacs, shift workers need real all-night activity zones."
  }
}

For "speakeasy cocktail bar":
{
  "selectedEthnicities": [],
  "selectedGenders": ["male", "female"],
  "ageRange": [25, 40],
  "incomeRange": [60000, 150000],
  "selectedTimePeriods": ["evening"],
  "rentRange": [80, 140],
  "weights": [
    {"id": "demographic", "value": 60, "label": "Demographic Match", "icon": "👨‍👩‍👧‍👦", "color": "#34A853"},
    {"id": "foot_traffic", "value": 25, "label": "Foot Traffic", "icon": "👥", "color": "#4285F4"},
    {"id": "poi", "value": 15, "label": "Points of Interest", "icon": "📍", "color": "#805AD5"},
    {"id": "crime", "value": 0, "label": "Safety", "icon": "🛡️", "color": "#EA4335"},
    {"id": "rent_score", "value": 0, "label": "Rent", "icon": "🏠", "color": "#FF6D01"},
    {"id": "flood_risk", "value": 0, "label": "Flood Risk", "icon": "🌊", "color": "#FBBC04"}
  ],
  "demographicScoring": {
    "weights": {"age": 0.45, "income": 0.35, "ethnicity": 0.1, "gender": 0.1},
    "reasoning": "SPEAKEASY OVERRIDE: Hidden cocktail culture REQUIRES nightlife neighborhoods - East Village/West Village only. UES families go to bed early, wrong culture entirely. Adventurous crowd more important than safety metrics."
  }
}

🔄 CURRENT STATE CONTEXT 🔄
User Request: "${message}"

🚨 FINAL OVERRIDE INSTRUCTIONS 🚨
1. DETECT business type from keywords
2. APPLY appropriate cultural override
3. SET crime/rent_score/flood_risk to 0% for cultural businesses
4. HEAVILY weight demographics toward cultural fit
5. NEVER suggest family areas for nightlife/food scene businesses
6. ALWAYS explain cultural override reasoning

Remember: UES has high foot traffic and safety BUT wrong culture for nightlife = WRONG CHOICE
Cultural fit ALWAYS trumps surface metrics!
`;

  try {
    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt || culturalOverridePrompt },
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
    
    if (reply) {
      try {
        const parsedReply = JSON.parse(reply);
        
        // Enhanced weight normalization
        if (parsedReply.weights && Array.isArray(parsedReply.weights)) {
          console.log('🔧 [Gemini API] Processing cultural-override weights...');
          
          const isSingleFactor = isSingleFactor100Request(parsedReply.weights as WeightObject[]);
          console.log('🔍 [Gemini API] Single-factor 100% request detected:', isSingleFactor);
          
          parsedReply.weights = normalizeWeights(parsedReply.weights as WeightObject[]);
        }
        
        // Enhanced validation
        if (parsedReply.ageRange && Array.isArray(parsedReply.ageRange)) {
          const [min, max] = parsedReply.ageRange;
          if (min < 18) parsedReply.ageRange[0] = 18;
          if (max > 80) parsedReply.ageRange[1] = 80;
          if (min >= max) parsedReply.ageRange = [22, 40]; // Cultural business default
          
          console.log('📅 [Gemini API] Cultural-override age range set:', parsedReply.ageRange);
        }
        
        if (parsedReply.incomeRange && Array.isArray(parsedReply.incomeRange)) {
          const [min, max] = parsedReply.incomeRange;
          if (min < 20000) parsedReply.incomeRange[0] = 20000;
          if (max > 250000) parsedReply.incomeRange[1] = 250000;
          if (min >= max) parsedReply.incomeRange = [45000, 120000]; // Cultural business default
          
          console.log('💰 [Gemini API] Cultural-override income range set:', parsedReply.incomeRange);
        }
        
        // Enhanced time period validation for cultural businesses
        if (parsedReply.selectedTimePeriods && Array.isArray(parsedReply.selectedTimePeriods)) {
          const validPeriods = ['morning', 'afternoon', 'evening'];
          parsedReply.selectedTimePeriods = parsedReply.selectedTimePeriods.filter((p: string) => 
            validPeriods.includes(p)
          );
          
          if (parsedReply.selectedTimePeriods.length === 0) {
            parsedReply.selectedTimePeriods = ['evening']; // Cultural businesses often evening-focused
          }
        }
        
        // Gender inclusivity
        if (parsedReply.selectedGenders && Array.isArray(parsedReply.selectedGenders)) {
          if (parsedReply.selectedGenders.length === 0) {
            console.log('⚠️ [Gemini API] Empty gender selection, defaulting to inclusive');
            parsedReply.selectedGenders = ['male', 'female'];
          }
        }
        
        // Cultural business rent intelligence
        if (parsedReply.rentRange && Array.isArray(parsedReply.rentRange)) {
          const [min, max] = parsedReply.rentRange;
          if (min < 26) parsedReply.rentRange[0] = 26;
          if (max > 160) parsedReply.rentRange[1] = 160;
          if (min >= max) parsedReply.rentRange = [70, 130]; // Cultural business default
        }
        
        // Process demographic scoring with cultural emphasis
        if (parsedReply.demographicScoring?.weights) {
          console.log('🧬 [Gemini API] Processing cultural-override demographic scoring...');
          
          parsedReply.demographicScoring.weights = normalizeDemographicWeights(
            parsedReply.demographicScoring.weights
          );
          console.log('✅ [Gemini API] Cultural-override demographic weights:', parsedReply.demographicScoring.weights);
        }
        
        reply = JSON.stringify(parsedReply);
        
      } catch (parseError) {
        console.error('❌ Failed to parse cultural-override response:', parseError);
      }
    }
    
    return NextResponse.json({ reply });

  } catch (error: unknown) {
    console.error('❌ Cultural Override API failed:', error);
    
    let errorMessage = 'Cultural Override API failed';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return NextResponse.json({ reply: null, error: errorMessage }, { status: 500 });
  }
}