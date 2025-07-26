// WeightingPanel.tsx with auto-balancing functionality
import { Box, Text, VStack, IconButton, HStack } from '@chakra-ui/react';
import MySlider from './MySlider'; 
import { AddIcon } from '@chakra-ui/icons';
import { useCallback } from 'react';

export interface Layer {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface Weighting extends Layer {
  value: number;
}

export interface Props {
  activeWeights: Weighting[];
  inactiveLayers: Layer[];
  onSliderChangeEnd: (id: string, newValue: number) => void; 
  onRemove: (id: string) => void;
  onAdd: (layer: Layer) => void;
  onWeightsUpdated: (weights: Weighting[]) => void; // New prop for auto-balancing
}

export default function WeightingPanel({
  activeWeights = [],
  inactiveLayers = [],
  onSliderChangeEnd,
  onRemove,
  onAdd,
  onWeightsUpdated,
}: Props) {

  // Auto-balancing logic
  const handleSliderChange = useCallback((changedId: string, newValue: number) => {
    if (activeWeights.length <= 1) {
      // If only one slider, just update it
      onSliderChangeEnd(changedId, newValue);
      return;
    }

    // Create a copy of active weights
    const updatedWeights = [...activeWeights];
    const changedIndex = updatedWeights.findIndex(w => w.id === changedId);
    
    if (changedIndex === -1) return;

    // Update the changed slider
    updatedWeights[changedIndex] = { ...updatedWeights[changedIndex], value: newValue };

    // Calculate remaining percentage to distribute
    const remainingPercentage = 100 - newValue;
    const otherWeights = updatedWeights.filter((_, index) => index !== changedIndex);
    
    if (otherWeights.length === 0) return;

    // Calculate current total of other weights
    const currentOtherTotal = otherWeights.reduce((sum, weight) => sum + weight.value, 0);

    // Redistribute the remaining percentage proportionally
    if (currentOtherTotal > 0) {
      // Proportional redistribution
      otherWeights.forEach((weight, index) => {
        const proportion = weight.value / currentOtherTotal;
        const newWeightValue = Math.round(remainingPercentage * proportion);
        
        // Find the original index in updatedWeights
        const originalIndex = updatedWeights.findIndex(w => w.id === weight.id);
        if (originalIndex !== -1) {
          updatedWeights[originalIndex] = { 
            ...updatedWeights[originalIndex], 
            value: Math.max(0, newWeightValue) 
          };
        }
      });
    } else {
      // If all other weights are 0, distribute equally
      const equalShare = Math.floor(remainingPercentage / otherWeights.length);
      const remainder = remainingPercentage % otherWeights.length;
      
      otherWeights.forEach((weight, index) => {
        const originalIndex = updatedWeights.findIndex(w => w.id === weight.id);
        if (originalIndex !== -1) {
          const value = equalShare + (index < remainder ? 1 : 0);
          updatedWeights[originalIndex] = { 
            ...updatedWeights[originalIndex], 
            value: Math.max(0, value) 
          };
        }
      });
    }

    // Ensure the total is exactly 100% by adjusting the last non-changed weight
    const total = updatedWeights.reduce((sum, weight) => sum + weight.value, 0);
    if (total !== 100) {
      const difference = 100 - total;
      const lastOtherIndex = updatedWeights.findIndex((weight, index) => 
        index !== changedIndex && weight.value > 0
      );
      
      if (lastOtherIndex !== -1) {
        updatedWeights[lastOtherIndex] = {
          ...updatedWeights[lastOtherIndex],
          value: Math.max(0, updatedWeights[lastOtherIndex].value + difference)
        };
      }
    }

    // Update all weights through the callback
    onWeightsUpdated(updatedWeights);
    
    // Also call the original callback for the changed slider
    onSliderChangeEnd(changedId, newValue);
  }, [activeWeights, onSliderChangeEnd, onWeightsUpdated]);

  return (
    <Box>
      <VStack spacing={4}>
        {activeWeights.map((weight) => (
          <MySlider
            key={weight.id}
            label={weight.label}
            icon={weight.icon}
            filledTrack={weight.color}
            value={weight.value}
            onChangeEnd={(val: number) => {
              handleSliderChange(weight.id, val);
            }}
            canBeRemoved={activeWeights.length > 1}
            onRemove={() => {
              onRemove(weight.id);
            }}
          />
        ))}
        {inactiveLayers.length > 0 && (
          <Box w="100%" mt={4}>
            <Text fontSize="sm" mb={2}>Add More</Text>
            <VStack spacing={2} align="stretch">
              {inactiveLayers.map((layer) => (
                <HStack
                  key={layer.id}
                  spacing={3}
                  justify="space-between"
                  p={2}
                  borderRadius="md"
                  bg="white"
                  boxShadow="sm"
                >
                  <HStack spacing={2}>
                    <Box
                      bg={layer.color}
                      borderRadius="full"
                      boxSize="6"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="sm"
                      color="white"
                    >
                      {layer.icon}
                    </Box>
                    <Text fontWeight="medium">{layer.label}</Text>
                  </HStack>
                  <IconButton
                    icon={<AddIcon />}
                    size="sm"
                    aria-label="Add layer"
                    onClick={() => {
                      onAdd(layer);
                    }}
                    variant="ghost"
                  />
                </HStack>
              ))}
            </VStack>
          </Box>
        )}
        
        {/* Total percentage display */}
        {activeWeights.length > 1 && (
          <Box 
            w="100%" 
            p={3} 
            bg="gray.50" 
            borderRadius="md" 
            border="1px solid"
            borderColor="gray.200"
          >
            <Text fontSize="sm" fontWeight="bold" textAlign="center">
              Total: {activeWeights.reduce((sum, weight) => sum + weight.value, 0)}%
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}