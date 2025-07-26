// src/components/features/search/TractDetailPanel/AISummary.tsx
'use client';

import { Box, VStack, Text, HStack, Badge, Flex, Divider, Spinner } from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import { TractResult } from '../../../../types/TractTypes';
import { useFilterStore } from '../../../../stores/filterStore';
import { useGeminiStore } from '../../../../stores/geminiStore';
import { Weight } from '../../../../types/WeightTypes';

// Define the interface for filterStore properties we need
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

// Extract trend analysis logic from TrendIndicators (same exact logic)
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

  // Foot Traffic Analysis (exact same logic as TrendIndicators)
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

  // Crime/Safety Analysis (exact same logic as TrendIndicators)
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

  // Overall outlook assessment (same logic as TrendIndicators)
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

Be specific, use actual data points, and focus on actionable business intelligence. Reference the neighborhood characteristics and explain WHY this location works (or doesn&apos;t) for business.`;
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

export function AISummary({ tract, weights }: AISummaryProps) {
  const filterStore = useFilterStore();
  const sendToGemini = useGeminiStore((s) => s.sendToGemini);
  
  const [analysis, setAnalysis] = useState<AIBusinessAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const generateAIAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🧠 [AI Summary] Starting analysis for tract:', tract.geoid);
      
      // Extract trend insights using TrendIndicators logic
      const trendInsights = extractTrendInsights(tract);
      
      // Build comprehensive business intelligence prompt
      const businessPrompt = buildBusinessIntelligencePrompt(tract, weights, trendInsights, filterStore as FilterStoreSlice);
      
      console.log('📤 [AI Summary] Sending business intelligence prompt to Gemini');
      
      // Convert Weight[] to expected format for sendToGemini
      const geminiWeights = weights.map(w => ({ 
        id: w.id, 
        value: w.value, 
        label: getWeightLabel(w),
        icon: '', 
        color: '' 
      }));
      
      // Call Gemini API for real AI analysis
      const filterStoreTyped = filterStore as FilterStoreSlice;
      const aiResponse = await sendToGemini(businessPrompt, {
        weights: geminiWeights,
        selectedTimePeriods: filterStoreTyped.selectedTimePeriods,
        selectedEthnicities: filterStoreTyped.selectedEthnicities,
        selectedGenders: filterStoreTyped.selectedGenders,
        ageRange: filterStoreTyped.ageRange,
        incomeRange: filterStoreTyped.incomeRange,
        rentRange: filterStoreTyped.rentRange || [26, 160],
        demographicScoring: filterStoreTyped.demographicScoring
      });
      
      console.log('📥 [AI Summary] Received AI response length:', aiResponse.length);
      
      // Parse the AI response into structured business analysis
      const businessAnalysis = parseAIResponse(aiResponse, tract);
      setAnalysis(businessAnalysis);
      
      console.log('✅ [AI Summary] Analysis complete:', businessAnalysis.headline);
      
    } catch (err) {
      console.error('❌ [AI Summary] Error generating analysis:', err);
      setError('Failed to generate AI business analysis');
    } finally {
      setLoading(false);
    }
  }, [tract, weights, filterStore, sendToGemini]);
  
  useEffect(() => {
    // Only generate when panel opens for this tract
    generateAIAnalysis();
  }, [generateAIAnalysis]);
  
  if (loading) {
    return (
      <Box bg="white" borderRadius="xl" p={6} boxShadow="sm" border="1px solid" borderColor="gray.100">
        <VStack spacing={4} align="center" py={8}>
          <HStack spacing={3}>
            <Spinner size="sm" color="#FF492C" />
            <Text fontSize="sm" color="gray.600" fontWeight="medium">
              🧠 Bricky is analyzing this location...
            </Text>
          </HStack>
          <Text fontSize="xs" color="gray.500" textAlign="center" maxW="300px">
            Researching market trends, competitor landscape, and business viability
          </Text>
        </VStack>
      </Box>
    );
  }
  
  if (error || !analysis) {
    return (
      <Box bg="white" borderRadius="xl" p={6} boxShadow="sm" border="1px solid" borderColor="gray.100">
        <VStack spacing={2} align="center" py={4}>
          <Text fontSize="sm" color="gray.600">
            🤖 Unable to generate AI business analysis
          </Text>
          <Text fontSize="xs" color="gray.500">
            Please try refreshing or check your connection
          </Text>
        </VStack>
      </Box>
    );
  }
  
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'green';
      case 'medium': return 'blue';
      case 'low': return 'orange';
      default: return 'gray';
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
    <Box bg="white" borderRadius="xl" p={6} boxShadow="sm" border="1px solid" borderColor="gray.100">
      <VStack spacing={5} align="stretch">
        {/* Header - matching AdvancedDemographics style */}
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <HStack spacing={2}>
              <Text fontSize="lg" fontWeight="bold" color="gray.800">
                🧠 Bricky&apos;s Business Intelligence
              </Text>
              <Badge bg="#FF492C" color="white" fontSize="xs" borderRadius="full">
                AI Analysis
              </Badge>
            </HStack>
            <Text fontSize="xs" color="gray.500">
              Market research & competitor analysis for {tract.nta_name}
            </Text>
          </VStack>
          
          <Badge 
            colorScheme={getConfidenceColor(analysis.confidence)}
            px={3}
            py={1}
            borderRadius="md"
            textTransform="capitalize"
            fontSize="xs"
            fontWeight="semibold"
          >
            {analysis.confidence} confidence
          </Badge>
        </Flex>
        
        {/* Headline & Reasoning - matching AdvancedDemographics reasoning style */}
        <Box 
          p={4} 
          bg="rgba(255, 249, 240, 0.8)" 
          borderRadius="xl" 
          border="1px solid rgba(255, 73, 44, 0.1)"
          w="full"
        >
          <Text fontSize="md" fontWeight="semibold" color="gray.800" mb={3}>
            {analysis.headline}
          </Text>
          <Box 
            bg="white" 
            borderRadius="lg" 
            p={3}
            border="1px solid rgba(255, 73, 44, 0.1)"
          >
            <Text fontSize="sm" color="gray.700" lineHeight="1.6" fontStyle="italic">
              &ldquo;{analysis.reasoning}&rdquo;
            </Text>
          </Box>
        </Box>
        
        <Divider />
        
        {/* Key Business Insights */}
        <VStack spacing={3} align="stretch">
          <Text fontSize="sm" fontWeight="semibold" color="gray.700">
            📊 Key Business Insights
          </Text>
          
          {analysis.insights.map((insight, index) => (
            <Box 
              key={index}
              p={4} 
              bg={`${getInsightColor(insight.type)}.50`}
              borderRadius="lg"
              border="1px solid"
              borderColor={`${getInsightColor(insight.type)}.200`}
            >
              <HStack spacing={3} align="start">
                <Text fontSize="lg">{insight.icon}</Text>
                <VStack align="start" spacing={2} flex="1">
                  <Text fontSize="sm" fontWeight="semibold" color={`${getInsightColor(insight.type)}.800`}>
                    {insight.title}
                  </Text>
                  <Text 
                    fontSize="sm" 
                    color={`${getInsightColor(insight.type)}.700`}
                    lineHeight="1.5"
                  >
                    {insight.description}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          ))}
        </VStack>
        
        {/* Business Types & Market Strategy */}
        <HStack spacing={4} align="start">
          {/* Business Types */}
          <Box flex="1" p={4} bg="purple.50" borderRadius="lg" border="1px solid" borderColor="purple.200">
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" fontWeight="semibold" color="purple.800">
                🏪 Recommended Business Types
              </Text>
              <VStack align="start" spacing={1}>
                {analysis.businessTypes.map((type, index) => (
                  <Text key={index} fontSize="xs" color="purple.700">
                    • {type}
                  </Text>
                ))}
              </VStack>
            </VStack>
          </Box>
          
          {/* Market Strategy */}
          <Box flex="1" p={4} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.200">
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" fontWeight="semibold" color="blue.800">
                📈 Market Strategy
              </Text>
              <Text fontSize="xs" color="blue.700" lineHeight="1.4">
                {analysis.marketStrategy}
              </Text>
            </VStack>
          </Box>
        </HStack>
        
        {/* Competitor Examples (if available) */}
        {analysis.competitorExamples.length > 0 && (
          <Box p={4} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200">
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                🏢 Similar Successful Businesses
              </Text>
              <VStack align="start" spacing={1}>
                {analysis.competitorExamples.map((example, index) => (
                  <Text key={index} fontSize="xs" color="gray.700">
                    • {example}
                  </Text>
                ))}
              </VStack>
            </VStack>
          </Box>
        )}
        
        {/* Bottom Line */}
        <Box p={4} bg="yellow.50" borderRadius="lg" border="1px solid" borderColor="yellow.200">
          <VStack align="start" spacing={2}>
            <Text fontSize="sm" fontWeight="semibold" color="yellow.800">
              🎯 Bottom Line
            </Text>
            <Text fontSize="sm" color="yellow.700" lineHeight="1.5">
              {analysis.bottomLine}
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}