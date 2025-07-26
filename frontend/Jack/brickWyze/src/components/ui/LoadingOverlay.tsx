// src/components/ui/LoadingOverlay.tsx
'use client';

import { 
  Box, 
  VStack, 
  Text, 
  Spinner, 
  Portal,
  useColorModeValue,
  keyframes,
  Progress
} from '@chakra-ui/react';
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
  currentStep?: number;
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
  currentStep = 0
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

  return (
    <Portal>
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg={bgColor}
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={9999}
        backdropFilter="blur(8px)"
        animation={`${fadeIn} 0.3s ease-out`}
      >
        <Box
          bg={cardBg}
          borderRadius="2xl"
          p={10}
          maxW="400px"
          w="90%"
          boxShadow="2xl"
          border="1px solid"
          borderColor="whiteAlpha.200"
          textAlign="center"
          animation={`${fadeIn} 0.4s ease-out 0.1s both`}
        >
          <VStack spacing={6}>
            {/* Spinner */}
            <Box position="relative">
              <Spinner
                size="xl"
                thickness="4px"
                speed="0.65s"
                color="blue.500"
                emptyColor="gray.200"
              />
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                fontSize="2xl"
                animation={`${pulse} 2s ease-in-out infinite`}
              >
                📊
              </Box>
            </Box>

            {/* Title */}
            <VStack spacing={2}>
              <Text 
                fontSize="xl" 
                fontWeight="bold" 
                color={textColor}
              >
                {title}{dots}
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

            {/* Progress Bar */}
            <Box w="100%">
              <Progress 
                value={currentProgress} 
                colorScheme="blue" 
                borderRadius="full"
                bg="gray.100"
                size="sm"
                hasStripe
                isAnimated
              />
              <Text 
                fontSize="xs" 
                color={subtextColor} 
                mt={2}
                textAlign="center"
              >
                {Math.round(currentProgress)}% Complete
              </Text>
            </Box>

            {/* Current Step */}
            <VStack spacing={2} w="100%">
              <Text 
                fontSize="sm" 
                fontWeight="semibold" 
                color={textColor}
              >
                Current Step:
              </Text>
              
              <Box
                bg="blue.50"
                color="blue.700"
                px={4}
                py={2}
                borderRadius="lg"
                fontSize="sm"
                fontWeight="medium"
                w="100%"
                textAlign="center"
                border="1px solid"
                borderColor="blue.200"
              >
                {steps[currentStepIndex] || steps[steps.length - 1]}
              </Box>

              {/* Step indicators */}
              <Box 
                display="flex" 
                justifyContent="center" 
                gap={2} 
                mt={2}
                flexWrap="wrap"
              >
                {steps.map((_, index) => (
                  <Box
                    key={index}
                    w={3}
                    h={3}
                    borderRadius="full"
                    bg={index <= currentStepIndex ? "blue.500" : "gray.200"}
                    transition="all 0.3s ease"
                  />
                ))}
              </Box>
            </VStack>

            {/* Tips */}
            <Box
              bg="gray.50"
              p={3}
              borderRadius="lg"
              w="100%"
              border="1px solid"
              borderColor="gray.200"
            >
              <Text 
                fontSize="xs" 
                color="gray.600"
                textAlign="center"
                lineHeight="1.4"
              >
                💡 Your report will include AI analysis, charts, Street View links, 
                and property recommendations all in one comprehensive PDF
              </Text>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Portal>
  );
}

// Hook for managing loading state
export function useLoadingOverlay() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [message, setMessage] = useState('');

  const showLoading = (initialMessage?: string) => {
    setIsLoading(true);
    setProgress(0);
    setCurrentStep(0);
    if (initialMessage) setMessage(initialMessage);
  };

  const updateProgress = (newProgress: number, stepIndex?: number, newMessage?: string) => {
    setProgress(newProgress);
    if (stepIndex !== undefined) setCurrentStep(stepIndex);
    if (newMessage) setMessage(newMessage);
  };

  const hideLoading = () => {
    setIsLoading(false);
    setProgress(0);
    setCurrentStep(0);
    setMessage('');
  };

  return {
    isLoading,
    progress,
    currentStep,
    message,
    showLoading,
    updateProgress,
    hideLoading
  };
}