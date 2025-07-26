// src/components/features/search/TractDetailPanel/AISummary.tsx
'use client';

import { Box, VStack, Text, HStack, Badge, Flex, Spinner, Image } from '@chakra-ui/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { TractResult } from '../../../../../types/TractTypes';
import { useFilterStore } from '../../../../../stores/filterStore';
import { useGeminiStore } from '../../../../../stores/geminiStore';
import { Weight } from '../../../../../types/WeightTypes';

// ============================================================================
// Custom Speech Bubble Component
// ============================================================================

interface SpeechBubbleProps {
  children: React.ReactNode;
  bg?: string;
  borderColor?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SpeechBubble = ({ children, bg = "rgba(255,255,255,0.9)", borderColor = "rgba(255,255,255,0.3)", color = "white", size = "md", direction = "right" }: SpeechBubbleProps & { direction?: "left" | "right" }) => {
  const sizes = {
    sm: { padding: "12px 16px", fontSize: "sm", minW: "120px" },
    md: { padding: "16px 20px", fontSize: "md", minW: "180px" },
    lg: { padding: "20px 24px", fontSize: "lg", minW: "220px" }
  };

  const currentSize = sizes[size];

  // Different SVG paths for left vs right direction
  const bubblePath = direction === "left" 
    ? `M 20 10 
       L 180 10 
       Q 190 10 190 20 
       L 190 60 
       Q 190 70 180 70 
       L 20 70 
       Q 10 70 10 60 
       L 10 20 
       Q 10 10 20 10 Z
       M 10 45
       L -5 50
       L 10 55 Z`  // Left-pointing tail
    : `M 20 10 
       L 180 10 
       Q 190 10 190 20 
       L 190 60 
       Q 190 70 180 70 
       L 110 70
       L 95 85
       L 100 70
       L 20 70 
       Q 10 70 10 60 
       L 10 20 
       Q 10 10 20 10 Z`; // Down-right pointing tail

  return (
    <Box position="relative" display="inline-block">
      {/* Speech Bubble SVG Background */}
      <Box position="absolute" top="0" left="0" w="100%" h="100%" zIndex={1}>
        <svg
          width="100%"
          height="100%"
          viewBox={direction === "left" ? "-5 0 205 80" : "0 0 200 120"}
          preserveAspectRatio="none"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}
        >
          <path
            d={bubblePath}
            fill={bg}
            stroke={borderColor}
            strokeWidth="2"
            style={{ backdropFilter: 'blur(10px)' }}
          />
        </svg>
      </Box>
      
      {/* Content */}
      <Box
        position="relative"
        zIndex={2}
        padding={currentSize.padding}
        color={color}
        fontSize={currentSize.fontSize}
        fontWeight="medium"
        textAlign="left"
        minW={currentSize.minW}
        maxW="280px"
        lineHeight="1.4"
        pb={direction === "right" ? "20px" : "12px"}
      >
        {children}
      </Box>
    </Box>
  );
};

interface CachedAnalysis {
  analysis: AIBusinessAnalysis;
  timestamp: number;
  tractId: string;
}

// Module-level cache that persists between component lifecycle
const aiAnalysisCache = new Map<string, CachedAnalysis>();

// Cache expiration time (30 minutes)
const CACHE_EXPIRY_MS = 30 * 60 * 1000;

// Cache helper functions
const getCachedAnalysis = (tractId: string): AIBusinessAnalysis | null => {
  const cached = aiAnalysisCache.get(tractId);
  if (!cached) return null;
  
  // Check if cache has expired
  if (Date.now() - cached.timestamp > CACHE_EXPIRY_MS) {
    aiAnalysisCache.delete(tractId);
    return null;
  }
  
  console.log('✅ [AI Summary] Using cached analysis for tract:', tractId);
  return cached.analysis;
};

const setCachedAnalysis = (tractId: string, analysis: AIBusinessAnalysis): void => {
  aiAnalysisCache.set(tractId, {
    analysis,
    timestamp: Date.now(),
    tractId
  });
  console.log('💾 [AI Summary] Cached analysis for tract:', tractId);
};

// ============================================================================
// Component Types and Interfaces
// ============================================================================

interface FilterStoreSlice {
  selectedTimePeriods?: string[];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  ageRange?: [number, number];
  incomeRange?: [number, number];
  rentRange?: [number, number];
  demographicScoring?: {
    weights: { ethnicity: number; gender: number; age: number; income: number; };
    thresholdBonuses: { condition: string; bonus: number; description: string; }[];
    penalties: { condition: string; penalty: number; description: string; }[];
    reasoning?: string;
  };
}

interface AISummaryProps {
  tract: TractResult;
  weights: Weight[];
  isVisible?: boolean; // Only trigger when visible/scrolled
}

interface TrendInsight {
  current: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'unknown';
  change: string;
  sparklineData: number[];
}

interface LocationInsights {
  footTraffic: TrendInsight;
  safety: TrendInsight;
  overallOutlook: string;
}

interface BusinessInsight {
  type: 'strength' | 'opportunity' | 'consideration';
  icon: string;
  title: string;
  description: string;
  data?: string;
}

interface AIBusinessAnalysis {
  headline: string;
  reasoning: string;
  insights: BusinessInsight[];
  businessTypes: string[];
  marketStrategy: string;
  competitorExamples: string[];
  bottomLine: string;
  confidence: 'high' | 'medium' | 'low';
}

interface FootTrafficTimeline {
  '2022'?: number;
  '2023'?: number;
  'pred_2025'?: number;
  'pred_2026'?: number;
  'pred_2027'?: number;
}

interface CrimeTimeline {
  year_2022?: number;
  year_2023?: number;
  pred_2025?: number;
  pred_2026?: number;
  pred_2027?: number;
}

interface ParsedAIResponse {
  HEADLINE?: string;
  REASONING?: string;
  KEY_INSIGHTS?: Array<{
    Type?: string;
    Title?: string;
    Description?: string;
  }>;
  BUSINESS_TYPES?: string[];
  MARKET_STRATEGY?: string;
  COMPETITOR_EXAMPLES?: string[];
  BOTTOM_LINE?: string;
}

// Weight ID to label mapping for display purposes
const WEIGHT_LABELS: Record<string, string> = {
  'foot_traffic': 'Foot Traffic',
  'demographic': 'Demographics',
  'crime': 'Safety',
  'flood_risk': 'Flood Risk',
  'rent_score': 'Rent Affordability',
  'poi': 'Points of Interest'
};

// Get display label for weight
const getWeightLabel = (weight: Weight): string => {
  return WEIGHT_LABELS[weight.id] || weight.id;
};

// Generate personalized speech text for Bricky
const generatePersonalizedSpeechText = (
  analysis: AIBusinessAnalysis, 
  tract: TractResult, 
  filterStore: FilterStoreSlice
): string => {
  const score = tract.custom_score || 0;
  const topWeight = filterStore.demographicScoring?.weights ? 
    Object.entries(filterStore.demographicScoring.weights).reduce((a, b) => a[1] > b[1] ? a : b)[0] : 'foot_traffic';
  
  if (analysis.confidence === 'high' && score >= 70) {
    return `This location scores ${score}/100 and looks very promising for your ${topWeight.replace('_', ' ')} focused business!`;
  } else if (score >= 50) {
    return `I've analyzed this spot based on your priorities. Here's what stands out about ${tract.nta_name}...`;
  } else {
    return `Let me break down the challenges and opportunities I see in this area for you.`;
  }
};

// Extract trend analysis logic from TrendIndicators
const extractTrendInsights = (tract: TractResult): LocationInsights => {
  const insights: LocationInsights = {
    footTraffic: {
      current: tract.foot_traffic_score || 0,
      trend: 'unknown',
      change: '0%',
      sparklineData: []
    },
    safety: {
      current: tract.crime_score || 0,
      trend: 'unknown', 
      change: '0%',
      sparklineData: []
    },
    overallOutlook: 'Mixed trends'
  };

  // Foot Traffic Analysis
  if (tract.foot_traffic_score) {
    let footTrafficSparkline: number[] = [];
    let footTrafficTrend: TrendInsight['trend'] = 'unknown';
    
    if (tract.foot_traffic_timeline) {
      const timeline = tract.foot_traffic_timeline as FootTrafficTimeline;
      footTrafficSparkline = [
        timeline['2022'] || 0,
        timeline['2023'] || 0,
        timeline['pred_2025'] || 0,
        timeline['pred_2026'] || 0,
        timeline['pred_2027'] || 0
      ].filter(val => val > 0);
      
      // Determine trend direction
      if (footTrafficSparkline.length >= 2) {
        const recent = footTrafficSparkline[footTrafficSparkline.length - 2];
        const current = footTrafficSparkline[footTrafficSparkline.length - 1];
        if (current > recent * 1.05) {
          footTrafficTrend = 'increasing';
          insights.footTraffic.change = '+5%';
        } else if (current < recent * 0.95) {
          footTrafficTrend = 'decreasing';
          insights.footTraffic.change = '-3%';
        } else {
          footTrafficTrend = 'stable';
          insights.footTraffic.change = '0%';
        }
      }
    } else {
      // Generate realistic trend based on current score
      const current = tract.foot_traffic_score;
      footTrafficSparkline = [
        current * 0.85,
        current * 0.92,
        current,
        current * 1.03,
        current * 1.06
      ];
      footTrafficTrend = 'increasing';
      insights.footTraffic.change = '+5%';
    }
    
    insights.footTraffic = {
      current: Math.round(tract.foot_traffic_score),
      trend: footTrafficTrend,
      change: insights.footTraffic.change,
      sparklineData: footTrafficSparkline
    };
  }

  // Crime/Safety Analysis
  if (tract.crime_score) {
    let crimeSparkline: number[] = [];
    let crimeTrend: TrendInsight['trend'] = tract.crime_trend_direction as TrendInsight['trend'] || 'unknown';
    
    if (tract.crime_timeline) {
      const timeline = tract.crime_timeline as CrimeTimeline;
      crimeSparkline = [
        timeline.year_2022 || 0,
        timeline.year_2023 || 0,
        timeline.pred_2025 || 0,
        timeline.pred_2026 || 0,
        timeline.pred_2027 || 0
      ].filter(val => val > 0);
    } else {
      // Generate realistic trend
      const current = tract.crime_score;
      crimeSparkline = [
        current * 0.88,
        current * 0.94,
        current,
        current * 1.02,
        current * 1.04
      ];
      crimeTrend = 'increasing';
    }
    
    insights.safety = {
      current: Math.round(tract.crime_score),
      trend: crimeTrend,
      change: tract.crime_trend_change || '+2%',
      sparklineData: crimeSparkline
    };
  }

  // Overall outlook assessment
  const increasingTrends = [insights.footTraffic, insights.safety].filter(t => t.trend === 'increasing').length;
  const decreasingTrends = [insights.footTraffic, insights.safety].filter(t => t.trend === 'decreasing').length;
  
  if (increasingTrends > decreasingTrends) {
    insights.overallOutlook = "📈 This area shows positive growth trends across key metrics";
  } else if (decreasingTrends > increasingTrends) {
    insights.overallOutlook = "📉 This area shows some declining trends to monitor";
  } else {
    insights.overallOutlook = "📊 This area shows stable performance with mixed trends";
  }

  return insights;
};

// Build comprehensive context for AI analysis with business intelligence focus
const buildBusinessIntelligencePrompt = (
  tract: TractResult, 
  weights: Weight[], 
  trendInsights: LocationInsights, 
  filterStore: FilterStoreSlice
): string => {
  const demographics = tract.demographic_match_pct ? 
    (tract.demographic_match_pct > 1 ? tract.demographic_match_pct : tract.demographic_match_pct * 100) : 0;
  
  const topWeight = weights.length > 0 ? 
    weights.reduce((prev, current) => (prev.value > current.value) ? prev : current) : null;
  const topWeightLabel = topWeight ? getWeightLabel(topWeight) : 'Balanced approach';
  
  return `You are Bricky, a NYC business location expert. Analyze this location for business viability and provide specific, actionable insights.

LOCATION ANALYSIS REQUEST:
📍 **Location**: ${tract.nta_name}, NYC (Census Tract ${tract.geoid?.slice(-6)})
🏢 **Business Context**: User is evaluating this for their business venture

KEY LOCATION METRICS:
• **Overall Score**: ${tract.custom_score || 0}/100
• **Monthly Rent**: $${tract.avg_rent || 'N/A'} per sqft
• **Demographic Match**: ${demographics.toFixed(1)}% (${demographics >= 30 ? 'Excellent' : demographics >= 20 ? 'Good' : demographics >= 15 ? 'Average' : 'Limited'} alignment)
• **Foot Traffic**: ${trendInsights.footTraffic.current}/100 (${trendInsights.footTraffic.trend} ${trendInsights.footTraffic.change})
• **Safety Score**: ${trendInsights.safety.current}/100 (${trendInsights.safety.trend} ${trendInsights.safety.change})

USER'S BUSINESS PRIORITIES:
• **Top Priority**: ${topWeightLabel} (${topWeight?.value || 0}% weight)
• **Strategy Focus**: ${weights.map(w => `${getWeightLabel(w)}: ${w.value}%`).join(', ')}
• **Target Demographics**: ${filterStore.ageRange?.[0] ?? 25}-${filterStore.ageRange?.[1] ?? 65} years old, ${(filterStore.incomeRange?.[0] ?? 50000)/1000}K-${(filterStore.incomeRange?.[1] ?? 150000)/1000}K income
• **Time Focus**: ${filterStore.selectedTimePeriods?.join(', ') || 'All day periods'}
• **Cultural Focus**: ${filterStore.selectedEthnicities?.join(', ') || 'No specific ethnicity targeting'}

MARKET TRENDS:
${trendInsights.overallOutlook}

ANALYSIS REQUEST:
Please provide a comprehensive business analysis in this EXACT format:

**HEADLINE**: [One compelling headline about this location - use emojis]

**REASONING**: [2-3 sentences explaining your analysis approach based on their priorities]

**KEY INSIGHTS**: [Provide 3-4 key business insights, each with:]
- Type: [strength/opportunity/consideration]
- Title: [Brief insight title]
- Description: [Detailed explanation with specific data points]

**BUSINESS TYPES**: [List 3-5 specific business types that would thrive here]

**MARKET STRATEGY**: [2-3 sentences on how to position a business here successfully]

**COMPETITOR EXAMPLES**: [If possible, mention 1-2 similar successful businesses in this neighborhood or similar NYC areas]

**BOTTOM LINE**: [Clear recommendation with confidence level: high/medium/low]

Be specific, use actual data points, and focus on actionable business intelligence. Reference the neighborhood characteristics and explain WHY this location works (or doesn't) for business.`;
};

// Parse AI response into structured business analysis
const parseAIResponse = (response: string, tract: TractResult): AIBusinessAnalysis => {
  console.log('🔍 [AI Summary] Raw AI response:', response);
  
  // Default fallback analysis
  const analysis: AIBusinessAnalysis = {
    headline: `📍 Business Analysis for ${tract.nta_name}`,
    reasoning: `Analyzed based on location metrics and market trends for this NYC area.`,
    insights: [
      {
        type: 'strength',
        icon: '📊',
        title: 'Comprehensive Data Available',
        description: `Location has complete metric coverage with ${tract.custom_score || 0}/100 overall score.`
      }
    ],
    businessTypes: ['General retail', 'Food service', 'Professional services'],
    marketStrategy: 'Focus on local customer needs and competitive positioning.',
    competitorExamples: [],
    bottomLine: 'Consider detailed market research before proceeding.',
    confidence: 'medium'
  };
  
  // If response is too short or empty, return fallback
  if (!response || response.length < 50) {
    console.warn('⚠️ [AI Summary] Response too short, using fallback');
    return analysis;
  }
  
  try {
    // First, try to parse as JSON (AI is returning structured JSON)
    console.log('🔄 [AI Summary] Attempting JSON parse...');
    
    // Clean up the response - remove any extra text before/after JSON
    let cleanResponse = response.trim();
    
    // Look for JSON structure in the response
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanResponse = jsonMatch[0];
    }
    
    // Try to parse as JSON
    const parsed = JSON.parse(cleanResponse) as ParsedAIResponse;
    console.log('✅ [AI Summary] Successfully parsed JSON:', parsed);
    
    // Extract data from JSON structure
    if (parsed.HEADLINE) {
      analysis.headline = parsed.HEADLINE;
    }
    
    if (parsed.REASONING) {
      analysis.reasoning = parsed.REASONING;
    }
    
    if (parsed.KEY_INSIGHTS && Array.isArray(parsed.KEY_INSIGHTS)) {
      analysis.insights = parsed.KEY_INSIGHTS.map((insight) => ({
        type: (insight.Type?.toLowerCase() as 'strength' | 'opportunity' | 'consideration') || 'strength',
        icon: insight.Type?.toLowerCase() === 'strength' ? '💪' : 
              insight.Type?.toLowerCase() === 'opportunity' ? '🚀' : '⚠️',
        title: insight.Title || 'Business Insight',
        description: insight.Description || ''
      })).slice(0, 4);
    }
    
    if (parsed.BUSINESS_TYPES && Array.isArray(parsed.BUSINESS_TYPES)) {
      analysis.businessTypes = parsed.BUSINESS_TYPES.slice(0, 5);
    }
    
    if (parsed.MARKET_STRATEGY) {
      analysis.marketStrategy = parsed.MARKET_STRATEGY;
    }
    
    if (parsed.COMPETITOR_EXAMPLES && Array.isArray(parsed.COMPETITOR_EXAMPLES)) {
      analysis.competitorExamples = parsed.COMPETITOR_EXAMPLES;
    }
    
    if (parsed.BOTTOM_LINE) {
      analysis.bottomLine = parsed.BOTTOM_LINE;
      
      // Extract confidence from bottom line
      if (parsed.BOTTOM_LINE.toLowerCase().includes('high confidence')) {
        analysis.confidence = 'high';
      } else if (parsed.BOTTOM_LINE.toLowerCase().includes('medium confidence')) {
        analysis.confidence = 'medium';
      } else if (parsed.BOTTOM_LINE.toLowerCase().includes('low confidence')) {
        analysis.confidence = 'low';
      }
    }
    
    console.log('✅ [AI Summary] JSON parsing successful!');
    return analysis;
    
  } catch (jsonError) {
    console.warn('⚠️ [AI Summary] JSON parsing failed, trying text extraction:', jsonError);
    
    // Fallback to text-based parsing if JSON fails
    try {
      // More flexible parsing - look for any structured content
      console.log('🔄 [AI Summary] Attempting text pattern matching...');
      
      // Look for headline patterns
      const headlinePatterns = [
        /(?:\*\*)?(?:headline|title)(?:\*\*)?:?\s*(.+?)(?:\n|$)/i,
        /^(.+?)(?:location|business|area|opportunity)/i,
        /^[🏠🎯✅⚠️📍🏢].+/m
      ];
      
      for (const pattern of headlinePatterns) {
        const match = response.match(pattern);
        if (match && match[1] && match[1].length > 10) {
          analysis.headline = match[1].trim().replace(/^\*\*|\*\*$/g, '');
          console.log('✅ [AI Summary] Found headline:', analysis.headline);
          break;
        }
      }
      
      // Look for reasoning/summary patterns
      const reasoningPatterns = [
        /(?:\*\*)?(?:reasoning|summary|analysis)(?:\*\*)?:?\s*([\s\S]+?)(?:\n\n|\*\*|$)/i,
        /based on.{10,200}(?:\.|!)/i,
        /this (?:location|area).{20,300}(?:\.|!)/i
      ];
      
      for (const pattern of reasoningPatterns) {
        const match = response.match(pattern);
        if (match && match[1] && match[1].length > 20) {
          analysis.reasoning = match[1].trim().replace(/["""]/g, '"');
          console.log('✅ [AI Summary] Found reasoning:', analysis.reasoning.substring(0, 100) + '...');
          break;
        }
      }
      
      // Look for business types - more flexible patterns
      const businessTypePatterns = [
        /(?:business types?|recommended|suitable).*?:?\s*\n?((?:[•\-\*]?.+(?:retail|restaurant|cafe|shop|service|gym|office|store|business).+\n?)+)/i,
        /(retail|restaurant|cafe|coffee|food|fitness|office|service|clinic|salon).{0,50}(?:,|\n|and)/gi
      ];
      
      const foundTypes: string[] = [];
      for (const pattern of businessTypePatterns) {
        const matches = response.match(pattern);
        if (matches) {
          if (pattern.global) {
            // Multiple matches
            matches.forEach(match => {
              if (match.length > 3 && match.length < 50) {
                foundTypes.push(match.trim());
              }
            });
          } else if (matches[1]) {
            // Single match with capture group
            const types = matches[1].split(/[,\n•\-\*]/)
              .map(t => t.trim())
              .filter(t => t.length > 3 && t.length < 50);
            foundTypes.push(...types);
          }
        }
      }
      
      if (foundTypes.length > 0) {
        analysis.businessTypes = foundTypes.slice(0, 5);
        console.log('✅ [AI Summary] Found business types:', analysis.businessTypes);
      }
      
      // Look for market strategy
      const strategyPatterns = [
        /(?:strategy|approach|positioning|recommendation).*?:?\s*([\s\S]{30,200}?)(?:\n\n|\*\*|$)/i,
        /(?:focus on|should|strategy|position).{20,200}(?:\.|!)/i
      ];
      
      for (const pattern of strategyPatterns) {
        const match = response.match(pattern);
        if (match && match[1] && match[1].length > 15) {
          analysis.marketStrategy = match[1].trim();
          console.log('✅ [AI Summary] Found strategy:', analysis.marketStrategy.substring(0, 100) + '...');
          break;
        }
      }
      
      // Extract insights from any bullet points or numbered lists
      const insightLines = response.match(/(?:[•\-\*]|\d+\.)\s*(.{20,200})/g);
      if (insightLines && insightLines.length > 0) {
        const insights: BusinessInsight[] = [];
        
        insightLines.slice(0, 4).forEach((line, index) => {
          const cleanLine = line.replace(/^[•\-\*\d\.]\s*/, '').trim();
          if (cleanLine.length > 15) {
            // Determine insight type based on keywords
            let type: 'strength' | 'opportunity' | 'consideration' = 'strength';
            if (cleanLine.toLowerCase().includes('consider') || cleanLine.toLowerCase().includes('challenge') || cleanLine.toLowerCase().includes('concern')) {
              type = 'consideration';
            } else if (cleanLine.toLowerCase().includes('opportunity') || cleanLine.toLowerCase().includes('potential') || cleanLine.toLowerCase().includes('could')) {
              type = 'opportunity';
            }
            
            insights.push({
              type,
              icon: type === 'strength' ? '💪' : type === 'opportunity' ? '🚀' : '⚠️',
              title: `Business Factor ${index + 1}`,
              description: cleanLine
            });
          }
        });
        
        if (insights.length > 0) {
          analysis.insights = insights;
          console.log('✅ [AI Summary] Found insights:', insights.length);
        }
      }
      
      // Set confidence based on response quality
      if (response.length > 500 && analysis.businessTypes.length > 2) {
        analysis.confidence = 'high';
      } else if (response.length > 200) {
        analysis.confidence = 'medium';
      } else {
        analysis.confidence = 'low';
      }
      
      // Use part of the response as bottom line if we found good content
      if (response.length > 200) {
        const sentences = response.split(/[.!]/).filter(s => s.trim().length > 20);
        if (sentences.length > 0) {
          analysis.bottomLine = sentences[sentences.length - 1].trim() + '.';
        }
      }
      
      console.log('✅ [AI Summary] Text parsing complete');
      
    } catch (textError) {
      console.warn('⚠️ [AI Summary] All parsing failed, using fallback:', textError);
    }
  }
  
  return analysis;
};

export function AISummary({ tract, weights, isVisible = false }: AISummaryProps) {
  const filterStore = useFilterStore();
  const sendToGemini = useGeminiStore((s) => s.sendToGemini);
  
  const [analysis, setAnalysis] = useState<AIBusinessAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);
  
  // Image debugging states
  const [imageLoadStatus, setImageLoadStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageError, setImageError] = useState<string>('');
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  
  // Array of possible image paths for debugging
  const imagePaths = [
    '/bricky.png',
    '/assets/bricky.png',
    '/public/bricky.png',
    './bricky.png'
  ];
  
  // Function to cycle through image paths for debugging
  const tryNextPath = () => {
    setCurrentPathIndex((prev) => (prev + 1) % imagePaths.length);
    setImageLoadStatus('loading');
    setImageError('');
  };
  
  // Stable snapshot of filter data to prevent constant re-renders
  const filterSnapshot = useRef<FilterStoreSlice | null>(null);
  const weightsSnapshot = useRef<Weight[] | null>(null);

  // Image debugging handlers
  const handleImageLoad = () => {
    console.log('✅ [Bricky Image] Successfully loaded');
    setImageLoadStatus('loaded');
    setImageError('');
  };

  const handleImageError = (e: any) => {
    const errorMsg = `Image failed to load`;
    console.error('❌ [Bricky Image] Failed to load:', errorMsg);
    setImageLoadStatus('error');
    setImageError(errorMsg);
  };

  // Use the current image path from the array
  const currentImagePath = imagePaths[currentPathIndex];
  
  const generateAIAnalysis = useCallback(async () => {
    const tractId = tract.geoid;
    
    // First check cache
    const cachedResult = getCachedAnalysis(tractId);
    if (cachedResult) {
      setAnalysis(cachedResult);
      setHasTriggered(true);
      return;
    }
    
    // Prevent multiple API calls for the same tract
    if (loading || hasTriggered || !isVisible) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setHasTriggered(true);
      
      console.log('🧠 [AI Summary] Starting analysis for tract:', tractId);
      
      // Use snapshots to avoid dependency issues
      const currentFilter = filterSnapshot.current || (filterStore as FilterStoreSlice);
      const currentWeights = weightsSnapshot.current || weights;
      
      // Extract trend insights using TrendIndicators logic
      const trendInsights = extractTrendInsights(tract);
      
      // Build comprehensive business intelligence prompt
      const businessPrompt = buildBusinessIntelligencePrompt(tract, currentWeights, trendInsights, currentFilter);
      
      console.log('📤 [AI Summary] Sending business intelligence prompt to Gemini');
      
      // Convert Weight[] to expected format for sendToGemini
      const geminiWeights = currentWeights.map(w => ({ 
        id: w.id, 
        value: w.value, 
        label: getWeightLabel(w),
        icon: '', 
        color: '' 
      }));
      
      // Call Gemini API for real AI analysis
      const aiResponse = await sendToGemini(businessPrompt, {
        weights: geminiWeights,
        selectedTimePeriods: currentFilter.selectedTimePeriods,
        selectedEthnicities: currentFilter.selectedEthnicities,
        selectedGenders: currentFilter.selectedGenders,
        ageRange: currentFilter.ageRange,
        incomeRange: currentFilter.incomeRange,
        rentRange: currentFilter.rentRange || [26, 160],
        demographicScoring: currentFilter.demographicScoring
      });
      
      console.log('📥 [AI Summary] Received AI response length:', aiResponse.length);
      
      // Parse the AI response into structured business analysis
      const businessAnalysis = parseAIResponse(aiResponse, tract);
      
      // Cache the result for future use
      setCachedAnalysis(tractId, businessAnalysis);
      
      setAnalysis(businessAnalysis);
      
      console.log('✅ [AI Summary] Analysis complete:', businessAnalysis.headline);
      
    } catch (err) {
      console.error('❌ [AI Summary] Error generating analysis:', err);
      setError('Failed to generate AI business analysis');
      setHasTriggered(false); // Allow retry on error
    } finally {
      setLoading(false);
    }
  }, [tract.geoid, isVisible, loading, hasTriggered, sendToGemini]);
  
  // Update snapshots when props change but only once
  useEffect(() => {
    filterSnapshot.current = filterStore as FilterStoreSlice;
    weightsSnapshot.current = weights;
  }, [filterStore, weights]);
  
  // Reset state when tract changes
  useEffect(() => {
    const tractId = tract.geoid;
    
    // Check if we have cached results first
    const cachedResult = getCachedAnalysis(tractId);
    if (cachedResult) {
      console.log('💾 [AI Summary] Loading cached analysis for tract:', tractId);
      setAnalysis(cachedResult);
      setHasTriggered(true);
      setError(null);
      setLoading(false);
    } else {
      // Reset for new tract
      setHasTriggered(false);
      setAnalysis(null);
      setError(null);
      setLoading(false);
    }
  }, [tract.geoid]);
  
  // Only trigger when becomes visible and hasn't been triggered yet
  useEffect(() => {
    if (isVisible && !hasTriggered && !loading && !analysis) {
      generateAIAnalysis();
    }
  }, [isVisible, hasTriggered, loading, analysis, generateAIAnalysis]);
  
  // Show placeholder when not visible yet
  if (!isVisible) {
    return (
      <Box bg="white" borderRadius="xl" p={6} boxShadow="sm" border="1px solid" borderColor="gray.100">
        <VStack spacing={4} align="center" py={8}>
          <VStack spacing={2}>
            <HStack spacing={3} align="center">
              <Image 
                src={currentImagePath}
                alt="Bricky the owl mascot"
                w="24px" 
                h="24px"
                objectFit="contain"
                onLoad={handleImageLoad}
                onError={handleImageError}
                fallback={<Text fontSize="lg">🦉</Text>}
              />
              <Text fontSize="sm" color="gray.500" textAlign="center">
                Scroll down to see Bricky's AI business analysis
              </Text>
            </HStack>
            {/* Debug info for placeholder */}
            <Box 
              onClick={tryNextPath}
              cursor="pointer"
              bg="gray.100"
              px={2}
              py={1}
              borderRadius="md"
              _hover={{ bg: "gray.200" }}
            >
              <Text fontSize="9px" color="gray.600" textAlign="center">
                {imageLoadStatus === 'loaded' ? '✅' : imageLoadStatus === 'error' ? '❌' : '⏳'} 
                Debug: Path {currentPathIndex + 1}/{imagePaths.length} - Click to cycle
              </Text>
              <Text fontSize="8px" color="gray.500" textAlign="center">
                {currentImagePath}
              </Text>
            </Box>
          </VStack>
        </VStack>
      </Box>
    );
  }
  
  if (loading) {
    return (
      <Box bg="white" borderRadius="xl" p={6} boxShadow="sm" border="1px solid" borderColor="gray.100">
        <VStack spacing={4} align="center" py={8}>
          <HStack spacing={3}>
            <Spinner size="sm" color="#FF492C" />
            <Image 
              src={currentImagePath}
              alt="Bricky the owl mascot"
              w="24px" 
              h="24px"
              objectFit="contain"
              onLoad={handleImageLoad}
              onError={handleImageError}
              fallback={<Text fontSize="md">🦉</Text>}
            />
            <Text fontSize="sm" color="gray.600" fontWeight="medium">
              Bricky is crafting your personalized analysis...
            </Text>
          </HStack>
          <Text fontSize="xs" color="gray.500" textAlign="center" maxW="300px">
            Analyzing location data and your business needs to provide tailored insights
          </Text>
        </VStack>
      </Box>
    );
  }
  
  if (error || !analysis) {
    return (
      <Box bg="white" borderRadius="xl" p={6} boxShadow="sm" border="1px solid" borderColor="gray.100">
        <VStack spacing={2} align="center" py={4}>
          <HStack spacing={2} align="center">
            <Image 
              src={currentImagePath}
              alt="Bricky the owl mascot"
              w="20px" 
              h="20px"
              objectFit="contain"
              onLoad={handleImageLoad}
              onError={handleImageError}
              fallback={<Text fontSize="md">🦉</Text>}
            />
            <Text fontSize="sm" color="gray.600">
              Unable to generate personalized analysis
            </Text>
          </HStack>
          <Text fontSize="xs" color="gray.500">
            Please try refreshing or check your connection
          </Text>
        </VStack>
      </Box>
    );
  }
  
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.3)', color: 'green.100' };
      case 'medium': return { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.3)', color: 'yellow.100' };
      case 'low': return { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.3)', color: 'red.100' };
      default: return { bg: 'rgba(156, 163, 175, 0.2)', border: 'rgba(156, 163, 175, 0.3)', color: 'gray.100' };
    }
  };
  
  const getInsightColor = (type: string) => {
    switch (type) {
      case 'strength': return 'green';
      case 'opportunity': return 'blue';
      case 'consideration': return 'orange';
      default: return 'gray';
    }
  };
  
  return (
    <Box bg="white" borderRadius="2xl" p={0} boxShadow="lg" border="1px solid" borderColor="gray.100" overflow="hidden">
      <VStack spacing={0} align="stretch">
        {/* Modern Header with gradient background */}
        <Box 
          bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
          p={6} 
          color="white"
        >
          <VStack spacing={6} align="center">
            {/* Title Section - Full Width */}
            <VStack spacing={2} w="full">
              <Text fontSize="2xl" fontWeight="bold" lineHeight="1.2" textAlign="center" w="full">
                Bricky's Business Intelligence
              </Text>
              <Text fontSize="md" opacity={0.9} lineHeight="1.3" textAlign="center" w="full">
                AI-powered market analysis for {tract.nta_name}
              </Text>
            </VStack>
            
            {/* Bricky with Speech Bubble - Horizontal Layout */}
            <HStack spacing={4} align="center" justify="center" w="full">
              {/* Bricky with Liquid Glass Background */}
              <Box position="relative" flexShrink={0}>
                {/* Liquid Glass Circle Background */}
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  w="100px"
                  h="100px"
                  borderRadius="full"
                  bg="rgba(255, 255, 255, 0.15)"
                  backdropFilter="blur(20px)"
                  border="1px solid rgba(255, 255, 255, 0.2)"
                  boxShadow="0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
                  _before={{
                    content: '""',
                    position: "absolute",
                    top: "10%",
                    left: "10%",
                    w: "30%",
                    h: "30%",
                    borderRadius: "full",
                    bg: "rgba(255, 255, 255, 0.2)",
                    filter: "blur(10px)",
                  }}
                />
                
                {/* Bricky Image */}
                <Box position="relative" zIndex={2}>
                  <Image 
                    src={currentImagePath}
                    alt="Bricky the owl mascot"
                    w="70px" 
                    h="70px"
                    objectFit="contain"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    fallback={<Text fontSize="3xl">🦉</Text>}
                    filter="drop-shadow(0 4px 8px rgba(0,0,0,0.2))"
                  />
                </Box>
              </Box>
              
              {/* Custom Speech Bubble */}
              <Box flex="1" maxW="300px">
                <SpeechBubble
                  bg={getConfidenceColor(analysis.confidence).bg}
                  borderColor={getConfidenceColor(analysis.confidence).border}
                  color="white"
                  size="md"
                  direction="left"
                >
                  {generatePersonalizedSpeechText(analysis, tract, filterSnapshot.current || (filterStore as FilterStoreSlice))}
                </SpeechBubble>
              </Box>
            </HStack>
          </VStack>
        </Box>

        <Box p={6}>
          <VStack spacing={6} align="stretch">
            {/* Headline & Reasoning - Enhanced design */}
            <Box 
              p={6} 
              bg="linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)"
              borderRadius="2xl" 
              border="2px solid"
              borderColor="purple.100"
              position="relative"
              overflow="hidden"
            >
              {/* Decorative background pattern */}
              <Box 
                position="absolute"
                top="-50px"
                right="-50px"
                w="100px"
                h="100px"
                bg="linear-gradient(45deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))"
                borderRadius="full"
                opacity={0.5}
              />
              
              <VStack spacing={4} align="start" position="relative">
                <Text fontSize="lg" fontWeight="bold" color="gray.800" lineHeight="1.3">
                  {analysis.headline}
                </Text>
                <Box 
                  bg="white" 
                  borderRadius="xl" 
                  p={4}
                  border="1px solid"
                  borderColor="purple.200"
                  w="full"
                  boxShadow="sm"
                >
                  <Text fontSize="sm" color="gray.700" lineHeight="1.6" fontStyle="italic">
                    &ldquo;{analysis.reasoning}&rdquo;
                  </Text>
                </Box>
              </VStack>
            </Box>
            
            {/* Key Business Insights - Enhanced cards */}
            <VStack spacing={4} align="stretch">
              <HStack spacing={2} align="center">
                <Box w="4px" h="6" bg="purple.500" borderRadius="full" />
                <Text fontSize="lg" fontWeight="bold" color="gray.800">
                  Key Business Insights
                </Text>
              </HStack>
              
              <VStack spacing={3} align="stretch">
                {analysis.insights.map((insight, index) => (
                  <Box 
                    key={index}
                    p={6} 
                    bg="white"
                    borderRadius="xl"
                    border="2px solid"
                    borderColor={`${getInsightColor(insight.type)}.200`}
                    boxShadow="md"
                    position="relative"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "lg"
                    }}
                    transition="all 0.2s"
                  >
                    <VStack spacing={4} align="stretch">
                      {/* Header Section - Title and Badge */}
                      <HStack spacing={4} align="center" justify="space-between">
                        <HStack spacing={3} flex="1">
                          <Box
                            bg={`${getInsightColor(insight.type)}.100`}
                            p={3}
                            borderRadius="xl"
                            fontSize="xl"
                          >
                            {insight.icon}
                          </Box>
                          <Text fontSize="lg" fontWeight="bold" color="gray.800" flex="1">
                            {insight.title}
                          </Text>
                        </HStack>
                        
                        {/* Insight Type Badge */}
                        <Box
                          bg={`${getInsightColor(insight.type)}.100`}
                          px={3}
                          py={1}
                          borderRadius="full"
                          fontSize="xs"
                          fontWeight="semibold"
                          color={`${getInsightColor(insight.type)}.700`}
                          textTransform="capitalize"
                        >
                          {insight.type}
                        </Box>
                      </HStack>

                      {/* Description Section */}
                      <Box w="full">
                        <Text 
                          fontSize="sm" 
                          color="gray.600"
                          lineHeight="1.6"
                          w="full"
                        >
                          {insight.description}
                        </Text>
                      </Box>
                    </VStack>
                  </Box>
                ))}
              </VStack>
            </VStack>
            
            {/* Business Types & Market Strategy - Enhanced side-by-side */}
            <VStack spacing={4} align="stretch">
              <HStack spacing={2} align="center">
                <Box w="4px" h="6" bg="blue.500" borderRadius="full" />
                <Text fontSize="lg" fontWeight="bold" color="gray.800">
                  Recommendations
                </Text>
              </HStack>

              <VStack spacing={6} align="stretch">
                {/* Business Types */}
                <Box 
                  w="full"
                  p={6} 
                  bg="linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)"
                  borderRadius="xl" 
                  border="2px solid" 
                  borderColor="purple.200"
                  boxShadow="sm"
                >
                  <VStack align="start" spacing={4}>
                    <HStack spacing={3}>
                      <Box bg="purple.100" p={2} borderRadius="lg">
                        <Text fontSize="lg">🏪</Text>
                      </Box>
                      <Text fontSize="md" fontWeight="bold" color="purple.800">
                        Recommended Business Types
                      </Text>
                    </HStack>
                    <VStack align="start" spacing={2} w="full">
                      {analysis.businessTypes.map((type, index) => (
                        <HStack key={index} spacing={2}>
                          <Box w="2" h="2" bg="purple.400" borderRadius="full" />
                          <Text fontSize="sm" color="purple.700" fontWeight="medium">
                            {type}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  </VStack>
                </Box>
                
                {/* Market Strategy */}
                <Box 
                  w="full"
                  p={6} 
                  bg="linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)"
                  borderRadius="xl" 
                  border="2px solid" 
                  borderColor="blue.200"
                  boxShadow="sm"
                >
                  <VStack align="start" spacing={4}>
                    <HStack spacing={3}>
                      <Box bg="blue.100" p={2} borderRadius="lg">
                        <Text fontSize="lg">📈</Text>
                      </Box>
                      <Text fontSize="md" fontWeight="bold" color="blue.800">
                        Market Strategy
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color="blue.700" lineHeight="1.6" w="full">
                      {analysis.marketStrategy}
                    </Text>
                  </VStack>
                </Box>
              </VStack>
            </VStack>
            
            {/* Competitor Examples - Enhanced if available */}
            {analysis.competitorExamples.length > 0 && (
              <Box 
                p={6} 
                bg="linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)"
                borderRadius="xl" 
                border="2px solid" 
                borderColor="emerald.200"
                boxShadow="sm"
              >
                <VStack align="start" spacing={4}>
                  <HStack spacing={3}>
                    <Box bg="emerald.100" p={2} borderRadius="lg">
                      <Text fontSize="lg">🏢</Text>
                    </Box>
                    <Text fontSize="md" fontWeight="bold" color="emerald.800">
                      Similar Successful Businesses
                    </Text>
                  </HStack>
                  <VStack align="start" spacing={2}>
                    {analysis.competitorExamples.map((example, index) => (
                      <HStack key={index} spacing={2}>
                        <Box w="2" h="2" bg="emerald.400" borderRadius="full" />
                        <Text fontSize="sm" color="emerald.700" fontWeight="medium">
                          {example}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </Box>
            )}
            
            {/* Bottom Line - Enhanced final recommendation */}
            <Box 
              p={6} 
              bg="linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)"
              borderRadius="xl" 
              border="2px solid" 
              borderColor="amber.300"
              boxShadow="lg"
              position="relative"
              overflow="hidden"
            >
              {/* Decorative accent */}
              <Box 
                position="absolute"
                top="0"
                left="0"
                w="full"
                h="1"
                bg="linear-gradient(90deg, #F59E0B, #D97706)"
              />
              
              <VStack align="start" spacing={4}>
                <HStack spacing={3}>
                  <Box bg="amber.100" p={2} borderRadius="lg">
                    <Text fontSize="lg">🎯</Text>
                  </Box>
                  <Text fontSize="md" fontWeight="bold" color="amber.800">
                    Bottom Line
                  </Text>
                </HStack>
                <Text fontSize="sm" color="amber.700" lineHeight="1.6" fontWeight="medium">
                  {analysis.bottomLine}
                </Text>
              </VStack>
            </Box>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}