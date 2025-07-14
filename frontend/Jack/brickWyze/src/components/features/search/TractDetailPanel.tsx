// src/components/features/search/TractDetailPanel.tsx
'use client';

import { 
  Box, 
  Flex, 
  Text, 
  VStack, 
  HStack,
  IconButton, 
  Badge,
  Progress,
  Divider,
  Button,
  SimpleGrid
} from '@chakra-ui/react';
import { CloseIcon, ExternalLinkIcon } from '@chakra-ui/icons';

interface TractResult {
  geoid: string;
  tract_name: string;
  display_name: string;
  nta_name: string;
  custom_score: number;
  resilience_score: number;
  avg_rent: number;
  demographic_score: number;
  foot_traffic_score: number;
  crime_score: number;
  flood_risk_score: number;
  rent_score?: number; // ✅ Make optional to match TractResultsList
  poi_score?: number; // ✅ Make optional to match TractResultsList
  main_crime_score?: number;
  crime_trend_direction?: string;
  crime_trend_change?: string;
  demographic_match_pct?: number;
  gender_match_pct?: number;
  age_match_pct?: number;
  income_match_pct?: number;
}

interface TractDetailPanelProps {
  tract: TractResult;
  onClose: () => void;
}

// Score meter component
function ScoreMeter({ 
  label, 
  score, 
  color = "#FF492C", 
  max = 100,
  icon 
}: { 
  label: string; 
  score: number; 
  color?: string; 
  max?: number;
  icon?: string;
}) {
  const percentage = Math.min((score / max) * 100, 100);
  
  return (
    <Box>
      <HStack justify="space-between" mb={1}>
        <Text fontSize="sm" fontWeight="medium" color="gray.700">
          {icon} {label}
        </Text>
        <Text fontSize="sm" fontWeight="bold" color={color}>
          {Math.round(score)}/{max}
        </Text>
      </HStack>
      <Progress value={percentage} size="sm" colorScheme="orange" bg="gray.100" />
    </Box>
  );
}

// Quick stat component
function QuickStat({ 
  label, 
  value, 
  subtext,
  icon 
}: { 
  label: string; 
  value: string | number; 
  subtext?: string;
  icon?: string;
}) {
  return (
    <Box textAlign="center" p={3} bg="gray.50" borderRadius="md">
      <Text fontSize="lg" mb={1}>
        {icon}
      </Text>
      <Text fontSize="lg" fontWeight="bold" color="gray.800">
        {value}
      </Text>
      <Text fontSize="xs" color="gray.600">
        {label}
      </Text>
      {subtext && (
        <Text fontSize="xs" color="gray.500" mt={1}>
          {subtext}
        </Text>
      )}
    </Box>
  );
}

export default function TractDetailPanel({ tract, onClose }: TractDetailPanelProps) {
  const resilienceScore = Math.round(tract.custom_score * 100);
  const rentText = tract.avg_rent ? `$${tract.avg_rent}` : 'N/A';
  
  return (
    <Flex direction="column" h="100%" bg="white" borderLeft="2px solid" borderColor="gray.200">
      {/* Header */}
      <Box p={4} borderBottom="1px solid" borderColor="gray.200" bg="white">
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={1} flex="1">
            <HStack>
              <Text fontSize="xl" fontWeight="bold" color="gray.800">
                🏘️ {tract.tract_name}
              </Text>
              <Badge bg="#FF492C" color="white" px={2} py={1} borderRadius="full">
                {resilienceScore}
              </Badge>
            </HStack>
            <Text fontSize="md" color="gray.600">
              {tract.nta_name}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Census Tract {tract.geoid}
            </Text>
          </VStack>
          
          <IconButton
            aria-label="Close details"
            icon={<CloseIcon />}
            variant="ghost"
            size="sm"
            onClick={onClose}
            _hover={{ bg: 'gray.100' }}
          />
        </HStack>
      </Box>

      {/* Scrollable content */}
      <VStack 
        align="stretch" 
        spacing={4} 
        p={4} 
        flex="1" 
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '3px' },
          '&::-webkit-scrollbar-thumb': { background: '#FF492C', borderRadius: '3px' }
        }}
      >
        {/* Quick stats grid */}
        <SimpleGrid columns={2} spacing={3}>
          <QuickStat
            icon="🏠"
            label="Rent PSF"
            value={rentText}
            subtext="per sq ft"
          />
          <QuickStat
            icon="📊"
            label="Overall Score"
            value={resilienceScore}
            subtext="out of 100"
          />
          <QuickStat
            icon="👥"
            label="Demo Fit"
            value={tract.demographic_match_pct ? `${Math.round(tract.demographic_match_pct * 100)}%` : 'N/A'}
            subtext="match rate"
          />
          <QuickStat
            icon="🚨"
            label="Safety"
            value={tract.crime_trend_direction === 'decreasing' ? 'Improving' : 
                  tract.crime_trend_direction === 'increasing' ? 'Declining' : 'Stable'}
            subtext={tract.crime_trend_change ? `${tract.crime_trend_change}%` : ''}
          />
        </SimpleGrid>

        <Divider />

        {/* Detailed scores */}
        <Box>
          <Text fontSize="lg" fontWeight="bold" mb={3} color="gray.800">
            📈 Score Breakdown
          </Text>
          <VStack spacing={3}>
            <ScoreMeter
              label="Foot Traffic"
              score={Math.round(tract.foot_traffic_score * 10)}
              color="#4299E1"
              icon="🚶"
            />
            <ScoreMeter
              label="Demographics"
              score={Math.round(tract.demographic_score * 100)}
              color="#48BB78"
              icon="👥"
            />
            <ScoreMeter
              label="Safety (Crime)"
              score={Math.round(tract.crime_score * 10)}
              color="#E53E3E"
              icon="🚨"
            />
            <ScoreMeter
              label="Flood Risk"
              score={Math.round(tract.flood_risk_score * 10)}
              color="#38B2AC"
              icon="🌊"
            />
            <ScoreMeter
              label="Rent Score"
              score={Math.round((tract.rent_score || 0) * 10)}
              color="#ED8936"
              icon="💰"
            />
            <ScoreMeter
              label="Points of Interest"
              score={Math.round((tract.poi_score || 0) * 10)}
              color="#9F7AEA"
              icon="📍"
            />
          </VStack>
        </Box>

        {/* Demographics details if available */}
        {(tract.age_match_pct || tract.income_match_pct || tract.gender_match_pct) && (
          <>
            <Divider />
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={3} color="gray.800">
                👥 Demographic Details
              </Text>
              <VStack spacing={2}>
                {tract.age_match_pct && (
                  <ScoreMeter
                    label="Age Match"
                    score={Math.round(tract.age_match_pct * 100)}
                    color="#4299E1"
                    icon="🎂"
                  />
                )}
                {tract.income_match_pct && (
                  <ScoreMeter
                    label="Income Match"
                    score={Math.round(tract.income_match_pct * 100)}
                    color="#48BB78"
                    icon="💵"
                  />
                )}
                {tract.gender_match_pct && (
                  <ScoreMeter
                    label="Gender Match"
                    score={Math.round(tract.gender_match_pct * 100)}
                    color="#ED8936"
                    icon="⚖️"
                  />
                )}
              </VStack>
            </Box>
          </>
        )}
      </VStack>

      {/* Action buttons */}
      <Box p={4} borderTop="1px solid" borderColor="gray.200" bg="gray.50">
        <VStack spacing={2}>
          <Button
            size="sm"
            bg="#FF492C"
            color="white"
            _hover={{ bg: "#E53E3E" }}
            leftIcon={<ExternalLinkIcon />}
            w="full"
            onClick={() => {
              // Open in Google Maps or similar
              const coords = `40.7589,-73.9851`; // You'd get real coords from tract data
              window.open(`https://www.google.com/maps/search/?api=1&query=${coords}`, '_blank');
            }}
          >
            View on Map
          </Button>
          
          <HStack spacing={2} w="full">
            <Button size="sm" variant="outline" flex="1">
              Save
            </Button>
            <Button size="sm" variant="outline" flex="1">
              Share
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Flex>
  );
}