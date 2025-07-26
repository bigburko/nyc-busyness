// src/components/ui/LoadingOverlay.tsx
'use client';

import { 
  Box, 
  VStack, 
  Text, 
  Spinner, 
  Portal,
  useColorModeValue,
  Progress
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react'; // ✅ FIXED: Import from @emotion/react
import { useState, useEffect } from 'react';

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

interface LoadingOverlayProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  progress?: number;
  steps?: string[];
  currentStep?: number; // ✅ CONFIRMED: Expects number (step index)
}

export function LoadingOverlay({ 
  isOpen, 
  title = "Generating Report", 
  message = "Please wait while we prepare your comprehensive location analysis...",
  progress,
  steps = [
    "Analyzing location data",
    "Processing AI insights", 
    "Generating charts",
    "Compiling PDF report",
    "Finalizing document"
  ],
  currentStep = 0 // ✅ CONFIRMED: Default to step index 0
}: LoadingOverlayProps) {
  const [dots, setDots] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(currentStep);

  const bgColor = useColorModeValue('rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');

  // Animated dots effect
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen]);

  // ✅ FIXED: Update internal step index when prop changes
  useEffect(() => {
    setCurrentStepIndex(currentStep);
  }, [currentStep]);

  // Auto-progress through steps if no explicit progress provided
  useEffect(() => {
    if (!isOpen || progress !== undefined) return;

    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2000); // Change step every 2 seconds

    return () => clearInterval(interval);
  }, [isOpen, progress, steps.length]);

  if (!isOpen) return null;

  const currentProgress = progress ?? ((currentStepIndex + 1) / steps.length) * 100;
  const displayStep = steps[currentStepIndex] || steps[0];

  return (
    <Portal>
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg={bgColor}
        backdropFilter="blur(8px)"
        zIndex={2000}
        display="flex"
        alignItems="center"
        justifyContent="center"
        animation={`${fadeIn} 0.3s ease-out`}
      >
        <Box
          bg={cardBg}
          borderRadius="2xl"
          boxShadow="2xl"
          p={8}
          maxW="480px"
          w="90%"
          mx="auto"
          animation={`${pulse} 2s ease-in-out infinite`}
        >
          <VStack spacing={6} align="center">
            {/* Spinner */}
            <Spinner
              size="xl"
              color="orange.500"
              thickness="4px"
              speed="0.8s"
            />

            {/* Title */}
            <Text 
              fontSize="2xl" 
              fontWeight="bold" 
              color={textColor}
              textAlign="center"
            >
              {title}
            </Text>

            {/* Progress Bar */}
            <Box w="full">
              <Progress 
                value={currentProgress} 
                colorScheme="orange" 
                borderRadius="full"
                bg="gray.100"
                h="3"
              />
              <Text 
                fontSize="sm" 
                color={subtextColor}
                textAlign="center"
                mt={2}
              >
                {Math.round(currentProgress)}% Complete
              </Text>
            </Box>

            {/* Current Step */}
            <VStack spacing={2} align="center" w="full">
              <Text 
                fontSize="md" 
                color={textColor}
                textAlign="center"
                fontWeight="medium"
              >
                {displayStep}{dots}
              </Text>
              <Text 
                fontSize="sm" 
                color={subtextColor}
                textAlign="center"
                lineHeight="1.5"
              >
                {message}
              </Text>
            </VStack>

            {/* Step Indicator */}
            <Box w="full">
              <VStack spacing={1} align="stretch">
                {steps.map((step, index) => (
                  <Box
                    key={index}
                    display="flex"
                    alignItems="center"
                    opacity={index <= currentStepIndex ? 1 : 0.4}
                    transition="all 0.3s ease"
                  >
                    <Box
                      w="3"
                      h="3"
                      borderRadius="full"
                      bg={index <= currentStepIndex ? "orange.500" : "gray.300"}
                      mr={3}
                      transition="all 0.3s ease"
                      flexShrink={0}
                    />
                    <Text 
                      fontSize="sm" 
                      color={index <= currentStepIndex ? textColor : subtextColor}
                      transition="all 0.3s ease"
                    >
                      {step}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Portal>
  );
}

// Hook for easier usage
export function useLoadingOverlay() {
  const [state, setState] = useState({
    isOpen: false,
    title: "Loading",
    message: "Please wait...",
    progress: 0,
    currentStep: 0
  });

  const showLoading = (options?: Partial<typeof state>) => {
    setState(prev => ({ ...prev, isOpen: true, ...options }));
  };

  const updateProgress = (progress: number, currentStep?: number) => {
    setState(prev => ({ ...prev, progress, currentStep: currentStep ?? prev.currentStep }));
  };

  const hideLoading = () => {
    setState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    LoadingOverlay: (props: Omit<LoadingOverlayProps, 'isOpen'>) => (
      <LoadingOverlay {...props} isOpen={state.isOpen} />
    ),
    showLoading,
    updateProgress,
    hideLoading,
    isLoading: state.isOpen
  };
}