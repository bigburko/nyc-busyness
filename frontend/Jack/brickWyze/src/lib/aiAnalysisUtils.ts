// src/lib/aiAnalysisUtils.ts

import { TractResult } from '../types/TractTypes';
import { Weight } from '../types/WeightTypes';
import { 
  AIBusinessAnalysis, 
  LocationInsights, 
  FootTrafficTimeline, 
  CrimeTimeline,
  FilterStoreSlice,
  CachedAnalysis 
} from '../types/AIAnalysisTypes';

// Module-level cache that persists between component lifecycle
const aiAnalysisCache = new Map<string, CachedAnalysis>();

// Cache expiration time (30 minutes)
const CACHE_EXPIRY_MS = 30 * 60 * 1000;

// Weight ID to label mapping for display purposes
export const WEIGHT_LABELS: Record<string, string> = {
  'foot_traffic': 'Foot Traffic',
  'demographic': 'Demographics',
  'crime': 'Safety',
  'flood_risk': 'Flood Risk',
  'rent_score': 'Rent Affordability',
  'poi': 'Points of Interest'
};

// Get display label for weight
export const getWeightLabel = (weight: Weight): string => {
  return WEIGHT_LABELS[weight.id] || weight.id;
};

// Cache helper functions
export const getCachedAnalysis = (tractId: string): AIBusinessAnalysis | null => {
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

export const setCachedAnalysis = (tractId: string, analysis: AIBusinessAnalysis): void => {
  aiAnalysisCache.set(tractId, {
    analysis,
    timestamp: Date.now(),
    tractId
  });
  console.log('💾 [AI Summary] Cached analysis for tract:', tractId);
};

// Generate personalized speech text for Bricky with properly rounded scores
export const generatePersonalizedSpeechText = (
  analysis: AIBusinessAnalysis, 
  tract: TractResult, 
  filterStore: FilterStoreSlice
): string => {
  const score = Math.round(tract.custom_score || 0); // ✅ FIXED: Use proper rounding instead of floor
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

// Helper function - SAME calculation method as TrendIndicators component
const calculateTrendFromData = (data: number[]): { trend: 'increasing' | 'decreasing' | 'stable' | 'unknown'; change: string } => {
  if (data.length < 2) return { trend: 'unknown', change: '0%' };
  
  const start = data[0];
  const end = data[data.length - 1];
  
  if (start === 0) return { trend: 'unknown', change: '0%' };
  
  const changePercent = ((end - start) / start) * 100;
  
  let trend: 'increasing' | 'decreasing' | 'stable' | 'unknown';
  if (Math.abs(changePercent) < 2) {
    trend = 'stable';
  } else if (changePercent > 0) {
    trend = 'increasing';
  } else {
    trend = 'decreasing';
  }
  
  // ✅ FIXED: Use Math.ceil for absolute value to match AI rounding logic
  const roundedPercent = changePercent >= 0 ? 
    Math.ceil(changePercent) : 
    -Math.ceil(Math.abs(changePercent));
  
  const sign = roundedPercent >= 0 ? '+' : '';
  return { 
    trend, 
    change: `${sign}${roundedPercent}%` 
  };
};

// ✅ FIXED: Extract trend analysis logic - now calculates trends the SAME WAY as TrendIndicators
export const extractTrendInsights = (tract: TractResult): LocationInsights => {
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

  // Foot Traffic Analysis - ✅ CALCULATE THE SAME WAY AS TRENDINDICATORS
  if (tract.foot_traffic_score) {
    let footTrafficSparkline: number[] = [];
    
    if (tract.foot_traffic_timeline && Object.keys(tract.foot_traffic_timeline).length > 0) {
      const timeline = tract.foot_traffic_timeline as FootTrafficTimeline;
      footTrafficSparkline = [
        timeline['2022'] || 0,
        timeline['2023'] || 0,
        timeline['2024'] || 0,  // ✅ Include 2024
        timeline['pred_2025'] || 0,
        timeline['pred_2026'] || 0,
        timeline['pred_2027'] || 0
      ];
    } else {
      // Generate realistic trend based on current score - SAME as TrendIndicators
      const current = tract.foot_traffic_score;
      footTrafficSparkline = [
        current * 0.85,
        current * 0.92,
        current * 1.0,  // 2024
        current,         // 2025 = current
        current * 1.03,
        current * 1.06
      ];
    }
    
    // ✅ USE SAME CALCULATION METHOD as TrendIndicators
    const { trend, change } = calculateTrendFromData(footTrafficSparkline);
    
    console.log('✅ [extractTrendInsights] Foot traffic calculated (using AI rounding logic):', {
      data: footTrafficSparkline,
      trend,
      change,
      source: 'calculated_from_timeline'
    });
    
    insights.footTraffic = {
      current: Math.round(tract.foot_traffic_score), // ✅ Use Math.round for display consistency
      trend,
      change,
      sparklineData: footTrafficSparkline
    };
  }

  // Crime/Safety Analysis - ✅ CALCULATE THE SAME WAY AS TRENDINDICATORS
  if (tract.crime_score) {
    let crimeSparkline: number[] = [];
    
    if (tract.crime_timeline && Object.keys(tract.crime_timeline).length > 0) {
      const timeline = tract.crime_timeline as CrimeTimeline;
      crimeSparkline = [
        timeline.year_2022 || 0,
        timeline.year_2023 || 0,
        timeline.year_2024 || 0,  // ✅ Include 2024
        timeline.pred_2025 || 0,
        timeline.pred_2026 || 0,
        timeline.pred_2027 || 0
      ];
    } else {
      // Generate realistic trend - SAME as TrendIndicators
      const current = tract.crime_score;
      crimeSparkline = [
        current * 0.80,
        current * 0.85,
        current * 0.92,
        current,          // 2025 = current
        Math.min(100, current * 1.02),
        Math.min(100, current * 1.05)
      ];
    }
    
    // ✅ USE SAME CALCULATION METHOD as TrendIndicators
    const { trend, change } = calculateTrendFromData(crimeSparkline);
    
    console.log('✅ [extractTrendInsights] Crime calculated (using AI rounding logic):', {
      data: crimeSparkline,
      trend,
      change,
      source: 'calculated_from_timeline'
    });
    
    insights.safety = {
      current: Math.round(tract.crime_score), // ✅ Use Math.round for display consistency
      trend,
      change,
      sparklineData: crimeSparkline
    };
  }

  // Overall outlook assessment - SAME logic as TrendIndicators
  const negativeChanges = [insights.footTraffic, insights.safety].filter(t => t.change.startsWith('-')).length;
  const positiveChanges = [insights.footTraffic, insights.safety].filter(t => t.change.startsWith('+')).length;
  
  if (negativeChanges > positiveChanges) {
    insights.overallOutlook = "📉 This area shows declining trends that need attention";
  } else if (positiveChanges > negativeChanges) {
    insights.overallOutlook = "📈 This area shows positive growth trends across key metrics";
  } else {
    insights.overallOutlook = "📊 This area shows stable performance with mixed trends";
  }

  return insights;
};

// Build comprehensive context for AI analysis with business intelligence focus
export const buildBusinessIntelligencePrompt = (
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
• **Overall Score**: ${Math.floor(tract.custom_score || 0)}/100
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

// Define proper types for AI response parsing
interface ParsedInsight {
  Type?: string;
  type?: string;
  Title?: string;
  title?: string;
  Description?: string;
  description?: string;
}

interface ParsedAIResponseData {
  HEADLINE?: string;
  headline?: string;
  REASONING?: string;
  reasoning?: string;
  KEY_INSIGHTS?: ParsedInsight[];
  key_insights?: ParsedInsight[];
  BUSINESS_TYPES?: string[];
  business_types?: string[];
  MARKET_STRATEGY?: string;
  market_strategy?: string;
  COMPETITOR_EXAMPLES?: string[];
  competitor_examples?: string[];
  BOTTOM_LINE?: string;
  bottom_line?: string;
}

// ✅ FIXED: Parse AI response into structured business analysis
export const parseAIResponse = (response: string, tract: TractResult): AIBusinessAnalysis => {
  console.log('🔍 [AI Summary] Raw AI response:', response);
  
  // Default fallback analysis with rounded scores
  const analysis: AIBusinessAnalysis = {
    headline: `📍 Business Analysis for ${tract.nta_name}`,
    reasoning: `Analyzed based on location metrics and market trends for this NYC area.`,
    insights: [
      {
        type: 'strength',
        icon: '📊',
        title: 'Comprehensive Data Available',
        description: `Location has complete metric coverage with ${Math.floor(tract.custom_score || 0)}/100 overall score.`
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
    const parsed = JSON.parse(cleanResponse) as ParsedAIResponseData;
    console.log('✅ [AI Summary] Successfully parsed JSON:', parsed);
    
    // ✅ FIXED: Check for both UPPERCASE and lowercase property names
    if (parsed.HEADLINE || parsed.headline) {
      analysis.headline = parsed.HEADLINE || parsed.headline || analysis.headline;
    }
    
    if (parsed.REASONING || parsed.reasoning) {
      analysis.reasoning = parsed.REASONING || parsed.reasoning || analysis.reasoning;
    }
    
    // ✅ FIXED: Check for both formats of insights
    const insights = parsed.KEY_INSIGHTS || parsed.key_insights;
    if (insights && Array.isArray(insights)) {
      analysis.insights = insights.map((insight: ParsedInsight) => ({
        type: (insight.Type?.toLowerCase() || insight.type?.toLowerCase() || 'strength') as 'strength' | 'opportunity' | 'consideration',
        icon: (insight.Type?.toLowerCase() || insight.type?.toLowerCase()) === 'strength' ? '💪' : 
              (insight.Type?.toLowerCase() || insight.type?.toLowerCase()) === 'opportunity' ? '🚀' : '⚠️',
        title: insight.Title || insight.title || 'Business Insight',
        description: insight.Description || insight.description || ''
      })).slice(0, 4);
    }
    
    // ✅ FIXED: Check for both formats of business types
    const businessTypes = parsed.BUSINESS_TYPES || parsed.business_types;
    if (businessTypes && Array.isArray(businessTypes)) {
      analysis.businessTypes = businessTypes.slice(0, 5);
    }
    
    // ✅ FIXED: Check for both formats of market strategy
    if (parsed.MARKET_STRATEGY || parsed.market_strategy) {
      analysis.marketStrategy = parsed.MARKET_STRATEGY || parsed.market_strategy || analysis.marketStrategy;
    }
    
    // ✅ FIXED: Check for both formats of competitor examples
    const competitorExamples = parsed.COMPETITOR_EXAMPLES || parsed.competitor_examples;
    if (competitorExamples && Array.isArray(competitorExamples)) {
      analysis.competitorExamples = competitorExamples;
    }
    
    // ✅ FIXED: Check for both formats of bottom line
    if (parsed.BOTTOM_LINE || parsed.bottom_line) {
      const bottomLineValue = parsed.BOTTOM_LINE || parsed.bottom_line;
      if (bottomLineValue) {
        analysis.bottomLine = bottomLineValue;
        
        // Extract confidence from bottom line
        const bottomLineText = bottomLineValue.toLowerCase();
        if (bottomLineText.includes('high') || bottomLineText.includes('strong')) {
          analysis.confidence = 'high';
        } else if (bottomLineText.includes('medium') || bottomLineText.includes('moderate')) {
          analysis.confidence = 'medium';
        } else if (bottomLineText.includes('low') || bottomLineText.includes('weak')) {
          analysis.confidence = 'low';
        }
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
        const insights: Array<{
          type: 'strength' | 'opportunity' | 'consideration';
          icon: string;
          title: string;
          description: string;
        }> = [];
        
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

// Utility functions for styling
export const getConfidenceColor = (confidence: string) => {
  switch (confidence) {
    case 'high': return { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.3)', color: 'green.100' };
    case 'medium': return { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.3)', color: 'yellow.100' };
    case 'low': return { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.3)', color: 'red.100' };
    default: return { bg: 'rgba(156, 163, 175, 0.2)', border: 'rgba(156, 163, 175, 0.3)', color: 'gray.100' };
  }
};

export const getInsightColor = (type: string) => {
  switch (type) {
    case 'strength': return 'green';
    case 'opportunity': return 'blue';
    case 'consideration': return 'orange';
    default: return 'gray';
  }
};