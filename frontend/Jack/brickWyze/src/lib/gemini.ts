// src/components/AiDrawerGroup/BrickyAiGroup/gemini.ts - FIXED: Proper typing instead of any

// Define proper types for current filters
interface Weight {
  id: string;
  label?: string;
  value: number;
}

interface CurrentFilters {
  weights?: Weight[];
  selectedTimePeriods?: string[];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  ageRange?: [number, number];
  incomeRange?: [number, number];
  rentRange?: [number, number];
}

// Define types for API response
interface ApiChoice {
  message: {
    content: string;
  };
}

interface ApiResponse {
  choices?: ApiChoice[];
}

// Define types for parsed JSON response
interface WeightFilter {
  id: string;
  weight: number;
}

interface ParsedFilters {
  weights?: WeightFilter[];
  selectedTimePeriods?: string[];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  ageRange?: [number, number];
  incomeRange?: [number, number];
  rentRange?: [number, number];
}

interface ParsedJsonResponse {
  filters?: ParsedFilters;
  message?: string;
}

export async function callGemini(prompt: string, currentFilters?: CurrentFilters): Promise<string> {
  // ✅ ENHANCED: System instruction now includes time periods and better filter understanding
  const systemInstruction = `
    You are Bricky, an expert AI assistant for analyzing NYC neighborhoods for real estate purposes.
    Your primary function is to understand user requests and translate them into a structured JSON format.
    You MUST reply with ONLY a single valid JSON object enclosed in a markdown code block.

    AVAILABLE FILTERS:

    1. "weights": Array of scoring factor objects. Each has "id" and "weight" (0-100). Total must equal 100.
       Valid IDs: foot_traffic, demographic, crime, flood_risk, rent_score, poi
       
    2. "selectedTimePeriods": Array of time periods for foot traffic analysis.
       Valid values: ["morning", "afternoon", "evening"]
       - morning: 6AM-12PM (commuter rush, business opening)
       - afternoon: 12PM-6PM (lunch crowds, peak business)  
       - evening: 6PM-12AM (dining, entertainment, nightlife)
       
    3. "rentRange": [min, max] for RENT PER SQUARE FOOT (PSF). Min: 26, Max: 160.
       This is NOT total monthly rent - it's price per square foot.
       
    4. "ageRange": [min, max] age in years. Min: 0, Max: 100.
    
    5. "incomeRange": [min, max] annual income. Min: 0, Max: 250000.
    
    6. "selectedGenders": Array of strings. Valid: ["male", "female"]
    
    7. "selectedEthnicities": Array of ethnicity strings.
       Examples: ["korean", "chinese", "hispanic", "asian", "white", "black"]

    SMART WEIGHTING RULES:

    - TIME-BASED requests ("morning rush", "nightlife") → HIGH foot_traffic weight + relevant selectedTimePeriods
    - ETHNICITY requests ("Korean areas") → HIGH demographic weight + selectedEthnicities  
    - SAFETY requests ("safe areas") → HIGH crime weight
    - Always ensure weights total exactly 100

    RESPONSE FORMAT:
    \`\`\`json
    {
      "filters": {
        "weights": [{"id": "foot_traffic", "weight": 50}, {"id": "crime", "weight": 30}, {"id": "rent_score", "weight": 20}],
        "selectedTimePeriods": ["morning"],
        "selectedEthnicities": ["korean"],
        "rentRange": [30, 80]
      },
      "message": "Found morning rush areas with Korean communities! I've prioritized foot traffic (50%) and demographics (30%)."
    }
    \`\`\`

    EXAMPLES:

    User: "Show me busy morning areas"
    Response:
    \`\`\`json
    {
      "filters": {
        "weights": [{"id": "foot_traffic", "weight": 60}, {"id": "crime", "weight": 25}, {"id": "rent_score", "weight": 15}],
        "selectedTimePeriods": ["morning"]
      },
      "message": "Looking for areas with high morning foot traffic! Perfect for catching the business rush and commuter activity."
    }
    \`\`\`

    User: "Korean neighborhoods with good nightlife"  
    Response:
    \`\`\`json
    {
      "filters": {
        "weights": [{"id": "demographic", "weight": 45}, {"id": "foot_traffic", "weight": 35}, {"id": "crime", "weight": 20}],
        "selectedTimePeriods": ["evening"],
        "selectedEthnicities": ["korean"]
      },
      "message": "Searching for Korean communities with vibrant evening scenes! I've balanced demographic matching with nightlife activity."
    }
    \`\`\`

    User: "I don't mind paying high rent"
    Response:
    \`\`\`json
    {
      "filters": {
        "rentRange": [100, 160]
      },
      "message": "No problem with higher rent! I've set the filter to show premium areas from $100-160 per square foot."
    }
    \`\`\`
  `;

  // ✅ ENHANCED: Better current state context including time periods
  const contextPrompt = currentFilters ? `
Current Filter State:
- Weights: ${currentFilters.weights?.map((w: Weight) => `${w.label || w.id}: ${w.value}%`).join(', ') || 'Default balanced'}
- Time Periods: ${currentFilters.selectedTimePeriods?.join(', ') || 'All day (morning, afternoon, evening)'}
- Ethnicities: ${currentFilters.selectedEthnicities?.join(', ') || 'None selected'}
- Genders: ${currentFilters.selectedGenders?.join(', ') || 'All genders'}
- Age Range: ${currentFilters.ageRange ? `${currentFilters.ageRange[0]}-${currentFilters.ageRange[1]} years` : 'All ages'}
- Income Range: ${currentFilters.incomeRange ? `$${currentFilters.incomeRange[0]/1000}K-$${currentFilters.incomeRange[1]/1000}K` : 'All incomes'}
- Rent Range: ${currentFilters.rentRange ? `$${currentFilters.rentRange[0]}-${currentFilters.rentRange[1]} PSF` : 'All rent levels'}

User Request: "${prompt}"

Adjust filters based on this request, considering the current state.
` : `User Request: "${prompt}"

Create appropriate filters for this NYC neighborhood search.`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'BrickWyze Bricky AI'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: contextPrompt }
        ],
        temperature: 0.1, // Low temperature for consistent JSON structure
        max_tokens: 1024
      })
    });

    if (!res.ok) {
      console.error('❌ Gemini API error:', res.status, await res.text());
      throw new Error(`API request failed with status ${res.status}`);
    }

    const data: ApiResponse = await res.json();
    const response = data.choices?.[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response content from API');
    }
    
    // ✅ VALIDATE: Ensure response contains proper JSON
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      console.warn('⚠️ [Gemini] Response missing JSON format, attempting to parse directly');
      // Try to parse the entire response as JSON
      try {
        JSON.parse(response);
        return response;
      } catch {
        throw new Error('Response not in expected JSON format');
      }
    }
    
    // ✅ VALIDATE: Check if JSON is parseable
    try {
      const parsedJson: ParsedJsonResponse = JSON.parse(jsonMatch[1]);
      
      // ✅ VALIDATE: Ensure weights total 100 if present
      if (parsedJson.filters?.weights) {
        const totalWeight = parsedJson.filters.weights.reduce((sum: number, w: WeightFilter) => sum + (w.weight || 0), 0);
        if (Math.abs(totalWeight - 100) > 1) {
          console.warn(`⚠️ [Gemini] Weights don't total 100% (${totalWeight}%), will normalize`);
        }
      }
      
      // ✅ VALIDATE: Check time periods are valid
      if (parsedJson.filters?.selectedTimePeriods) {
        const validPeriods = ['morning', 'afternoon', 'evening'];
        const invalidPeriods = parsedJson.filters.selectedTimePeriods.filter((p: string) => !validPeriods.includes(p));
        if (invalidPeriods.length > 0) {
          console.warn(`⚠️ [Gemini] Invalid time periods: ${invalidPeriods.join(', ')}`);
        }
      }
      
      console.log('✅ [Gemini] Valid JSON response received');
      return response;
      
    } catch (parseError) {
      console.error('❌ [Gemini] JSON parsing failed:', parseError);
      throw new Error('Invalid JSON in response');
    }
    
  } catch (error) {
    console.error('❌ [Gemini] API call failed:', error);
    
    // ✅ FALLBACK: Return safe default response that won't cause validation errors
    const fallbackResponse = {
      filters: {},
      message: "I understand you're looking for NYC neighborhoods! Try asking me something specific like 'show me safe Korean areas' or 'busy morning spots with good restaurants'."
    };
    
    return `\`\`\`json\n${JSON.stringify(fallbackResponse, null, 2)}\n\`\`\``;
  }
}