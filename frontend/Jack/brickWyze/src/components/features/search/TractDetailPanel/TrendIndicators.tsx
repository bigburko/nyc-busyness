// src/components/features/search/TractDetailPanel/TrendIndicators.tsx - Updated with isExporting prop
'use client';

import { Box, VStack, HStack, Text } from '@chakra-ui/react';
import { TractResult } from '../../../../types/TractTypes';
import MyToolTip from '../../../ui/MyToolTip';  // ✅ FIXED: Default import, not named import

interface TrendIndicatorsProps {
  tract: TractResult;
  isExporting?: boolean; // ✅ ADDED: isExporting prop
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

// Helper function to calculate real trend from data
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
  
  const roundedPercent = changePercent >= 0 ? 
    Math.ceil(changePercent) : 
    -Math.ceil(Math.abs(changePercent));
  
  const sign = roundedPercent >= 0 ? '+' : '';
  return { trend, change: `${sign}${roundedPercent}%` };
};

export function TrendIndicators({ tract, isExporting = false }: TrendIndicatorsProps) {
  // Extract timeline data
  const crimeData = tract.crime_timeline ? Object.values(tract.crime_timeline).filter(v => v !== null && v !== undefined) : [];
  const footTrafficData = tract.foot_traffic_timeline ? Object.values(tract.foot_traffic_timeline).filter(v => v !== null && v !== undefined) : [];
  
  // Calculate trends
  const crimeTrend = calculateTrend(crimeData);
  const footTrafficTrend = calculateTrend(footTrafficData);
  
  // Create trend data array
  const trends: TrendData[] = [
    {
      label: 'Crime Safety',
      current: Math.round(tract.crime_score || 0),
      trend: crimeTrend.trend,
      change: crimeTrend.change,
      color: crimeTrend.trend === 'decreasing' ? '#10B981' : crimeTrend.trend === 'increasing' ? '#EF4444' : '#6B7280',
      sparklineData: crimeData.map(v => Number(v) || 0)
    },
    {
      label: 'Foot Traffic',
      current: Math.round(tract.foot_traffic_score || 0),
      trend: footTrafficTrend.trend,
      change: footTrafficTrend.change,
      color: footTrafficTrend.trend === 'increasing' ? '#10B981' : footTrafficTrend.trend === 'decreasing' ? '#EF4444' : '#6B7280',
      sparklineData: footTrafficData.map(v => Number(v) || 0)
    },
    {
      label: 'Demographics',
      current: Math.round(tract.demographic_score || 0),
      trend: 'stable',
      change: '0%',
      color: '#6B7280',
      sparklineData: [50, 52, 50, 51, 50] // Stable demo data
    }
  ];

  // Calculate future outlook
  const avgScore = trends.reduce((sum, trend) => sum + trend.current, 0) / trends.length;
  const increasingTrends = trends.filter(t => t.trend === 'increasing').length;
  const decreasingTrends = trends.filter(t => t.trend === 'decreasing').length;
  
  let futureOutlook = '';
  if (increasingTrends > decreasingTrends && avgScore > 60) {
    futureOutlook = 'Strong upward momentum expected';
  } else if (decreasingTrends > increasingTrends) {
    futureOutlook = 'Some challenges ahead, monitor closely';
  } else {
    futureOutlook = 'Stable conditions anticipated';
  }

  return (
    <Box 
      bg="white" 
      p={6} 
      borderRadius="xl" 
      boxShadow="sm" 
      border="1px solid" 
      borderColor="gray.200"
      data-chart="trend-indicators" 
      data-chart-content="true"
      className="chart-container"
    >
      <VStack spacing={6} align="stretch">
        <Text fontSize="lg" fontWeight="bold" color="gray.800">
          Trend Summary
        </Text>
        
        {trends.map((trend, index) => (
          <Box key={index}>
            {/* Skip tooltips when exporting */}
            {!isExporting ? (
              <MyToolTip label={`${trend.label}: ${trend.current} (${trend.change} trend)`}>
                <HStack spacing={4} p={4} bg="gray.50" borderRadius="lg" cursor="help">
                  {/* Left: Label and trend */}
                  <VStack align="start" spacing={1} flex="1">
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      {trend.label}
                    </Text>
                    <Text 
                      fontSize="sm" 
                      fontWeight="semibold"
                      color={trend.trend === 'increasing' ? '#10B981' : 
                            trend.trend === 'decreasing' ? '#EF4444' : '#6B7280'}
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
              </MyToolTip>
            ) : (
              <HStack spacing={4} p={4} bg="gray.50" borderRadius="lg">
                {/* Left: Label and trend */}
                <VStack align="start" spacing={1} flex="1">
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {trend.label}
                  </Text>
                  <Text 
                    fontSize="sm" 
                    fontWeight="semibold"
                    color={trend.trend === 'increasing' ? '#10B981' : 
                          trend.trend === 'decreasing' ? '#EF4444' : '#6B7280'}
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
            )}
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
      >
        <Text fontSize="sm" color="blue.700" fontWeight="medium">
          Future Outlook: {futureOutlook}
        </Text>
      </Box>
    </Box>
  );
}