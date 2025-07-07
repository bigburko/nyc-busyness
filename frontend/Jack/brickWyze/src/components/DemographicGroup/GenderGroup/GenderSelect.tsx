'use client';

import { Box, Button, FormLabel, VStack, Text } from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';

interface GenderSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const GenderSelect: React.FC<GenderSelectProps> = ({ value, onChange }) => {
  const genders = ['male', 'female'];

  const toggleGender = (gender: string) => {
    if (value.includes(gender)) {
      if (value.length === 1) return; // prevent empty selection
      onChange(value.filter(g => g !== gender));
    } else {
      onChange([...value, gender]);
    }
  };

  const isSelected = (gender: string) => value.includes(gender);

  return (
    <Box>
      <FormLabel mb={2}>Select Gender(s)</FormLabel>
      <VStack spacing={2} align="stretch">
        {genders.map((gender) => (
          <Button
            key={gender}
            onClick={() => toggleGender(gender)}
            justifyContent="space-between"
            variant="outline"
            bg={isSelected(gender) ? '#FF6B5E' : 'white'}
            color={isSelected(gender) ? 'white' : '#2D3748'}
            borderColor={isSelected(gender) ? '#FF6B5E' : '#CBD5E0'}
            _hover={{ bg: isSelected(gender) ? '#FF5A4C' : '#f9f9f9' }}
            size="sm"
            fontWeight="medium"
            borderRadius="md"
            px={4}
          >
            {gender.charAt(0).toUpperCase() + gender.slice(1)}
            {isSelected(gender) && <CheckIcon boxSize={3.5} ml={2} />}
          </Button>
        ))}
      </VStack>
      {value.length === 0 && (
        <Text fontSize="sm" color="red.500" mt={2}>
          Please select at least one gender.
        </Text>
      )}
    </Box>
  );
};

export default GenderSelect;
