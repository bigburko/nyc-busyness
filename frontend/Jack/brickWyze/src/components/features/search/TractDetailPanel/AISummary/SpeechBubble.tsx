// src/components/features/search/TractDetailPanel/AISummary/SpeechBubble.tsx

import { Box, Text } from '@chakra-ui/react';

interface SpeechBubbleProps {
  children: React.ReactNode;
  bg?: string;
  borderColor?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  direction?: "left" | "right";
}

export const SpeechBubble = ({ 
  children, 
  bg = "rgba(99, 102, 241, 0.95)", 
  borderColor = "rgba(255,255,255,0.3)", 
  color = "white", 
  size = "md", 
  direction = "right" 
}: SpeechBubbleProps) => {
  const sizes = {
    sm: { 
      padding: "12px 16px", 
      fontSize: "xs", 
      minW: "140px",
      maxW: { base: "250px", sm: "300px", md: "350px" }
    },
    md: { 
      padding: "16px 20px", 
      fontSize: "sm", 
      minW: "180px",
      maxW: { base: "280px", sm: "400px", md: "450px", lg: "500px" }
    },
    lg: { 
      padding: "20px 24px", 
      fontSize: "md", 
      minW: "220px",
      maxW: { base: "320px", sm: "450px", md: "500px", lg: "550px" }
    }
  };

  const currentSize = sizes[size];

  return (
    <Box position="relative" display="inline-block" w="fit-content" h="fit-content">
      {/* Speech Bubble Background with CSS tail */}
      <Box
        bg={bg}
        border="2px solid"
        borderColor={borderColor}
        borderRadius="xl"
        position="relative"
        minW={currentSize.minW}
        maxW={currentSize.maxW}
        w="fit-content"
        h="auto"
        boxShadow="0 4px 12px rgba(0,0,0,0.15)"
        backdropFilter="blur(10px)"
        _after={{
          content: '""',
          position: "absolute",
          bottom: "-10px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "0",
          height: "0",
          borderLeft: "12px solid transparent",
          borderRight: "12px solid transparent",
          borderTop: "12px solid",
          borderTopColor: bg,
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
        }}
      >
        {/* Content with flexible sizing */}
        <Box
          padding={currentSize.padding}
          color={color}
          fontSize={currentSize.fontSize}
          fontWeight="medium"
          textAlign="center"
          lineHeight="1.4"
          wordBreak="break-word"
          w="fit-content"
          h="fit-content"
        >
          <Text 
            whiteSpace="normal"
            wordBreak="break-word"
            overflowWrap="break-word"
            w="fit-content"
            h="fit-content"
          >
            {children}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};