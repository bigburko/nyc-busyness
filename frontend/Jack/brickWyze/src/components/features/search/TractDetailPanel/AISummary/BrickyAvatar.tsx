// src/components/features/search/TractDetailPanel/AISummary/BrickyAvatar.tsx

import { Box, Image, Text } from '@chakra-ui/react';
import { useState } from 'react';

interface BrickyAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withGlassBackground?: boolean;
  showDebugInfo?: boolean;
}

export const BrickyAvatar = ({ 
  size = 'md', 
  withGlassBackground = true,
  showDebugInfo = false 
}: BrickyAvatarProps) => {
  const [imageLoadStatus, setImageLoadStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  
  // Array of possible image paths for debugging
  const imagePaths = [
    '/bricky.png',
    '/assets/bricky.png',
    '/public/bricky.png',
    './bricky.png'
  ];
  
  // Size configurations
  const sizeConfig = {
    sm: { 
      image: '24px', 
      background: '50px', 
      emoji: 'md',
      glassBlur: '10px'
    },
    md: { 
      image: '40px', 
      background: '70px', 
      emoji: 'lg',
      glassBlur: '15px'
    },
    lg: { 
      image: '70px', 
      background: '100px', 
      emoji: '3xl',
      glassBlur: '20px'
    },
    xl: { 
      image: '100px', 
      background: '140px', 
      emoji: '4xl',
      glassBlur: '25px'
    }
  };

  const config = sizeConfig[size];
  
  // Function to cycle through image paths for debugging
  const tryNextPath = () => {
    setCurrentPathIndex((prev) => (prev + 1) % imagePaths.length);
    setImageLoadStatus('loading');
  };

  // Image debugging handlers
  const handleImageLoad = () => {
    console.log('✅ [Bricky Image] Successfully loaded');
    setImageLoadStatus('loaded');
  };

  const handleImageError = () => {
    const errorMsg = `Image failed to load`;
    console.error('❌ [Bricky Image] Failed to load:', errorMsg);
    setImageLoadStatus('error');
  };

  const currentImagePath = imagePaths[currentPathIndex];

  return (
    <Box position="relative" flexShrink={0} display="flex" alignItems="center" justifyContent="center">
      {/* Liquid Glass Circle Background */}
      {withGlassBackground && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          w={config.background}
          h={config.background}
          borderRadius="full"
          bg="rgba(255, 255, 255, 0.15)"
          backdropFilter={`blur(${config.glassBlur})`}
          border="1px solid rgba(255, 255, 255, 0.2)"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
          _before={{
            content: '""',
            position: "absolute",
            top: "10%",
            left: "10%",
            w: "30%",
            h: "30%",
            borderRadius: "full",
            bg: "rgba(255, 255, 255, 0.2)",
            filter: "blur(10px)",
          }}
        />
      )}
      
      {/* Bricky Image */}
      <Box position="relative" zIndex={2} display="flex" alignItems="center" justifyContent="center">
        <Image 
          src={currentImagePath}
          alt="Bricky the owl mascot"
          w={config.image}
          h={config.image}
          objectFit="contain"
          onLoad={handleImageLoad}
          onError={handleImageError}
          fallback={<Text fontSize={config.emoji}>🦉</Text>}
          filter={withGlassBackground ? "drop-shadow(0 4px 8px rgba(0,0,0,0.2))" : undefined}
        />
      </Box>

      {/* Debug info */}
      {showDebugInfo && (
        <Box 
          position="absolute"
          top="100%"
          left="50%"
          transform="translateX(-50%)"
          mt={2}
          onClick={tryNextPath}
          cursor="pointer"
          bg="gray.100"
          px={2}
          py={1}
          borderRadius="md"
          _hover={{ bg: "gray.200" }}
          zIndex={10}
        >
          <Text fontSize="9px" color="gray.600" textAlign="center">
            {imageLoadStatus === 'loaded' ? '✅' : imageLoadStatus === 'error' ? '❌' : '⏳'} 
            Debug: Path {currentPathIndex + 1}/{imagePaths.length} - Click to cycle
          </Text>
          <Text fontSize="8px" color="gray.500" textAlign="center">
            {currentImagePath}
          </Text>
        </Box>
      )}
    </Box>
  );
};