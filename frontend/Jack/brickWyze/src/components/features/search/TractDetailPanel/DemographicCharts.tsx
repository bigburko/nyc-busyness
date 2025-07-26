// src/components/features/search/TractDetailPanel/DemographicCharts.tsx
'use client';

import { 
  Box, VStack, HStack, Text, Badge, Flex
} from '@chakra-ui/react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from 'recharts';
import { TractResult } from '../../../../types/TractTypes';
import { useFilterStore } from '../../../../stores/filterStore';

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

// ✅ FIXED: Calculate combined demographic score using CORRECTED filter detection logic
const calculateCombinedDemographicScore = (tract: TractResult, filterStore: any): { percentage: number; details: string; components: Array<{ name: string; percentage: number; active: boolean }> } => {
  const components: Array<{ name: string; percentage: number; hasFilter: boolean }> = [];
  
  // Check each demographic component with CORRECTED filter detection
  if (tract.demographic_match_pct !== null && tract.demographic_match_pct !== undefined) {
    const hasEthnicityFilter = !!(filterStore.selectedEthnicities && filterStore.selectedEthnicities.length > 0);
    components.push({
      name: 'Ethnicity',
      percentage: tract.demographic_match_pct,
      hasFilter: hasEthnicityFilter
    });
  }
  
  if (tract.gender_match_pct !== null && tract.gender_match_pct !== undefined) {
    // ✅ REVERTED: Gender filter only active if exactly 1 gender selected (not both or neither)
    const selectedGenders = filterStore.selectedGenders || [];
    const hasGenderFilter = selectedGenders.length > 0 && selectedGenders.length < 2; // Only if exactly 1 gender selected
    components.push({
      name: 'Gender',
      percentage: tract.gender_match_pct,
      hasFilter: hasGenderFilter
    });
  }
  
  if (tract.age_match_pct !== null && tract.age_match_pct !== undefined) {
    // ✅ FIXED: Age filter detection - check against actual application defaults (18-100)
    const ageRange = filterStore.ageRange || [18, 100];
    const hasAgeFilter = !!(ageRange && (ageRange[0] > 18 || ageRange[1] < 100));
    components.push({
      name: 'Age',
      percentage: tract.age_match_pct,
      hasFilter: hasAgeFilter
    });
  }
  
  if (tract.income_match_pct !== null && tract.income_match_pct !== undefined) {
    // ✅ FIXED: Income filter detection - check against actual application defaults (0-250000)
    const incomeRange = filterStore.incomeRange || [0, 250000];
    const hasIncomeFilter = !!(incomeRange && (incomeRange[0] > 0 || incomeRange[1] < 250000));
    components.push({
      name: 'Income',
      percentage: tract.income_match_pct,
      hasFilter: hasIncomeFilter
    });
  }
  
  // Only include components where user has actually applied filters
  const activeComponents = components.filter(comp => comp.hasFilter);
  
  if (activeComponents.length === 0) {
    return { 
      percentage: 0, 
      details: "No demographic filters applied",
      components: components.map(c => ({ name: c.name, percentage: c.percentage, active: false }))
    };
  }
  
  // Calculate average of active components (SAME as Bricky)
  const combinedPercentage = activeComponents.reduce((sum, comp) => sum + comp.percentage, 0) / activeComponents.length;
  
  const details = activeComponents.map(comp => `${comp.name}: ${comp.percentage.toFixed(1)}%`).join(', ');
  
  console.log('🎯 [DemographicCharts] Combined demographic calculation (same as Bricky):', {
    activeComponents: activeComponents.map(c => `${c.name}: ${c.percentage}%`),
    combinedPercentage,
    details
  });
  
  return { 
    percentage: combinedPercentage,
    details: `Combined from ${details}`,
    components: components.map(c => ({ 
      name: c.name, 
      percentage: c.percentage, 
      active: c.hasFilter 
    }))
  };
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
  const filterStore = useFilterStore();
  
  console.log(`📊 DemographicCharts rendering for tract ${tract.geoid}`);
  
  // Check if we have real demographic data
  const hasRealData = hasRealDemographicData(tract);
  const hasProvidedData = rawDemographicData && (
    hasMeaningfulData(rawDemographicData.ethnicityData) ||
    hasMeaningfulData(rawDemographicData.demographicsData) ||
    hasMeaningfulData(rawDemographicData.incomeData)
  );

  // ✅ Calculate combined score using SAME logic as Bricky
  const combinedDemographicData = calculateCombinedDemographicScore(tract, filterStore);

  console.log('📊 [DemographicCharts] Data analysis:', {
    tractId: tract.geoid,
    hasRealData,
    hasProvidedData,
    combinedScore: combinedDemographicData.percentage,
    combinedDetails: combinedDemographicData.details,
    ethnicityMatch: tract.demographic_match_pct,
    genderMatch: tract.gender_match_pct,
    ageMatch: tract.age_match_pct,
    incomeMatch: tract.income_match_pct
  });

  // If no meaningful data, show appropriate message
  if (!hasRealData && !hasProvidedData) {
    return (
      <Box data-testid="demographic-chart" p={6} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200">
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
                    name: item.name.includes('Target') ? 
                      item.name.replace('Target', '🎯 Target') : item.name
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${safeToFixed(value, 1)}%`}
                >
                  {ethnicityData.map((entry: DemographicDataItem, index: number) => (
                    <Cell key={`cell-${index}`} fill={getChartColor(index, 'ethnicity', entry.name)} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {/* Insights */}
      <Box bg="blue.50" p={4} borderRadius="lg" border="1px solid" borderColor="blue.200" w="full">
        <Text fontSize="sm" fontWeight="bold" color="blue.700" mb={2}>
          🌍 Ethnicity Insights
        </Text>
        <Text fontSize="sm" color="blue.600" lineHeight="1.5">
          Your target demographic represents <strong>{safeToFixed(tract.demographic_match_pct)}%</strong> of this area's population.
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
                    name: item.name.includes('Target') ? 
                      item.name.replace('Target', '🎯 Target') : item.name
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${safeToFixed(value, 1)}%`}
                >
                  {incomeData.map((entry: DemographicDataItem, index: number) => (
                    <Cell key={`cell-${index}`} fill={getChartColor(index, 'income', entry.name)} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {/* Insights */}
      <Box bg="green.50" p={4} borderRadius="lg" border="1px solid" borderColor="green.200" w="full">
        <Text fontSize="sm" fontWeight="bold" color="green.700" mb={2}>
          💰 Income Insights
        </Text>
        <Text fontSize="sm" color="green.600" lineHeight="1.5">
          <strong>{safeToFixed(tract.income_match_pct)}%</strong> of households fall within your target income range.
          This indicates a <strong>{getQualityLabel(tract.income_match_pct || 0).toLowerCase()}</strong> economic
          alignment with your target market.
        </Text>
      </Box>
    </>
  );

  return (
    <Box data-testid="demographic-chart" maxW="100%" overflow="hidden">
      <VStack spacing={4}>
        {/* Combined Score Summary */}
        <Box bg="blue.50" p={4} borderRadius="lg" border="1px solid" borderColor="blue.200" w="full">
          <Text fontSize="sm" fontWeight="bold" color="blue.700">
            📋 Overall Demographic Assessment (Bricky's Analysis)
          </Text>
          
          {/* Combined Score - Same as Bricky */}
          <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="blue.300">
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Text fontSize="lg" fontWeight="bold" color="blue.800">
                  🎯 Combined Demographic Fit
                </Text>
                <Text fontSize="sm" color="blue.600">
                  {combinedDemographicData.details}
                </Text>
              </VStack>
              <VStack align="end" spacing={0}>
                <Text 
                  fontSize="2xl" 
                  fontWeight="bold" 
                  color={`${getQualityColor(combinedDemographicData.percentage)}.500`}
                >
                  {safeToFixed(combinedDemographicData.percentage)}%
                </Text>
                <Text 
                  fontSize="sm" 
                  fontWeight="semibold" 
                  color={`${getQualityColor(combinedDemographicData.percentage)}.600`}
                >
                  {getQualityLabel(combinedDemographicData.percentage)}
                </Text>
              </VStack>
            </HStack>
          </Box>
          
          {/* Component Breakdown */}
          <VStack spacing={2} align="stretch">
            <Text fontSize="sm" fontWeight="semibold" color="blue.700">
              📊 Component Analysis
            </Text>
            {combinedDemographicData.components.map((component, index) => (
              <HStack key={index} justify="space-between" p={2} bg={component.active ? "blue.100" : "gray.100"} borderRadius="md">
                <HStack spacing={2}>
                  <Badge 
                    colorScheme={component.active ? "blue" : "gray"} 
                    variant={component.active ? "solid" : "outline"}
                    size="sm"
                  >
                    {component.active ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                  <Text fontSize="sm" color={component.active ? "blue.800" : "gray.600"} fontWeight="medium">
                    {component.name}
                  </Text>
                </HStack>
                <Text 
                  fontSize="sm" 
                  fontWeight="bold" 
                  color={component.active ? `${getQualityColor(component.percentage)}.600` : "gray.500"}
                >
                  {safeToFixed(component.percentage)}%
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>

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
      </VStack>
    </Box>
  );
}