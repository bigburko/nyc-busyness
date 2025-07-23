// src/app/api/gemini/services/OpenRouterService.ts
interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterRequestParams {
  prompt: string;
  message: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface OpenRouterResponseData {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class OpenRouterService {
  private static readonly DEFAULT_MODEL = 'google/gemini-2.5-flash';
  private static readonly DEFAULT_TEMPERATURE = 0.3;
  private static readonly DEFAULT_MAX_TOKENS = 2000;

  static async callAPI(params: OpenRouterRequestParams): Promise<Response> {
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: params.prompt },
      { role: 'user', content: params.message }
    ];

    console.log('🔗 [OpenRouter] Making API call with model:', params.model || this.DEFAULT_MODEL);
    console.log('🔗 [OpenRouter] System prompt length:', params.prompt.length);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: params.model || this.DEFAULT_MODEL,
          messages,
          response_format: { type: 'json_object' },
          temperature: params.temperature || this.DEFAULT_TEMPERATURE,
          max_tokens: params.maxTokens || this.DEFAULT_MAX_TOKENS,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [OpenRouter] API error:', errorText);
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      console.log('✅ [OpenRouter] API call successful');
      return response;

    } catch (error) {
      console.error('❌ [OpenRouter] Request failed:', error);
      throw error;
    }
  }

  static async callWithRetry(
    params: OpenRouterRequestParams, 
    maxRetries: number = 3
  ): Promise<Response> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 [OpenRouter] Attempt ${attempt}/${maxRetries}`);
        return await this.callAPI(params);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          console.error(`❌ [OpenRouter] All ${maxRetries} attempts failed`);
          break;
        }

        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`⏱️ [OpenRouter] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw lastError!;
  }

  static validateResponse(data: OpenRouterResponseData): boolean {
    if (!data || !data.choices || !Array.isArray(data.choices)) {
      console.error('❌ [OpenRouter] Invalid response structure: missing choices');
      return false;
    }

    if (data.choices.length === 0) {
      console.error('❌ [OpenRouter] Invalid response structure: empty choices array');
      return false;
    }

    const firstChoice = data.choices[0];
    if (!firstChoice.message || !firstChoice.message.content) {
      console.error('❌ [OpenRouter] Invalid response structure: missing message content');
      return false;
    }

    return true;
  }

  static extractContent(data: OpenRouterResponseData): string | null {
    if (!this.validateResponse(data)) {
      return null;
    }

    const content = data.choices[0].message.content;
    
    try {
      // Validate that content is valid JSON
      JSON.parse(content);
      console.log('✅ [OpenRouter] Valid JSON response received');
      return content;
    } catch (error) {
      console.error('❌ [OpenRouter] Response is not valid JSON:', error);
      return null;
    }
  }
}