// src/components/features/filters/DemographicGroup/TimePeriodSelect.tsx

import React from 'react';
import {
  Box,
  Button,
  HStack,
  Text,
  VStack,
  useColorModeValue,
  Tooltip,
  Badge
} from '@chakra-ui/react';

interface TimePeriodOption {
  id: string;
  label: string;
  icon: string;
  description: string;
}

const timePeriodOptions: TimePeriodOption[] = [
  { id: 'morning', label: 'Morning', icon: '🌅', description: 'Early hours traffic (6 AM - 12 PM)' },
  { id: 'afternoon', label: 'Afternoon', icon: '☀️', description: 'Midday activity (12 PM - 6 PM)' },
  { id: 'evening', label: 'Night', icon: '🌙', description: 'Night activity (6 PM - 12 AM)' }
];

interface TimePeriodSelectProps {
  value?: string[];
  onChange?: (periods: string[]) => void;
}

const TimePeriodSelect: React.FC<TimePeriodSelectProps> = ({ 
  value, 
  onChange 
}) => {
  // ✅ COMPLETELY REMOVED all store hooks to eliminate infinite loops
  // Just use props or default values
  const currentSelection = value || ['morning', 'afternoon', 'evening'];

  // Color mode values (matching your existing patterns)
  const buttonBg = useColorModeValue('gray.100', 'gray.700');
  const selectedButtonBg = useColorModeValue('#FF492C', '#FF6B47');
  const selectedButtonColor = useColorModeValue('white', 'white');

  const handleToggle = (periodId: string) => {
    const isSelected = currentSelection.includes(periodId);
    let newSelection: string[];
    
    if (isSelected) {
      // Remove if selected (but keep at least one)
      if (currentSelection.length > 1) {
        newSelection = currentSelection.filter(p => p !== periodId);
        console.log('🕐 [TimePeriod] Removing:', periodId, 'New selection:', newSelection);
      } else {
        // Don't allow removing the last one
        console.log('🕐 [TimePeriod] Cannot remove last period:', periodId);
        return;
      }
    } else {
      // Add if not selected
      newSelection = [...currentSelection, periodId];
      console.log('🕐 [TimePeriod] Adding:', periodId, 'New selection:', newSelection);
    }
    
    // Call onChange if provided
    onChange?.(newSelection);
  };

  const isPeriodSelected = (periodId: string): boolean => {
    return currentSelection.includes(periodId);
  };

  console.log('🕐 [TimePeriod] Rendering with selection:', currentSelection);

  return (
    <VStack spacing={5} align="stretch">
      {/* Clean button layout matching Gender component style */}
      <VStack spacing={3} align="stretch">
        {timePeriodOptions.map((period) => (
          <Tooltip 
            key={period.id} 
            label={period.description} 
            placement="top"
            hasArrow
          >
            <Button
              onClick={() => handleToggle(period.id)}
              bg={isPeriodSelected(period.id) ? selectedButtonBg : buttonBg}
              color={isPeriodSelected(period.id) ? selectedButtonColor : 'gray.700'}
              _hover={{
                bg: isPeriodSelected(period.id) ? '#E53E3E' : 'gray.200',
                transform: 'translateY(-1px)',
                boxShadow: 'lg'
              }}
              _active={{
                transform: 'translateY(0px)'
              }}
              size="lg"
              borderRadius="xl"
              border={isPeriodSelected(period.id) ? "2px solid #FF492C" : "1px solid rgba(255, 73, 44, 0.1)"}
              transition="all 0.2s ease"
              boxShadow={isPeriodSelected(period.id) ? "0 4px 12px rgba(255, 73, 44, 0.25)" : "0 2px 4px rgba(0,0,0,0.05)"}
              fontWeight={isPeriodSelected(period.id) ? "bold" : "medium"}
              h="64px"
              w="full"
              position="relative"
              overflow="hidden"
            >
              <HStack spacing={4} w="full" justify="space-between" px={2}>
                {/* Left side - Icon and text */}
                <HStack spacing={4}>
                  <Box 
                    fontSize="2xl"
                    filter={isPeriodSelected(period.id) ? "brightness(1.2)" : "brightness(0.9)"}
                    transition="filter 0.2s"
                  >
                    {period.icon}
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text 
                      fontSize="md" 
                      fontWeight={isPeriodSelected(period.id) ? "bold" : "semibold"}
                      lineHeight="short"
                    >
                      {period.label}
                    </Text>
                    <Text 
                      fontSize="xs" 
                      opacity={isPeriodSelected(period.id) ? 0.9 : 0.7}
                      lineHeight="short"
                    >
                      {period.description.split('(')[0].trim()}
                    </Text>
                  </VStack>
                </HStack>

                {/* Right side - Check mark */}
                {isPeriodSelected(period.id) && (
                  <Box>
                    <Text 
                      fontSize="lg" 
                      color="white" 
                      fontWeight="bold"
                      filter="drop-shadow(0 1px 2px rgba(0,0,0,0.2))"
                    >
                      ✓
                    </Text>
                  </Box>
                )}
              </HStack>
            </Button>
          </Tooltip>
        ))}
      </VStack>
      
      {/* Clean status bar */}
      <Box 
        bg="rgba(255, 73, 44, 0.05)" 
        borderRadius="lg"
        px={4}
        py={3}
        border="1px solid rgba(255, 73, 44, 0.1)"
      >
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Text fontSize="xs" color="gray.600" fontWeight="medium">
              Selected: {currentSelection.join(', ')}
            </Text>
            <Text fontSize="xs" color="gray.500" fontStyle="italic">
              At least one time period must be selected
            </Text>
          </VStack>
          <Badge 
            bg="#FF492C" 
            color="white" 
            borderRadius="full"
            fontSize="xs"
            px={3}
            py={1}
            fontWeight="bold"
          >
            {currentSelection.length}
          </Badge>
        </HStack>
      </Box>
    </VStack>
  );
};

export default TimePeriodSelect;