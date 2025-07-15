// src/components/ScoreWeightingGroup/AddWeightSelector.tsx
'use client';

import { Button, Flex, HStack } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';

// Export interface so parent components can use it
export interface Layer {
  id: string;
  label: string;
  icon: string;
  color: string;
}

interface Props {
  layers: Layer[];
  onAdd: (layer: Layer) => void;
}

export default function AddWeightSelector({ layers, onAdd }: Props) {
  if (layers.length === 0) {
    return null;
  }

  return (
    <Flex direction="column" gap={2} pt={2} align="start">
      <HStack wrap="wrap" spacing={2} gap={2}>
        {layers.map((layer) => (
          <Button
            key={layer.id}
            bg={layer.color}
            color="white"
            _hover={{ bg: layer.color, opacity: 0.9 }}
            _active={{ bg: layer.color, opacity: 1 }}
            onClick={() => onAdd(layer)}
            size="sm"
            borderRadius="full"
            leftIcon={<span>{layer.icon}</span>}
            rightIcon={<AddIcon boxSize={2.5} />}
          >
            {layer.label}
          </Button>
        ))}
      </HStack>
    </Flex>
  );
}
