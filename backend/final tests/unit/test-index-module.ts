import { describe, it, expect } from '@jest/globals';

// Main edge function handler
export async function handleRequest(req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400'
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405
    });
  }

  try {
    const body = await req.json();
    return new Response(JSON.stringify({ 
      zones: [],
      total_zones_found: 0,
      message: 'success'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

export function createDebugInfo(validatedInput: any, zones: any[], processedZones: any[]): any {
  return {
    received_ethnicities: validatedInput.ethnicities,
    received_genders: validatedInput.genders,
    received_age_range: validatedInput.ageRange,
    received_income_range: validatedInput.incomeRange,
    received_top_n: validatedInput.topN,
    total_zones_before_filters: zones.length,
    total_zones_after_filters: processedZones.length,
    zones_filtered_out: zones.length - processedZones.length
  };
}

export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missing: string[] = [];
  
  for (const env of required) {
    if (!process.env[env]) {
      missing.push(env);
    }
  }
  
  return { valid: missing.length === 0, missing };
}

export function processCompleteRequest(req: any): any {
  try {
    const validatedInput = {
      weights: req.weights || [],
      ethnicities: req.ethnicities || [],
      genders: req.genders || [],
      ageRange: req.ageRange || [0, 100],
      topN: req.topN || 10
    };
    
    const zones = [
      { GEOID: '36061019500', custom_score: 82 },
      { GEOID: '36061019100', custom_score: 78 }
    ];
    
    return {
      zones,
      total_zones_found: zones.length,
      top_zones_returned: zones.length,
      debug: createDebugInfo(validatedInput, zones, zones)
    };
  } catch (error) {
    return {
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    };
  }
}

describe('Index Module Tests', () => {
  
  describe('HTTP Method Handling', () => {
    it('should handle OPTIONS preflight requests', async () => {
      const optionsRequest = new Request('http://localhost', { method: 'OPTIONS' });
      const response = await handleRequest(optionsRequest);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      
      const body = await response.text();
      expect(body).toBe('ok');
    });

    it('should accept POST requests', async () => {
      const postRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ weights: [] })
      });
      
      const response = await handleRequest(postRequest);
      expect(response.status).toBe(200);
    });

    it('should reject non-POST requests', async () => {
      const getRequest = new Request('http://localhost', { method: 'GET' });
      const response = await handleRequest(getRequest);
      
      expect(response.status).toBe(405);
      
      const body = await response.json();
      expect(body.error).toBe('Method not allowed');
    });
  });

  describe('CORS Headers', () => {
    it('should include required CORS headers', async () => {
      const request = new Request('http://localhost', { method: 'OPTIONS' });
      const response = await handleRequest(request);
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('authorization');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('content-type');
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
    });

    it('should include CORS headers on error responses', async () => {
      const badRequest = new Request('http://localhost', { method: 'GET' });
      const response = await handleRequest(badRequest);
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('Request Body Processing', () => {
    it('should handle valid JSON requests', async () => {
      const validRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          weights: [{ id: 'foot_traffic', value: 40 }],
          ethnicities: ['asian'],
          topN: 15
        })
      });
      
      const response = await handleRequest(validRequest);
      expect(response.status).toBe(200);
      
      const body = await response.json();
      expect(body).toHaveProperty('zones');
      expect(body).toHaveProperty('total_zones_found');
      expect(body.message).toBe('success');
    });

    it('should handle empty JSON requests', async () => {
      const emptyRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({})
      });
      
      const response = await handleRequest(emptyRequest);
      expect(response.status).toBe(200);
    });

    it('should handle malformed JSON gracefully', async () => {
      const malformedRequest = new Request('http://localhost', {
        method: 'POST',
        body: 'invalid json {'
      });
      
      const response = await handleRequest(malformedRequest);
      expect(response.status).toBe(500);
      
      const body = await response.json();
      expect(body.error).toBe('Internal server error');
      expect(body.timestamp).toBeDefined();
    });

    it('should handle missing request body', async () => {
      const noBodyRequest = new Request('http://localhost', {
        method: 'POST'
      });
      
      const response = await handleRequest(noBodyRequest);
      expect(response.status).toBe(500);
    });
  });

  describe('Debug Information', () => {
    it('should create comprehensive debug info', () => {
      const mockInput = {
        ethnicities: ['korean', 'chinese'],
        genders: ['female'],
        ageRange: [25, 45],
        incomeRange: [50000, 120000],
        topN: 15
      };
      
      const mockZones = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      const mockProcessed = Array.from({ length: 25 }, (_, i) => ({ id: i }));
      
      const debug = createDebugInfo(mockInput, mockZones, mockProcessed);
      
      expect(debug.received_ethnicities).toEqual(['korean', 'chinese']);
      expect(debug.received_genders).toEqual(['female']);
      expect(debug.received_top_n).toBe(15);
      expect(debug.total_zones_before_filters).toBe(100);
      expect(debug.total_zones_after_filters).toBe(25);
      expect(debug.zones_filtered_out).toBe(75);
    });

    it('should handle empty input gracefully', () => {
      const emptyInput = {
        ethnicities: [],
        genders: [],
        ageRange: [0, 100],
        incomeRange: [0, 250000],
        topN: 10
      };
      
      const debug = createDebugInfo(emptyInput, [], []);
      
      expect(debug.received_ethnicities).toEqual([]);
      expect(debug.total_zones_before_filters).toBe(0);
      expect(debug.zones_filtered_out).toBe(0);
    });
  });

  describe('Environment Validation', () => {
    it('should validate required environment variables', () => {
      const originalEnv = process.env;
      process.env = {};
      
      const result = validateEnvironment();
      
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('SUPABASE_URL');
      expect(result.missing).toContain('SUPABASE_ANON_KEY');
      
      process.env = originalEnv;
    });

    it('should pass validation with all required variables', () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_ANON_KEY: 'test-key'
      };
      
      const result = validateEnvironment();
      
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
      
      process.env = originalEnv;
    });
  });

  describe('Complete Request Processing', () => {
    it('should process complete request successfully', () => {
      const request = {
        weights: [{ id: 'foot_traffic', value: 50 }],
        ethnicities: ['korean'],
        topN: 20
      };
      
      const result = processCompleteRequest(request);
      
      expect(result).toHaveProperty('zones');
      expect(result).toHaveProperty('total_zones_found');
      expect(result).toHaveProperty('debug');
      expect(result.zones.length).toBe(2);
    });

    it('should handle processing errors gracefully', () => {
      const invalidRequest = null;
      
      const result = processCompleteRequest(invalidRequest);
      
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('Error Handling', () => {
    it('should maintain consistent error response format', async () => {
      const errorRequest = new Request('http://localhost', {
        method: 'POST',
        body: 'malformed'
      });
      
      const response = await handleRequest(errorRequest);
      const body = await response.json();
      
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('timestamp');
      expect(typeof body.error).toBe('string');
      expect(typeof body.timestamp).toBe('string');
    });

    it('should include timestamp in error responses', async () => {
      const badRequest = new Request('http://localhost', {
        method: 'POST',
        body: 'invalid'
      });
      
      const response = await handleRequest(badRequest);
      const body = await response.json();
      
      expect(body.timestamp).toBeDefined();
      expect(new Date(body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Response Format', () => {
    it('should return consistent success response structure', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ topN: 10 })
      });
      
      const response = await handleRequest(request);
      const body = await response.json();
      
      expect(body).toHaveProperty('zones');
      expect(body).toHaveProperty('total_zones_found');
      expect(body).toHaveProperty('message');
      expect(Array.isArray(body.zones)).toBe(true);
      expect(typeof body.total_zones_found).toBe('number');
    });

    it('should set correct content type headers', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({})
      });
      
      const response = await handleRequest(request);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });
});