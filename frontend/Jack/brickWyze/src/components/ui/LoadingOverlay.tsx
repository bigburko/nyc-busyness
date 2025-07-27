// src/components/ui/LoadingOverlay.tsx
'use client';

import { 
  Box, 
  VStack, 
  Text, 
  Spinner, 
  Portal,
  useColorModeValue,
  Progress,
  HStack,
  Icon,
  Flex
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { useState, useEffect } from 'react';
import { CheckIcon } from '@chakra-ui/icons';

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const slideIn = keyframes`
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

interface LoadingStep {
  id: string;
  label: string;
  description?: string;
  icon?: string;
}

interface LoadingOverlayProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  progress?: number;
  currentStep?: string;
  steps?: LoadingStep[];
  showProgress?: boolean;
  variant?: 'default' | 'pdf-export' | 'ai-analysis';
}

// Default step configurations for different variants
const DEFAULT_STEPS: Record<string, LoadingStep[]> = {
  'pdf-export': [
    { id: 'init', label: 'Initializing export', icon: '📄' },
    { id: 'ai', label: 'Generating AI analysis', icon: '🤖', description: 'Creating business intelligence insights' },
    { id: 'data', label: 'Processing location data', icon: '📊', description: 'Analyzing metrics and trends' },
    { id: 'charts', label: 'Capturing visualizations', icon: '📈', description: 'Including charts and graphs' },
    { id: 'compile', label: 'Compiling PDF report', icon: '📋', description: 'Assembling final document' },
    { id: 'download', label: 'Finalizing download', icon: '⬇️', description: 'Preparing your report' }
  ],
  'ai-analysis': [
    { id: 'analyze', label: 'Analyzing location data', icon: '🔍' },
    { id: 'generate', label: 'Generating insights', icon: '🧠' },
    { id: 'format', label: 'Formatting response', icon: '✨' }
  ],
  'default': [
    { id: 'processing', label: 'Processing request', icon: '⏳' },
    { id: 'finalizing', label: 'Finalizing', icon: '✅' }
  ]
};

export function LoadingOverlay({ 
  isOpen, 
  title = "Processing", 
  message = "Please wait while we process your request...",
  progress = 0,
  currentStep = '',
  steps,
  showProgress = true,
  variant = 'default'
}: LoadingOverlayProps) {
  const [dots, setDots] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Use provided steps or default based on variant
  const activeSteps = steps || DEFAULT_STEPS[variant] || DEFAULT_STEPS['default'];

  // Theme colors
  const bgColor = useColorModeValue('rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

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

  // Update current step based on progress or currentStep prop
  useEffect(() => {
    if (!isOpen) return;

    if (currentStep) {
      // Find step index by matching currentStep string
      const stepIndex = activeSteps.findIndex(step => 
        currentStep.toLowerCase().includes(step.label.toLowerCase()) ||
        currentStep.toLowerCase().includes(step.id.toLowerCase())
      );
      if (stepIndex !== -1) {
        setCurrentStepIndex(stepIndex);
        
        // Mark previous steps as completed
        const newCompleted = new Set<string>();
        for (let i = 0; i < stepIndex; i++) {
          newCompleted.add(activeSteps[i].id);
        }
        setCompletedSteps(newCompleted);
      }
    } else if (progress > 0) {
      // Calculate step based on progress
      const calculatedIndex = Math.floor((progress / 100) * activeSteps.length);
      const safeIndex = Math.min(calculatedIndex, activeSteps.length - 1);
      setCurrentStepIndex(safeIndex);

      // Mark previous steps as completed
      const newCompleted = new Set<string>();
      for (let i = 0; i < safeIndex; i++) {
        newCompleted.add(activeSteps[i].id);
      }
      setCompletedSteps(newCompleted);
    }
  }, [isOpen, progress, currentStep, activeSteps]);

  // Reset state when overlay closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setCompletedSteps(new Set());
      setDots('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStepData = activeSteps[currentStepIndex];
  const displayProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <Portal>
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg={bgColor}
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={9999}
        animation={`${fadeIn} 0.3s ease-out`}
      >
        <Box
          bg={cardBg}
          borderRadius="xl"
          boxShadow="2xl"
          border="1px solid"
          borderColor={borderColor}
          p={8}
          maxW="md"
          w="90%"
          mx={4}
          animation={`${slideIn} 0.4s ease-out`}
        >
          <VStack spacing={6} align="center" w="full">
            
            {/* Header with Spinner */}
            <VStack spacing={3} align="center">
              <Box position="relative">
                <Spinner
                  size="xl"
                  color="blue.500"
                  thickness="3px"
                  speed="0.8s"
                />
                {variant === 'pdf-export' && (
                  <Text
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    fontSize="lg"
                  >
                    📄
                  </Text>
                )}
              </Box>
              
              <VStack spacing={1} align="center">
                <Text 
                  fontSize="xl" 
                  fontWeight="bold" 
                  color={textColor}
                  textAlign="center"
                >
                  {title}
                </Text>
                
                {showProgress && displayProgress > 0 && (
                  <HStack spacing={2} align="center">
                    <Text fontSize="sm" color={subtextColor} fontWeight="medium">
                      {Math.round(displayProgress)}% Complete
                    </Text>
                  </HStack>
                )}
              </VStack>
            </VStack>

            {/* Progress Bar */}
            {showProgress && (
              <Box w="full">
                <Progress
                  value={displayProgress}
                  size="md"
                  colorScheme="blue"
                  borderRadius="full"
                  bg="gray.100"
                  hasStripe
                  isAnimated
                />
              </Box>
            )}

            {/* Current Step Display */}
            <VStack spacing={3} align="center" w="full">
              {currentStepData && (
                <Flex
                  align="center"
                  justify="center"
                  bg="blue.50"
                  color="blue.700"
                  px={4}
                  py={3}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="blue.200"
                  w="full"
                  animation={`${pulse} 2s ease-in-out infinite`}
                >
                  <HStack spacing={3} align="center">
                    <Text fontSize="lg">{currentStepData.icon}</Text>
                    <VStack spacing={0} align="start">
                      <Text fontSize="sm" fontWeight="semibold" lineHeight="1.2">
                        {currentStepData.label}{dots}
                      </Text>
                      {currentStepData.description && (
                        <Text fontSize="xs" opacity={0.8} lineHeight="1.2">
                          {currentStepData.description}
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                </Flex>
              )}
              
              {/* Fallback message if no step data */}
              {!currentStepData && currentStep && (
                <Box
                  bg="gray.50"
                  color="gray.700"
                  px={4}
                  py={2}
                  borderRadius="lg"
                  w="full"
                  textAlign="center"
                >
                  <Text fontSize="sm" fontWeight="medium">
                    {currentStep}{dots}
                  </Text>
                </Box>
              )}

              {/* General message */}
              <Text 
                fontSize="sm" 
                color={subtextColor}
                textAlign="center"
                lineHeight="1.5"
              >
                {message}
              </Text>
            </VStack>

            {/* Step Progress Indicators */}
            {activeSteps.length > 1 && (
              <Box w="full">
                <VStack spacing={2} align="stretch">
                  {activeSteps.map((step, index) => {
                    const isCompleted = completedSteps.has(step.id);
                    const isCurrent = index === currentStepIndex;
                    const isPending = index > currentStepIndex;
                    
                    return (
                      <HStack
                        key={step.id}
                        spacing={3}
                        opacity={isPending ? 0.4 : 1}
                        transition="all 0.3s ease"
                      >
                        <Box
                          w="6"
                          h="6"
                          borderRadius="full"
                          bg={isCompleted ? "green.500" : isCurrent ? "blue.500" : "gray.300"}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                          transition="all 0.3s ease"
                        >
                          {isCompleted ? (
                            <Icon as={CheckIcon} color="white" boxSize="3" />
                          ) : (
                            <Text fontSize="xs" color="white" fontWeight="bold">
                              {index + 1}
                            </Text>
                          )}
                        </Box>
                        
                        <VStack spacing={0} align="start" flex={1}>
                          <Text 
                            fontSize="xs" 
                            fontWeight={isCurrent ? "semibold" : "medium"}
                            color={isCompleted ? "green.600" : isCurrent ? textColor : subtextColor}
                            transition="all 0.3s ease"
                          >
                            {step.icon} {step.label}
                          </Text>
                          {step.description && isCurrent && (
                            <Text fontSize="xs" color={subtextColor} opacity={0.8}>
                              {step.description}
                            </Text>
                          )}
                        </VStack>
                      </HStack>
                    );
                  })}
                </VStack>
              </Box>
            )}

            {/* Tips section for PDF export */}
            {variant === 'pdf-export' && (
              <Box
                bg="orange.50"
                border="1px solid"
                borderColor="orange.200"
                borderRadius="lg"
                p={3}
                w="full"
              >
                <Text 
                  fontSize="xs" 
                  color="orange.700"
                  textAlign="center"
                  lineHeight="1.4"
                >
                  💡 Your comprehensive report will include AI insights, charts, property links, 
                  and actionable business recommendations
                </Text>
              </Box>
            )}
          </VStack>
        </Box>
      </Box>
    </Portal>
  );
}

// Hook for easier usage with different variants
export function useLoadingOverlay() {
  const [state, setState] = useState({
    isOpen: false,
    title: "Loading",
    message: "Please wait...",
    progress: 0,
    currentStep: '',
    variant: 'default' as LoadingOverlayProps['variant']
  });

  const showLoading = (options?: Partial<typeof state>) => {
    setState(prev => ({ ...prev, isOpen: true, ...options }));
  };

  const updateProgress = (progress: number, currentStep?: string) => {
    setState(prev => ({ ...prev, progress, currentStep: currentStep || prev.currentStep }));
  };

  const hideLoading = () => {
    setState(prev => ({ ...prev, isOpen: false }));
  };

  const showPDFExport = (title = "Generating Report", message = "Creating your comprehensive location analysis...") => {
    setState({
      isOpen: true,
      title,
      message,
      progress: 0,
      currentStep: '',
      variant: 'pdf-export'
    });
  };

  const showAIAnalysis = (title = "AI Analysis", message = "Analyzing location data with artificial intelligence...") => {
    setState({
      isOpen: true,
      title,
      message,
      progress: 0,
      currentStep: '',
      variant: 'ai-analysis'
    });
  };

  return {
    // Component
    LoadingOverlay: (props: Omit<LoadingOverlayProps, 'isOpen'>) => (
      <LoadingOverlay {...props} isOpen={state.isOpen} />
    ),
    
    // State
    isLoading: state.isOpen,
    progress: state.progress,
    currentStep: state.currentStep,
    
    // Basic actions
    showLoading,
    updateProgress,
    hideLoading,
    
    // Specialized actions
    showPDFExport,
    showAIAnalysis,
    
    // Advanced
    setState
  };
}