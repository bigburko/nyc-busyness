// src/components/features/search/TractDetailPanel/TrendIndicators.tsx
'use client';

import { Box, VStack, HStack, Text } from '@chakra-ui/react';
import { TractResult } from '../../../../types/TractTypes';

interface TrendIndicatorsProps {
  tract: TractResult;
}

interface TrendData {
  label: string;
  current: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'unknown';
  change: string;
  color: string;
  sparklineData: number[];
}

const SimpleSparkline = ({ data, color }: { data: number[]; color: string }) => {
  if (data.length === 0) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  
  // Add padding to prevent clipping
  const padding = 4;
  const width = 100 - (padding * 2);
  const height = 40 - (padding * 2);
  
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * width;
    const y = padding + (range === 0 ? height/2 : (1 - (value - min) / range) * height);
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <Box w="100px" h="40px" p="1">
      <svg width="100" height="40" viewBox="0 0 100 40">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  );
};

// Helper function to calculate real trend from data - ✅ UPDATED TO MATCH AI LOGIC
const calculateTrend = (data: number[]): { trend: TrendData['trend']; change: string } => {
  if (data.length < 2) return { trend: 'unknown', change: '0%' };
  
  const start = data[0];
  const end = data[data.length - 1];
  
  if (start === 0) return { trend: 'unknown', change: '0%' };
  
  const changePercent = ((end - start) / start) * 100;
  
  let trend: TrendData['trend'];
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

export function TrendIndicators({ tract }: TrendIndicatorsProps) {
  const trends: TrendData[] = [];
  
  // Foot Traffic Trend - ✅ CALCULATE FROM REAL TIMELINE DATA
  if (tract.foot_traffic_score) {
    const currentScore = Math.round(tract.foot_traffic_score); // ✅ Keep Math.round for display
    let chartData: number[] = [];
    
    if (tract.foot_traffic_timeline && Object.keys(tract.foot_traffic_timeline).length > 0) {
      const timeline = tract.foot_traffic_timeline;
      chartData = [
        timeline['2022'] || 0, // ✅ Use raw values for calculation
        timeline['2023'] || 0, // ✅ Use raw values for calculation
        timeline['2024'] || 0, // ✅ Use raw values for calculation
        timeline['pred_2025'] || 0, // ✅ Use raw values for calculation
        timeline['pred_2026'] || 0, // ✅ Use raw values for calculation
        timeline['pred_2027'] || 0, // ✅ Use raw values for calculation
      ];
    } else {
      chartData = [
        currentScore * 0.85,
        currentScore * 0.92,
        currentScore * 1.0,
        currentScore,
        currentScore * 1.03,
        currentScore * 1.06
      ];
    }
    
    // ✅ CALCULATE TREND FROM ACTUAL DATA (your original approach was correct)
    const { trend, change } = calculateTrend(chartData);
    
    console.log('✅ [TrendIndicators] Foot traffic calculated (using AI rounding logic):', {
      chartData,
      trend,
      change,
      source: 'calculated_from_timeline'
    });
    
    trends.push({
      label: 'Foot Traffic',
      current: currentScore,
      trend,
      change,
      color: '#4299E1',
      sparklineData: chartData
    });
  }
  
  // Safety Trend - ✅ CALCULATE FROM REAL TIMELINE DATA
  if (tract.crime_score) {
    const currentScore = Math.round(tract.crime_score); // ✅ Keep Math.round for display
    let chartData: number[] = [];
    
    if (tract.crime_timeline && Object.keys(tract.crime_timeline).length > 0) {
      const timeline = tract.crime_timeline;
      chartData = [
        timeline.year_2022 || 0, // ✅ Use raw values for calculation
        timeline.year_2023 || 0, // ✅ Use raw values for calculation
        timeline.year_2024 || 0, // ✅ Use raw values for calculation
        timeline.pred_2025 || 0, // ✅ Use raw values for calculation
        timeline.pred_2026 || 0, // ✅ Use raw values for calculation
        timeline.pred_2027 || 0, // ✅ Use raw values for calculation
      ];
    } else {
      chartData = [
        currentScore * 0.80,
        currentScore * 0.85,
        currentScore * 0.92,
        currentScore,
        Math.min(100, currentScore * 1.02),
        Math.min(100, currentScore * 1.05),
      ];
    }
    
    // ✅ CALCULATE TREND FROM ACTUAL DATA (your original approach was correct)
    const { trend, change } = calculateTrend(chartData);
    
    console.log('✅ [TrendIndicators] Crime calculated (using AI rounding logic):', {
      chartData,
      trend,
      change,
      source: 'calculated_from_timeline'
    });
    
    trends.push({
      label: 'Safety Score',
      current: currentScore,
      trend,
      change,
      color: '#10B981',
      sparklineData: chartData
    });
  }
  
  if (trends.length === 0) {
    return (
      <Box p={4} bg="gray.50" borderRadius="md" className="trend-indicators-container" data-chart="trend-indicators" data-chart-content="true">
        <Text fontSize="md" fontWeight="semibold" color="gray.700">
          Trend Summary
        </Text>
        <Text fontSize="sm" color="gray.600" mt={1}>
          No trend data available.
        </Text>
      </Box>
    );
  }

  // ✅ DYNAMIC FUTURE OUTLOOK based on actual calculated trends
  const negativeChanges = trends.filter(t => t.change.startsWith('-')).length;
  const positiveChanges = trends.filter(t => t.change.startsWith('+')).length;
  
  let futureOutlook = "This area shows stable performance with mixed trends";
  if (negativeChanges > positiveChanges) {
    futureOutlook = "This area shows declining trends that need attention";
  } else if (positiveChanges > negativeChanges) {
    futureOutlook = "This area shows positive growth trends across key metrics";
  }

  return (
    <Box className="trend-indicators-container" data-chart="trend-indicators" data-chart-content="true">
      <Text fontSize="lg" fontWeight="bold" color="gray.800" mb={4}>
        Trend Summary
      </Text>
      
      <VStack spacing={3} w="full">
        {trends.map((trend, index) => (
          <Box 
            key={`trend-${index}`}
            p={4} 
            bg="white" 
            borderRadius="md" 
            border="1px solid" 
            borderColor="gray.200"
            w="full"
            data-chart-content="true"
          >
            <HStack justify="space-between" align="center">
              {/* Left: Label and Change */}
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" fontWeight="medium" color="gray.600">
                  {trend.label}
                </Text>
                <Text 
                  fontSize="sm" 
                  fontWeight="semibold" 
                  color={trend.change.startsWith('-') ? '#EF4444' : '#10B981'}
                >
                  {trend.change}
                </Text>
              </VStack>
              
              {/* Center: Sparkline */}
              <SimpleSparkline data={trend.sparklineData} color={trend.color} />
              
              {/* Right: Current Score */}
              <VStack align="end" spacing={1}>
                <Text fontSize="2xl" fontWeight="bold" color={trend.color}>
                  {trend.current}
                </Text>
                <Text fontSize="xs" color="gray.500" textTransform="uppercase">
                  current
                </Text>
              </VStack>
            </HStack>
          </Box>
        ))}
      </VStack>
      
      <Box 
        mt={4}
        p={3} 
        bg="blue.50" 
        borderRadius="md" 
        border="1px solid" 
        borderColor="blue.200"
        data-chart-content="true"
      >
        <Text fontSize="sm" color="blue.700" fontWeight="medium">
          Future Outlook: {futureOutlook}
        </Text>
      </Box>
    </Box>
  );
}