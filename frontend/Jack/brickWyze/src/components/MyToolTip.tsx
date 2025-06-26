'use client';

import { Tooltip, Box } from '@chakra-ui/react';
import { IoIosInformationCircle } from 'react-icons/io';
import React from 'react';

interface Props {
  label: string;
}

export default function MyToolTip({ label }: Props) {
  return (
    <Tooltip
      hasArrow
      bg="gray.300"
      color="black"
      borderRadius="md"
      label={<Box color="black">{label}</Box>}
    >
      <Box
        as="span"
        cursor="pointer"
        display="inline-flex"
        alignItems="center"
      >
        <IoIosInformationCircle />
      </Box>
    </Tooltip>
  );
}
