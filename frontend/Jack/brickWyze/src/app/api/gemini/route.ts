// src/app/api/gemini/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { BusinessIntelligenceService } from './services/BusinessIntelligenceService';
import { TimeBasedPromptService } from './services/TimeBasedPromptService';
import { OpenRouterService } from './services/OpenRouterService';
import { ValidationService } from './services/ValidationService';
import { WeightNormalizationService } from './services/WeightNormalizationService';

// 🎯 ETHNICITY CODE TO HUMAN NAME MAPPING
const ETHNICITY_CODE_TO_NAME: Record<string, string> = {
  // Asian Categories
  'AEA': 'East Asian',
  'ASA': 'South Asian', 
  'ASEA': 'Southeast Asian',
  'ACA': 'Central Asian',
  'AOth': 'Other Asian',
  
  // Specific Asian Ethnicities
  'AEAKrn': 'Korean',
  'AEAChnsNoT': 'Chinese',
  'AEAJpns': 'Japanese', 
  'AEATwns': 'Taiwanese',
  'ASAAsnInd': 'Indian',
  'ASAPkstn': 'Pakistani',
  'ASABngldsh': 'Bangladeshi',
  'ASASrLnkn': 'Sri Lankan',
  'ASANpls': 'Nepalese',
  'ASEAFlpn': 'Filipino',
  'ASEAVtnms': 'Vietnamese',
  'ASEAThai': 'Thai',
  'ASEACmbdn': 'Cambodian',
  'ASEAIndnsn': 'Indonesian',
  'ASEAMlysn': 'Malaysian',
  'ASEABrms': 'Burmese',
  'ASEASngprn': 'Singaporean',
  'ACAAfghan': 'Afghan',
  'ACAUzbek': 'Uzbek',
  
  // Hispanic Categories
  'HMex': 'Mexican',
  'HCA': 'Central American',
  'HSA': 'South American', 
  'HCH': 'Caribbean Hispanic',
  'HOth': 'Other Hispanic',
  
  // Specific Hispanic Ethnicities
  'HCHPrtRcn': 'Puerto Rican',
  'HCHCuban': 'Cuban',
  'HCHDmncn': 'Dominican',
  'HCACstRcn': 'Costa Rican',
  'HCAGutmln': 'Guatemalan',
  'HCAHndrn': 'Honduran',
  'HCANcrgn': 'Nicaraguan',
  'HCASlvdrn': 'Salvadoran',
  'HSAArgntn': 'Argentinean',
  'HSABlvn': 'Bolivian',
  'HSAChln': 'Chilean',
  'HSAClmbn': 'Colombian',
  'HSAEcudrn': 'Ecuadorian',
  'HSAPrvn': 'Peruvian',
  'HSAVnzuln': 'Venezuelan',
  
  // White Categories
  'WEur': 'European',
  'WMENA': 'Middle Eastern/North African',
  'WOth': 'Other White',
  
  // Specific White Ethnicities  
  'WEurItln': 'Italian',
  'WEurIrsh': 'Irish',
  'WEurGrmn': 'German',
  'WEurPlsh': 'Polish',
  'WEurRsn': 'Russian',
  'WEurFrnch': 'French',
  'WEurBrtsh': 'British',
  'WEurEnglsh': 'English',
  'WMENAArab': 'Arab',
  'WMENALbns': 'Lebanese',
  'WMENAPlstn': 'Palestinian',
  'WMENASyrn': 'Syrian',
  'WMENAEgptn': 'Egyptian',
  'WMENAIrq': 'Iraqi',
  'WMENAIrn': 'Iranian',
  'WMENAIsrl': 'Israeli',
  
  // Black Categories
  'BAfrAm': 'African American',
  'BSSAf': 'Sub-Saharan African',
  'BCrb': 'Caribbean Black',
  'BOth': 'Other Black',
  
  // Specific Black Ethnicities
  'BSSAfNgrn': 'Nigerian',
  'BSSAfGhn': 'Ghanaian', 
  'BSSAfEthpn': 'Ethiopian',
  'BSSAfKnyn': 'Kenyan',
  'BSSAfSAfr': 'South African',
  'BCrbJmcn': 'Jamaican',
  'BCrbHtn': 'Haitian',
  'BCrbBrbdn': 'Barbadian',
  'BCrbTrTob': 'Trinidadian/Tobagonian',
  
  // Other Categories
  'AIANA': 'Native American',
  'AIANAIn': 'American Indian',
  'AIANAlkNtv': 'Alaska Native',
  'NHPI': 'Pacific Islander',
  'NHPIPlyNH': 'Native Hawaiian',
  'NHPIPlySmn': 'Samoan',
  'SOR': 'Some Other Race',
  'SORBrzln': 'Brazilian',
  'SORBlzn': 'Belizean',
  'SORGuyans': 'Guyanese',
  
  // Top Level Categories
  'H': 'Hispanic/Latino',
  'W': 'White',
  'B': 'Black',
  'A': 'Asian'
};

// 🎯 FUNCTION: Convert ethnicity codes to human-readable names
function formatEthnicityForAI(ethnicities: string[]): string {
  if (!ethnicities || ethnicities.length === 0) {
    return "general population";
  }
  
  const formattedNames = ethnicities.map(code => {
    const humanName = ETHNICITY_CODE_TO_NAME[code];
    if (humanName) {
      return humanName;
    }
    
    // If no exact match, try to clean up the code
    if (code.length <= 4) {
      return code; // Keep short codes as-is for now
    }
    
    // For longer codes, try to make them more readable
    return code.replace(/([A-Z])/g, ' $1').trim();
  });
  
  // Format the list nicely
  if (formattedNames.length === 1) {
    return formattedNames[0];
  } else if (formattedNames.length === 2) {
    return formattedNames.join(' and ');
  } else {
    const last = formattedNames.pop();
    return formattedNames.join(', ') + ', and ' + last;
  }
}

interface CurrentState {
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  ageRange?: [number, number];
  incomeRange?: [number, number];
  [key: string]: unknown;
}

interface RequestBody {
  message: string;
  currentState?: CurrentState;
  readOnly?: boolean; // 🔒 NEW: Flag for AI Summary read-only mode
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [Gemini API] Request received');
    
    const body: RequestBody = await request.json();
    const { message, currentState, readOnly } = body;

    if (!message || typeof message !== 'string') {
      console.error('❌ [Gemini API] Invalid message provided');
      return NextResponse.json(
        { error: 'Valid message is required' },
        { status: 400 }
      );
    }

    // 🔒 READ-ONLY MODE for AI Summary (same format, no filter processing)
    if (readOnly) {
      console.log('🔒 [Gemini API] READ-ONLY mode detected - using same format but NO filter processing');
      
      try {
        // Step 1: Analyze business context (same as regular mode)
        const businessContext = BusinessIntelligenceService.analyzeBusinessRequest(message);
        console.log('🎯 [Gemini API] Business context (read-only):', businessContext);

        // 🎯 Step 1.5: Format demographics for better AI analysis
        let enhancedCurrentState = currentState || {};
        if (enhancedCurrentState.selectedEthnicities) {
          console.log('🎯 [Gemini API] Raw ethnicities:', enhancedCurrentState.selectedEthnicities);
          const formattedEthnicities = formatEthnicityForAI(enhancedCurrentState.selectedEthnicities);
          console.log('🎯 [Gemini API] Formatted ethnicities:', formattedEthnicities);
          
          // Add formatted ethnicities to the enhanced state
          enhancedCurrentState = {
            ...enhancedCurrentState,
            formattedEthnicities: formattedEthnicities,
            demographicContext: {
              targetEthnicities: formattedEthnicities,
              targetGenders: enhancedCurrentState.selectedGenders || [],
              targetAgeRange: enhancedCurrentState.ageRange || [18, 65],
              targetIncomeRange: enhancedCurrentState.incomeRange || [0, 250000]
            }
          };
        }

        // Step 2: Create context-aware prompt with enhanced demographics
        const contextPrompt = TimeBasedPromptService.createContextPrompt(
          message, 
          enhancedCurrentState, 
          businessContext
        );

        // 🎯 Step 2.5: Enhance the system prompt to use formatted demographics and proper score rounding
        const enhancedPrompt = contextPrompt + `

IMPORTANT: When analyzing demographics, use these human-readable terms instead of database codes:
${enhancedCurrentState.formattedEthnicities ? `
- Target Ethnicities: ${enhancedCurrentState.formattedEthnicities}
- Target Demographics: ${JSON.stringify(enhancedCurrentState.demographicContext)}
` : ''}

CRITICAL SCORE DISPLAY INSTRUCTIONS:
- When displaying any score (especially the main tract score), always round to the nearest whole number using proper mathematical rounding
- If you receive a score like 82.7, display it as 83 (not 82)
- If you receive a score like 82.3, display it as 82 (not 82 or 83)
- Use Math.round() logic: 0.5 and above rounds up, below 0.5 rounds down
- Never truncate or floor scores - always round properly

In your analysis, always refer to ethnicities by their proper names (e.g., "Korean", "Mexican", "African American") rather than database codes (e.g., "AEA", "HMex", "BAfrAm"). Make the demographic analysis clear and business-friendly.`;

        // Step 3: Call OpenRouter API with enhanced prompt
        const response = await OpenRouterService.callWithRetry({
          prompt: enhancedPrompt,
          message: message,
          model: 'google/gemini-2.5-flash',
          temperature: 0.3,
          maxTokens: 2000
        });

        if (!response.ok) {
          throw new Error(`OpenRouter API failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 [Gemini API] Read-only JSON response received');

        // Step 4: Extract and validate JSON content (same as regular mode)
        const content = OpenRouterService.extractContent(data);
        if (!content) {
          throw new Error('Failed to extract valid JSON content from read-only response');
        }

        console.log('✅ [Gemini API] Read-only JSON analysis completed - NO FILTER UPDATES');

        // 🔒 CRITICAL: Return raw JSON without any normalization or validation
        // This gives you the same beautiful format but prevents filter updates
        return NextResponse.json({
          reply: content, // Raw JSON from AI (same format as before)
          readOnlyMode: true,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ [Gemini API] Read-only mode error:', error);
        return NextResponse.json(
          { 
            error: 'Failed to generate read-only analysis',
            details: error instanceof Error ? error.message : 'Unknown error',
            readOnlyMode: true
          },
          { status: 500 }
        );
      }
    }

    // 🔄 REGULAR MODE for main chatbot (with filter processing)
    console.log('📝 [Gemini API] REGULAR mode - processing message:', message);
    console.log('📊 [Gemini API] Current state:', currentState);

    // Step 1: Analyze business context
    const businessContext = BusinessIntelligenceService.analyzeBusinessRequest(message);
    console.log('🎯 [Gemini API] Business context:', businessContext);

    // Step 2: Create context-aware prompt - handle undefined currentState
    const contextPrompt = TimeBasedPromptService.createContextPrompt(
      message, 
      currentState || {}, // Provide empty object as fallback
      businessContext
    );

    // Step 3: Call OpenRouter API with retry mechanism (regular mode)
    const response = await OpenRouterService.callWithRetry({
      prompt: contextPrompt,
      message: message,
      model: 'google/gemini-2.5-flash',
      temperature: 0.3,
      maxTokens: 2000
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('📦 [Gemini API] Raw OpenRouter response received');

    // Step 4: Extract and validate content (regular JSON processing)
    const content = OpenRouterService.extractContent(data);
    if (!content) {
      throw new Error('Failed to extract valid content from OpenRouter response');
    }

    console.log('✅ [Gemini API] Valid JSON content extracted');

    // Step 5: Validate and process response - fixed to use only one argument
    const validatedResponse = ValidationService.processAndValidateResponse(content, businessContext);

    // Step 6: Normalize weights to ensure they sum to 100%
    const normalizedResponse = WeightNormalizationService.normalizeWeights(validatedResponse);

    // Step 7: Validate demographic scoring weights
    const finalResponse = WeightNormalizationService.validateDemographicScoring(normalizedResponse);

    console.log('🎉 [Gemini API] Regular response processed successfully');
    console.log('📊 [Gemini API] Final weights:', 
      finalResponse.weights?.map(w => `${w.id}: ${w.value}%`).join(', ')
    );

    return NextResponse.json({
      reply: JSON.stringify(finalResponse),
      readOnlyMode: false
    });

  } catch (error) {
    console.error('❌ [Gemini API] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Gemini API endpoint is working',
    timestamp: new Date().toISOString()
  });
}