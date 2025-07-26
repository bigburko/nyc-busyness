// src/components/features/search/TractDetailPanel/DemographicCharts.tsx
'use client';

import { 
  Box, VStack, HStack, Text, Badge, Flex
} from '@chakra-ui/react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from 'recharts';
import { TractResult } from '../../../../types/TractTypes';

// Define proper demographic data types
interface DemographicDataItem {
  name: string;
  value: number;
  color: string;
}

interface RawDemographicData {
  ethnicityData: DemographicDataItem[] | null;
  demographicsData: DemographicDataItem[] | null;
  incomeData: DemographicDataItem[] | null;
}

interface DemographicChartsProps {
  tract: TractResult;
  rawDemographicData?: RawDemographicData;
}

// Custom color palettes for charts
const ETHNICITY_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#6B7280'];
const DEMOGRAPHICS_COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#6B7280'];
const INCOME_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#6B7280'];

// Helper function to get chart color by index and type
const getChartColor = (index: number, chartType: 'ethnicity' | 'demographics' | 'income', itemName: string): string => {
  // Always use dark gray for "Other" items
  if (itemName.toLowerCase().includes('other')) {
    return '#6B7280';
  }
  
  const colorPalette = chartType === 'ethnicity' ? ETHNICITY_COLORS :
                      chartType === 'demographics' ? DEMOGRAPHICS_COLORS :
                      INCOME_COLORS;
  
  return colorPalette[index % colorPalette.length];
};

// 🔧 SAFE: Helper function to safely format percentages
const safeToFixed = (value: number | null | undefined, decimals: number = 1): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0';
  }
  return Number(value).toFixed(decimals);
};

// Custom tooltip component with proper typing
interface TooltipPayloadItem {
  payload: DemographicDataItem;
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box bg="white" p={3} borderRadius="lg" boxShadow="xl" border="1px solid" borderColor="gray.200">
        <Text fontSize="sm" fontWeight="bold" color="gray.800">{data.name}</Text>
        <Text fontSize="sm" color="gray.600">{safeToFixed(data.value, 1)}% match</Text>
      </Box>
    );
  }
  return null;
};

// 🚀 NEW: Detect if we have real demographic data vs no data
const hasRealDemographicData = (tract: TractResult): boolean => {
  return (
    (tract.demographic_match_pct !== undefined && tract.demographic_match_pct !== null && tract.demographic_match_pct > 0) ||
    (tract.gender_match_pct !== undefined && tract.gender_match_pct !== null && tract.gender_match_pct > 0) ||
    (tract.age_match_pct !== undefined && tract.age_match_pct !== null && tract.age_match_pct > 0) ||
    (tract.income_match_pct !== undefined && tract.income_match_pct !== null && tract.income_match_pct > 0)
  );
};

// 🚀 NEW: Check if data contains actual values or just placeholders
const hasMeaningfulData = (data: DemographicDataItem[] | null): boolean => {
  if (!data || data.length === 0) return false;
  
  // Check if data has meaningful values (not just 0% or "No Data Available")
  return data.some(item => 
    item.value > 0 && 
    !item.name.includes('No Data') && 
    !item.name.includes('Other') ||
    (item.name.includes('Target') && item.value > 0)
  );
};

// Helper function to get quality color based on percentage
const getQualityColor = (percentage: number): string => {
  if (percentage >= 30) return 'green';
  if (percentage >= 20) return 'blue';
  if (percentage >= 15) return 'orange';
  if (percentage >= 10) return 'yellow';
  return 'red';
};

// Helper function to get quality label
const getQualityLabel = (percentage: number): string => {
  if (percentage >= 30) return 'Excellent';
  if (percentage >= 20) return 'Good';
  if (percentage >= 15) return 'Average';
  if (percentage >= 10) return 'Weak';
  if (percentage >= 5) return 'Poor';
  return 'Very Poor';
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

  // Determine available tabs
  const availableTabs = [];
  
  if (hasMeaningfulData(ethnicityData) || (tract.demographic_match_pct !== undefined && tract.demographic_match_pct !== null)) {
    availableTabs.push({
      id: 'ethnicity',
      icon: '🌍',
      label: 'Ethnicity',
      value: tract.demographic_match_pct,
      hasChart: hasMeaningfulData(ethnicityData)
    });
  }
  
  if (hasMeaningfulData(demographicsData) || 
      (tract.age_match_pct !== undefined && tract.age_match_pct !== null) || 
      (tract.gender_match_pct !== undefined && tract.gender_match_pct !== null)) {
    availableTabs.push({
      id: 'demographics',
      icon: '👥',
      label: 'Age & Gender',
      value: Math.max(tract.age_match_pct || 0, tract.gender_match_pct || 0),
      hasChart: hasMeaningfulData(demographicsData)
    });
  }
  
  if (hasMeaningfulData(incomeData) || (tract.income_match_pct !== undefined && tract.income_match_pct !== null)) {
    availableTabs.push({
      id: 'income',
      icon: '💰',
      label: 'Income',
      value: tract.income_match_pct,
      hasChart: hasMeaningfulData(incomeData)
    });
  }

  // Render ethnicity tab content
  const renderEthnicityTab = () => (
    <>
      {/* Chart */}
      {hasMeaningfulData(ethnicityData) && (
        <Box w="full" mb={3}>
          <Text fontSize="md" fontWeight="semibold" color="gray.700" mb={3} textAlign="center">
            Ethnicity Distribution
          </Text>
          <Box height="320px" w="full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ethnicityData.map(item => ({
                    ...item,
                    name: item.name.includes('Target') ? `Target ${item.name.replace('Target', '').trim()}` : item.name
                  }))}
                  cx="50%"
                  cy="42%"
                  labelLine={false}
                  outerRadius={75}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ value }) => `${safeToFixed(value, 1)}%`}
                >
                  {ethnicityData.map((entry: DemographicDataItem, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getChartColor(index, 'ethnicity', entry.name)} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={50}
                  wrapperStyle={{
                    paddingTop: '15px',
                    fontSize: '12px',
                    color: '#1F2937'
                  }}
                  iconType="rect"
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {/* Insights */}
      <Box bg="blue.50" p={4} borderRadius="lg" border="1px solid" borderColor="blue.200" w="full">
        <Text fontSize="sm" fontWeight="bold" color="blue.700" mb={2}>
          🎯 Ethnicity Insights
        </Text>
        <Text fontSize="sm" color="blue.600">
          <strong>{safeToFixed(tract.demographic_match_pct)}%</strong> of residents match your target ethnicity demographics.
          This represents a <strong>{getQualityLabel(tract.demographic_match_pct || 0).toLowerCase()}</strong> match
          for your business requirements.
        </Text>
      </Box>
    </>
  );

  // Render demographics tab content
  const renderDemographicsTab = () => (
    <>
      {/* Chart */}
      {hasMeaningfulData(demographicsData) && (
        <Box w="full" mb={3}>
          <Text fontSize="md" fontWeight="semibold" color="gray.700" mb={3} textAlign="center">
            Age & Gender Distribution
          </Text>
          <Box height="300px" w="full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demographicsData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <XAxis 
                  dataKey="name" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  fontSize={12}
                  label={{ value: 'Match %', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  fill="#8884d8" 
                  label={{ 
                    position: 'top', 
                    fontSize: 12, 
                    fill: '#374151',
                    formatter: (label: unknown) => {
                      const value = typeof label === 'number' ? label : 0;
                      return `${safeToFixed(value, 1)}%`;
                    }
                  }}
                >
                  {demographicsData.map((entry: DemographicDataItem, index: number) => (
                    <Cell key={`cell-${index}`} fill={getChartColor(index, 'demographics', entry.name)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {/* Insights */}
      <Box bg="purple.50" p={4} borderRadius="lg" border="1px solid" borderColor="purple.200" w="full">
        <Text fontSize="sm" fontWeight="bold" color="purple.700" mb={2}>
          🎯 Demographics Insights
        </Text>
        <VStack spacing={1} align="start">
          {(tract.age_match_pct !== undefined && tract.age_match_pct !== null) && (
            <Text fontSize="sm" color="purple.600">
              • <strong>{safeToFixed(tract.age_match_pct)}%</strong> of residents are in your target age range
            </Text>
          )}
          {(tract.gender_match_pct !== undefined && tract.gender_match_pct !== null) && (
            <Text fontSize="sm" color="purple.600">
              • <strong>{safeToFixed(tract.gender_match_pct)}%</strong> gender distribution alignment
            </Text>
          )}
        </VStack>
      </Box>
    </>
  );

  // Render income tab content
  const renderIncomeTab = () => (
    <>
      {/* Chart */}
      {hasMeaningfulData(incomeData) && (
        <Box w="full" mb={3}>
          <Text fontSize="md" fontWeight="semibold" color="black" mb={3} textAlign="center">
            Income Distribution
          </Text>
          <Box height="320px" w="full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeData.map(item => ({
                    ...item,
                    name: item.name.includes('Target') ? `Target ${item.name.replace('Target', '').trim()}` : item.name
                  }))}
                  cx="50%"
                  cy="42%"
                  labelLine={false}
                  outerRadius={75}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ value }) => `${safeToFixed(value, 1)}%`}
                >
                  {incomeData.map((entry: DemographicDataItem, index: number) => (
                    <Cell key={`cell-${index}`} fill={getChartColor(index, 'income', entry.name)} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={50}
                  wrapperStyle={{
                    paddingTop: '15px',
                    fontSize: '12px',
                    color: '#1F2937'
                  }}
                  iconType="rect"
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {/* Insights */}
      <Box bg="green.50" p={4} borderRadius="lg" border="1px solid" borderColor="green.200" w="full">
        <Text fontSize="sm" fontWeight="bold" color="green.700" mb={2}>
          🎯 Income Insights
        </Text>
        <Text fontSize="sm" color="green.600">
          <strong>{safeToFixed(tract.income_match_pct)}%</strong> of households are in your target income range.
          This indicates a <strong>{getQualityLabel(tract.income_match_pct || 0).toLowerCase()}</strong> economic
          alignment with your target market.
        </Text>
      </Box>
    </>
  );

  return (
    <Box maxW="100%" overflow="hidden">
      <VStack spacing={4}>
        {/* Stacked Charts */}
        <VStack spacing={4} w="full" maxW="100%">
          {/* Ethnicity Section */}
          {availableTabs.some(tab => tab.id === 'ethnicity') && (
            <Box w="full" p={6} bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" maxW="100%" overflow="hidden">
              <VStack spacing={4}>
                {/* Header */}
                <VStack spacing={3} w="full">
                  <HStack justify="space-between" align="center" w="full">
                    <HStack spacing={3}>
                      <Text fontSize="2xl">🌍</Text>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="lg" fontWeight="bold" color="gray.800">
                          Ethnicity Match
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          Population alignment analysis
                        </Text>
                      </VStack>
                    </HStack>
                    <VStack align="end" spacing={0}>
                      <Text 
                        fontSize="3xl" 
                        fontWeight="bold" 
                        color={`${getQualityColor(tract.demographic_match_pct || 0)}.500`}
                      >
                        {safeToFixed(tract.demographic_match_pct)}%
                      </Text>
                      <Text 
                        fontSize="sm" 
                        fontWeight="semibold" 
                        color={`${getQualityColor(tract.demographic_match_pct || 0)}.600`}
                      >
                        {getQualityLabel(tract.demographic_match_pct || 0)}
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
                
                {/* Content */}
                {renderEthnicityTab()}
              </VStack>
            </Box>
          )}

          {/* Demographics Section */}
          {availableTabs.some(tab => tab.id === 'demographics') && (
            <Box w="full" p={6} bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" maxW="100%" overflow="hidden">
              <VStack spacing={4}>
                {/* Header */}
                <VStack spacing={3} w="full">
                  <HStack justify="space-between" align="center" w="full">
                    <VStack align="start" spacing={1}>
                      <HStack spacing={3} align="center">
                        <Text fontSize="2xl">👥</Text>
                        <Text fontSize="lg" fontWeight="bold" color="gray.800">
                          Age & Gender Match
                        </Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.600" ml={12}>
                        Demographic distribution analysis
                      </Text>
                      {/* Age and Gender percentages below description */}
                      <HStack spacing={8} mt={3} ml={12}>
                        {(tract.age_match_pct !== undefined && tract.age_match_pct !== null) && (
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" color="gray.500" fontWeight="medium">Age</Text>
                            <Text 
                              fontSize="xl" 
                              fontWeight="bold" 
                              color={`${getQualityColor(tract.age_match_pct)}.500`}
                            >
                              {safeToFixed(tract.age_match_pct)}%
                            </Text>
                            <Text 
                              fontSize="xs" 
                              fontWeight="semibold" 
                              color={`${getQualityColor(tract.age_match_pct)}.600`}
                            >
                              {getQualityLabel(tract.age_match_pct)}
                            </Text>
                          </VStack>
                        )}
                        {(tract.gender_match_pct !== undefined && tract.gender_match_pct !== null) && (
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" color="gray.500" fontWeight="medium">Gender</Text>
                            <Text 
                              fontSize="xl" 
                              fontWeight="bold" 
                              color={`${getQualityColor(tract.gender_match_pct)}.500`}
                            >
                              {safeToFixed(tract.gender_match_pct)}%
                            </Text>
                            <Text 
                              fontSize="xs" 
                              fontWeight="semibold" 
                              color={`${getQualityColor(tract.gender_match_pct)}.600`}
                            >
                              {getQualityLabel(tract.gender_match_pct)}
                            </Text>
                          </VStack>
                        )}
                      </HStack>
                    </VStack>
                  </HStack>
                </VStack>
                
                {/* Content */}
                {renderDemographicsTab()}
              </VStack>
            </Box>
          )}

          {/* Income Section */}
          {availableTabs.some(tab => tab.id === 'income') && (
            <Box w="full" p={6} bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" maxW="100%" overflow="hidden">
              <VStack spacing={4}>
                {/* Header */}
                <VStack spacing={3} w="full">
                  <HStack justify="space-between" align="center" w="full">
                    <HStack spacing={3}>
                      <Text fontSize="2xl">💰</Text>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="lg" fontWeight="bold" color="gray.800">
                          Income Match
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          Economic alignment analysis
                        </Text>
                      </VStack>
                    </HStack>
                    <VStack align="end" spacing={0}>
                      <Text 
                        fontSize="3xl" 
                        fontWeight="bold" 
                        color={`${getQualityColor(tract.income_match_pct || 0)}.500`}
                      >
                        {safeToFixed(tract.income_match_pct)}%
                      </Text>
                      <Text 
                        fontSize="sm" 
                        fontWeight="semibold" 
                        color={`${getQualityColor(tract.income_match_pct || 0)}.600`}
                      >
                        {getQualityLabel(tract.income_match_pct || 0)}
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
                
                {/* Content */}
                {renderIncomeTab()}
              </VStack>
            </Box>
          )}
        </VStack>

        {/* Overall assessment */}
        {hasRealData && (
          <Box bg="blue.50" p={4} borderRadius="lg" border="1px solid" borderColor="blue.200" w="full">
            <Text fontSize="md" fontWeight="bold" color="blue.700" mb={2}>
              📋 Overall Demographic Assessment
            </Text>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color="blue.800" fontWeight="medium">
                📊 Combined Demographic Fit: {
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
              <Badge 
                colorScheme={
                  (() => {
                    const values = [tract.demographic_match_pct, tract.age_match_pct, tract.gender_match_pct, tract.income_match_pct];
                    const matches = values.filter((val): val is number => val !== null && val !== undefined && !isNaN(val) && val > 0);
                    if (matches.length === 0) return "gray";
                    const avgMatch = matches.reduce((sum: number, val: number) => sum + val, 0) / matches.length;
                    return getQualityColor(avgMatch);
                  })()
                }
                variant="subtle"
                size="sm"
              >
                {availableTabs.length} Factor{availableTabs.length !== 1 ? 's' : ''} Analyzed
              </Badge>
            </Flex>
          </Box>
        )}
      </VStack>
    </Box>
  );
}