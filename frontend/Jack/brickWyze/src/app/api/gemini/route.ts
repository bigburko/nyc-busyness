// src/app/api/gemini/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { BusinessIntelligenceService } from './services/BusinessIntelligenceService';
import { TimeBasedPromptService } from './services/TimeBasedPromptService';
import { OpenRouterService } from './services/OpenRouterService';
import { ValidationService } from './services/ValidationService';
import { WeightNormalizationService } from './services/WeightNormalizationService';

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
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [Gemini API] Request received');
    
    const body: RequestBody = await request.json();
    const { message, currentState } = body;

    if (!message || typeof message !== 'string') {
      console.error('❌ [Gemini API] Invalid message provided');
      return NextResponse.json(
        { error: 'Valid message is required' },
        { status: 400 }
      );
    }

    console.log('📝 [Gemini API] Processing message:', message);
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

    // Step 3: Call OpenRouter API with retry mechanism
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

    // Step 4: Extract and validate content
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

    console.log('🎉 [Gemini API] Response processed successfully');
    console.log('📊 [Gemini API] Final weights:', 
      finalResponse.weights?.map(w => `${w.id}: ${w.value}%`).join(', ')
    );

    return NextResponse.json({
      reply: JSON.stringify(finalResponse)
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