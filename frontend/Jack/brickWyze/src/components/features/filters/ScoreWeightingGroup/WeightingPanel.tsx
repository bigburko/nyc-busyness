// Clean WeightingPanel.tsx with debug logs removed
import { Box, Text, VStack, IconButton, HStack } from '@chakra-ui/react';
import MySlider from './MySlider'; 
import { AddIcon } from '@chakra-ui/icons';

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
}

export default function WeightingPanel({
  activeWeights = [],
  inactiveLayers = [],
  onSliderChangeEnd,
  onRemove,
  onAdd,
}: Props) {
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
              onSliderChangeEnd(weight.id, val);
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
      </VStack>
    </Box>
  );
}