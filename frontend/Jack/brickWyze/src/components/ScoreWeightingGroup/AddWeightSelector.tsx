// src/components/AddWeightSelector.tsx
'use client';

import { HStack, Button, Flex } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';

// Export interface so WeightingPanel can use it
export interface Layer {
  id: string;
  label: string;
  icon: string;
  color: string;
  value?: number; // Value is optional for inactive layers
}

interface Props {
  layers: Layer[];
  onAdd: (layer: Layer) => void;
}

export default function AddWeightSelector({ layers, onAdd }: Props) {
  if (layers.length === 0) return null;

  return (
    <Flex direction="column" gap={2} pt={4} align="start">
      <HStack wrap="wrap" spacing={2}>
        {layers.map((layer) => (
          <Button
            key={layer.id}
            bg={layer.color}
            color="white"
            _hover={{ bg: layer.color, opacity: 0.8 }}
            _active={{ bg: layer.color, opacity: 0.9 }}
            onClick={() => onAdd(layer)}
            size="sm"
            borderRadius="full"
          >
            <Flex align="center" gap={1.5}>
              <span>
                {layer.icon} {layer.label}
              </span>
              <AddIcon boxSize={2.5} />
            </Flex>
          </Button>
        ))}
      </HStack>
    </Flex>
  );
}
