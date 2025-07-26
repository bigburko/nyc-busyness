// src/components/ui/CollapsibleSection.tsx - ENHANCED: Better Progressive Disclosure + Mobile-First (No Show More)
'use client';

import {
  Box,
  Collapse,
  Flex,
  IconButton,
  Heading,
  useDisclosure,
  Text,
  Badge,
  useBreakpointValue,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import React, { ReactNode } from 'react';
import MyToolTip from './MyToolTip';

interface CollapsibleSectionProps {
  title: string;
  tooltip?: string;
  defaultIsOpen?: boolean;
  children: ReactNode;
  glowing?: boolean;
  priority?: 'high' | 'medium' | 'low'; // NEW: Priority levels for smart defaults
  itemCount?: number; // NEW: Show count of items in section
  summary?: string; // NEW: One-line summary when collapsed
  userType?: 'casual' | 'business' | 'analyst' | 'power'; // NEW: User type for smart defaults
}

export default function CollapsibleSection({
  title,
  tooltip,
  defaultIsOpen = false,
  children,
  glowing = false,
  priority = 'medium',
  itemCount,
  summary,
  userType = 'casual',
}: CollapsibleSectionProps) {
  
  // 🎯 SMART DEFAULTS: Auto-expand based on priority and user type
  const smartDefaultOpen = (() => {
    if (defaultIsOpen !== undefined) return defaultIsOpen;
    
    // Business users: Always show high priority, sometimes medium
    if (userType === 'business') {
      return priority === 'high' || (priority === 'medium' && Math.random() > 0.5);
    }
    
    // Casual users: Only high priority
    if (userType === 'casual') {
      return priority === 'high';
    }
    
    // Analyst/Power users: Show high and medium
    return priority !== 'low';
  })();

  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: smartDefaultOpen });
  
  // Responsive design
  const isMobile = useBreakpointValue({ base: true, md: false });
  const headerPadding = useBreakpointValue({ base: 3, md: 4 });
  const titleSize = useBreakpointValue({ base: 'sm', md: 'md' });

  // Priority-based styling
  const getPriorityColor = () => {
    switch (priority) {
      case 'high': return 'blue.500';
      case 'medium': return 'gray.600';
      case 'low': return 'gray.400';
      default: return 'gray.600';
    }
  };

  const getPriorityBg = () => {
    switch (priority) {
      case 'high': return '#E3F2FD';
      case 'medium': return '#FFD3CC';
      case 'low': return '#F5F5F5';
      default: return '#FFD3CC';
    }
  };

  // Pulsing glow animation styles
  const pulseGlowStyles = glowing ? {
    animation: 'pulseGlow 2.5s ease-in-out infinite',
    border: '3px solid',
    '@keyframes pulseGlow': {
      '0%': {
        boxShadow: '0 0 5px rgba(255, 165, 0, 0.7), 0 0 10px rgba(255, 165, 0, 0.5), 0 0 15px rgba(255, 165, 0, 0.3)',
        borderColor: 'rgba(255, 165, 0, 0.8)'
      },
      '50%': {
        boxShadow: '0 0 10px rgba(255, 165, 0, 0.9), 0 0 20px rgba(255, 165, 0, 0.7), 0 0 25px rgba(255, 165, 0, 0.5)',
        borderColor: 'rgba(255, 165, 0, 1)'
      },
      '100%': {
        boxShadow: '0 0 5px rgba(255, 165, 0, 0.7), 0 0 10px rgba(255, 165, 0, 0.5), 0 0 15px rgba(255, 165, 0, 0.3)',
        borderColor: 'rgba(255, 165, 0, 0.8)'
      }
    }
  } : {};

  return (
    <Box 
      w="100%" 
      bg={glowing ? "rgba(255, 255, 255, 0.8)" : "transparent"}
      borderRadius={glowing ? "2xl" : "lg"}
      boxShadow={glowing ? "0 4px 20px rgba(255, 73, 44, 0.08)" : "0 1px 3px rgba(0,0,0,0.1)"}
      backdropFilter={glowing ? "blur(10px)" : "none"}
      p={glowing ? 1 : 0}
      sx={pulseGlowStyles}
      mb={3}
    >
      {/* Header - Click to toggle */}
      <Flex
        align="center"
        justify="space-between"
        cursor="pointer"
        px={headerPadding}
        py={headerPadding}
        borderRadius="lg"
        bg={glowing ? "transparent" : getPriorityBg()}
        onClick={onToggle}
        _hover={{ 
          bg: glowing ? 'rgba(255, 73, 44, 0.05)' : 'rgba(0,0,0,0.05)',
          transform: 'translateY(-1px)'
        }}
        transition="all 0.2s"
        position="relative"
        overflow="hidden"
      >
        <Flex align="center" gap={3} flex="1">
          {/* Priority indicator */}
          {priority === 'high' && (
            <Box
              w="4px"
              h="4px"
              borderRadius="full"
              bg="blue.500"
              animation="pulse 2s infinite"
            />
          )}

          <Flex direction="column" align="start" flex="1">
            <Flex align="center" gap={2} wrap="wrap">
              <Heading as="h4" size={titleSize} color={getPriorityColor()}>
                {title}
              </Heading>
              
              {itemCount && (
                <Badge
                  colorScheme={priority === 'high' ? 'blue' : 'gray'}
                  size="sm"
                  borderRadius="full"
                >
                  {itemCount}
                </Badge>
              )}

              {tooltip && (
                <Box onClick={e => e.stopPropagation()}>
                  <MyToolTip label={title}>{tooltip}</MyToolTip>
                </Box>
              )}
            </Flex>

            {/* Summary text when collapsed */}
            {!isOpen && summary && (
              <Text 
                fontSize="xs" 
                color="gray.600" 
                mt={1}
                isTruncated
                maxW="280px"
              >
                {summary}
              </Text>
            )}
          </Flex>
        </Flex>

        <IconButton
          icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          aria-label="Toggle section"
          size={isMobile ? "sm" : "md"}
          variant="ghost"
          color={getPriorityColor()}
          fontSize={isMobile ? "16px" : "20px"}
          onClick={e => {
            e.stopPropagation();
            onToggle();
          }}
          _hover={{ bg: 'rgba(0,0,0,0.1)' }}
        />
      </Flex>

      {/* Collapsible content */}
      <Collapse in={isOpen} animateOpacity>
        <Box 
          mt={glowing ? 0 : 2} 
          px={glowing ? 3 : headerPadding}
          py={glowing ? 0 : 0}
          pt={glowing ? 0 : 0}
        >
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}