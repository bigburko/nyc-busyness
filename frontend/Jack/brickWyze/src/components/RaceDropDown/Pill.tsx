// Pill.tsx
import { Box, Text, CloseButton, Flex } from '@chakra-ui/react';

interface DisplayPill {
  type: 'group' | 'individual';
  label: string;
  value: string;
  actualValue?: string;
  groupChildren?: string[];
  level?: number;
}

interface PillProps {
  pill: DisplayPill;
  onRemove: (pill: DisplayPill) => void;
}

export function Pill({ pill, onRemove }: PillProps) {
  return (
    <Flex
      bg="gray.100"
      borderRadius="md"
      px={2}
      py={1}
      alignItems="center"
      maxW="100%"
    >
      <Text fontSize="sm" isTruncated maxW="200px">
        {pill.label}
      </Text>
      <CloseButton
        size="sm"
        ml={1}
        onClick={() => onRemove(pill)}
      />
    </Flex>
  );
}
