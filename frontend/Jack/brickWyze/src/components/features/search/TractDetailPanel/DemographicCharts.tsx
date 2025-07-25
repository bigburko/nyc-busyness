// src/components/features/search/TractDetailPanel/DemographicCharts.tsx
'use client';

import { Box, VStack, HStack, Text, SimpleGrid, Badge } from '@chakra-ui/react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { TractResult } from '../../../../types/TractTypes';

interface DemographicChartsProps {
  tract: TractResult;
  rawDemographicData?: {
    ethnicityData: any[] | null;
    demographicsData: any[] | null;
    incomeData: any[] | null;
  };
}

// 🔧 SAFE: Helper function to safely format percentages
const safeToFixed = (value: number | null | undefined, decimals: number = 1): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0';
  }
  return Number(value).toFixed(decimals);
};

interface DemographicChartsProps {
  tract: TractResult;
  rawDemographicData?: {
    ethnicityData: any[] | null;
    demographicsData: any[] | null;
    incomeData: any[] | null;
  };
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box bg="white" p={3} borderRadius="lg" boxShadow="xl" border="1px solid" borderColor="gray.200">
        <Text fontSize="sm" fontWeight="bold" color="gray.800">{data.name}</Text>
        <Text fontSize="sm" color="gray.600">{data.value}% match</Text>
      </Box>
    );
  }
  return null;
};

// 🚀 NEW: Detect if we have real demographic data vs no data
const hasRealDemographicData = (tract: TractResult) => {
  return (
    (tract.demographic_match_pct !== undefined && tract.demographic_match_pct !== null && tract.demographic_match_pct > 0) ||
    (tract.gender_match_pct !== undefined && tract.gender_match_pct !== null && tract.gender_match_pct > 0) ||
    (tract.age_match_pct !== undefined && tract.age_match_pct !== null && tract.age_match_pct > 0) ||
    (tract.income_match_pct !== undefined && tract.income_match_pct !== null && tract.income_match_pct > 0)
  );
};

// 🚀 NEW: Check if data contains actual values or just placeholders
const hasMeaningfulData = (data: any[] | null) => {
  if (!data || data.length === 0) return false;
  
  // Check if data has meaningful values (not just 0% or "No Data Available")
  return data.some(item => 
    item.value > 0 && 
    !item.name.includes('No Data') && 
    !item.name.includes('Other') ||
    (item.name.includes('Target') && item.value > 0)
  );
};

export function DemographicCharts({ tract, rawDemographicData }: DemographicChartsProps) {
  console.log(`📊 DemographicCharts rendering for tract ${tract.geoid}`);
  
  // Check if we have real demographic data
  const hasRealData = hasRealDemographicData(tract);
  const hasProvidedData = rawDemographicData && (
    hasMeaningfulData(rawDemographicData.ethnicityData) ||
    hasMeaningfulData(rawDemographicData.demographicsData) ||
    hasMeaningfulData(rawDemographicData.incomeData)
  );

  console.log('📊 [DemographicCharts] Data analysis:', {
    tractId: tract.geoid,
    hasRealData,
    hasProvidedData,
    ethnicityMatch: tract.demographic_match_pct,
    genderMatch: tract.gender_match_pct,
    ageMatch: tract.age_match_pct,
    incomeMatch: tract.income_match_pct
  });

  // If no meaningful data, show appropriate message
  if (!hasRealData && !hasProvidedData) {
    return (
      <Box p={6} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200">
        <VStack spacing={4}>
          <Text fontSize="xl" fontWeight="bold" color="gray.800">
            📊 Neighborhood Demographics
          </Text>
          <Text fontSize="md" color="gray.600" textAlign="center">
            No demographic data available for this tract.
          </Text>
          <Text fontSize="sm" color="gray.500" textAlign="center">
            Apply demographic filters to your search to see demographic analysis.
          </Text>
          <Text fontSize="xs" color="gray.400" textAlign="center">
            Tract ID: {tract.geoid}
          </Text>
        </VStack>
      </Box>
    );
  }

  // Use provided data (real demographic data)
  const ethnicityData = rawDemographicData?.ethnicityData || [];
  const demographicsData = rawDemographicData?.demographicsData || [];
  const incomeData = rawDemographicData?.incomeData || [];

  // Render ethnicity chart (pie chart for better visualization of match vs non-match)
  const renderEthnicityChart = () => {
    if (!hasMeaningfulData(ethnicityData)) return null;

    return (
      <VStack spacing={4} w="full">
        <HStack justify="space-between" w="full">
          <Text fontSize="lg" fontWeight="bold" color="gray.800">
            🌍 Ethnicity Match
          </Text>
          <Badge colorScheme="green" size="sm">Live Data</Badge>
        </HStack>
        <Box height="200px" w="full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ethnicityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {ethnicityData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        {(tract.demographic_match_pct !== undefined && tract.demographic_match_pct !== null) && (
          <Text fontSize="sm" color="gray.600" textAlign="center">
            {safeToFixed(tract.demographic_match_pct)}% of residents match your target demographics
          </Text>
        )}
      </VStack>
    );
  };

  // Render demographics chart (age/gender)
  const renderDemographicsChart = () => {
    if (!hasMeaningfulData(demographicsData)) return null;

    return (
      <VStack spacing={4} w="full">
        <HStack justify="space-between" w="full">
          <Text fontSize="lg" fontWeight="bold" color="gray.800">
            👥 Age & Gender Match
          </Text>
          <Badge colorScheme="green" size="sm">Live Data</Badge>
        </HStack>
        <Box height="200px" w="full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demographicsData}>
              <XAxis 
                dataKey="name" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                fontSize={12}
                label={{ value: 'Match %', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#8884d8">
                {demographicsData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
        <HStack spacing={4} fontSize="sm" color="gray.600">
          {(tract.age_match_pct !== undefined && tract.age_match_pct !== null) && (
            <Text>Age: {safeToFixed(tract.age_match_pct)}%</Text>
          )}
          {(tract.gender_match_pct !== undefined && tract.gender_match_pct !== null) && (
            <Text>Gender: {safeToFixed(tract.gender_match_pct)}%</Text>
          )}
        </HStack>
      </VStack>
    );
  };

  // Render income chart
  const renderIncomeChart = () => {
    if (!hasMeaningfulData(incomeData)) return null;

    return (
      <VStack spacing={4} w="full">
        <HStack justify="space-between" w="full">
          <Text fontSize="lg" fontWeight="bold" color="gray.800">
            💰 Income Match
          </Text>
          <Badge colorScheme="green" size="sm">Live Data</Badge>
        </HStack>
        <Box height="200px" w="full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={incomeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {incomeData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        {(tract.income_match_pct !== undefined && tract.income_match_pct !== null) && (
          <Text fontSize="sm" color="gray.600" textAlign="center">
            {safeToFixed(tract.income_match_pct)}% of households match your target income range
          </Text>
        )}
      </VStack>
    );
  };

  return (
    <Box p={6} bg="white">
      <VStack spacing={6}>
        {/* Header */}
        <HStack justify="space-between" w="full" align="center">
          <Text fontSize="xl" fontWeight="bold" color="gray.800">
            📊 Demographic Analysis
          </Text>
          <Badge colorScheme="green" variant="subtle">
            Real Census Data
          </Badge>
        </HStack>

        {/* Real data indicator */}
        <Box bg="green.50" p={4} borderRadius="lg" border="1px solid" borderColor="green.200" w="full">
          <HStack spacing={2} align="center">
            <Text fontSize="sm" color="green.700" fontWeight="medium">
              ✅ Live demographic analysis based on US Census data for tract {tract.geoid}
            </Text>
          </HStack>
          <Text fontSize="xs" color="green.600" mt={1}>
            Match percentages show how well this tract aligns with your search criteria
          </Text>
        </Box>

        {/* Charts Grid */}
        <SimpleGrid columns={{ base: 1, lg: hasProvidedData ? 2 : 1, xl: 3 }} spacing={8} w="full">
          {renderEthnicityChart()}
          {renderDemographicsChart()}
          {renderIncomeChart()}
        </SimpleGrid>

        {/* Summary insights */}
        <Box bg="blue.50" p={4} borderRadius="lg" border="1px solid" borderColor="blue.200" w="full">
          <Text fontSize="md" fontWeight="bold" color="blue.700" mb={2}>
            📋 Key Insights
          </Text>
          <VStack spacing={1} align="start">
            {(tract.demographic_match_pct !== undefined && tract.demographic_match_pct !== null) && (
              <Text fontSize="sm" color="blue.600">
                • <strong>{safeToFixed(tract.demographic_match_pct)}%</strong> ethnicity match with your target demographics
              </Text>
            )}
            {(tract.age_match_pct !== undefined && tract.age_match_pct !== null) && (
              <Text fontSize="sm" color="blue.600">
                • <strong>{safeToFixed(tract.age_match_pct)}%</strong> of residents are in your target age range
              </Text>
            )}
            {(tract.gender_match_pct !== undefined && tract.gender_match_pct !== null) && (
              <Text fontSize="sm" color="blue.600">
                • <strong>{safeToFixed(tract.gender_match_pct)}%</strong> gender distribution match
              </Text>
            )}
            {(tract.income_match_pct !== undefined && tract.income_match_pct !== null) && (
              <Text fontSize="sm" color="blue.600">
                • <strong>{safeToFixed(tract.income_match_pct)}%</strong> of households are in your target income range
              </Text>
            )}
          </VStack>
          
          {/* Overall assessment */}
          {hasRealData && (
            <Box mt={3} p={3} bg="white" borderRadius="md" border="1px solid" borderColor="blue.300">
              <Text fontSize="sm" color="blue.800" fontWeight="medium">
                📊 Overall Demographic Fit: {
                  (() => {
                    const values = [
                      tract.demographic_match_pct,
                      tract.age_match_pct,
                      tract.gender_match_pct,
                      tract.income_match_pct
                    ];
                    
                    const matches = values.filter((val): val is number => 
                      val !== null && val !== undefined && !isNaN(val) && val > 0
                    );
                    
                    if (matches.length === 0) return "No data";
                    
                    const avgMatch = matches.reduce((sum: number, val: number) => sum + val, 0) / matches.length;
                    if (avgMatch >= 70) return "Excellent Match";
                    if (avgMatch >= 50) return "Good Match";
                    if (avgMatch >= 30) return "Moderate Match";
                    return "Limited Match";
                  })()
                }
              </Text>
            </Box>
          )}
        </Box>
      </VStack>
    </Box>
  );
}