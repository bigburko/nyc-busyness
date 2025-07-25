// src/components/features/search/TractDetailPanel/LoopNetIntegration.tsx
'use client';

import { Button, Text } from '@chakra-ui/react';
import { TractResult } from '../../../../types/TractTypes';

// ============================================================================
// LoopNet Integration - CONFIRMED WORKING PATTERNS ONLY
// ============================================================================

/*
 🧪 TESTING RESULTS SUMMARY:
 
 ✅ WHAT WORKS:
 - Specific neighborhood names with "-new-york-ny" suffix
 - Property types: retail-space, office-space, commercial-real-estate
 - Transaction types: for-lease, for-sale
 
 ❌ WHAT DOESN'T WORK (confirmed through manual testing):
 - Street names (broadway, canal-street, fifth-avenue, etc.)
 - Abbreviations (ues, uws, fidi, etc.) 
 - Landmark names (union-square, madison-square, etc.)
 - Alternative suffixes (manhattan, nyc, or no suffix)
 - Special separators (underscores, dots, spaces)
 - Transportation hubs (penn-station, grand-central, etc.)
 - Industrial/warehouse property types
 
 🎯 FINAL WORKING PATTERN: 
 https://www.loopnet.com/search/{property-type}/{neighborhood-name}-new-york-ny/for-lease/
 
 Only actual neighborhood names work - not streets, landmarks, or abbreviations.
*/

/**
 * CONFIRMED WORKING LoopNet neighborhood mappings
 * Based on manual testing - ONLY includes patterns that actually work
 */
const getLoopNetNeighborhoodUrl = (ntaName: string): string | null => {
  if (!ntaName || ntaName === 'Unknown' || ntaName.trim() === '') {
    return null;
  }

  const normalized = ntaName.toLowerCase().trim();
  
  // ✅ CONFIRMED WORKING - Only neighborhood names that actually work on LoopNet
  const workingNeighborhoods: Record<string, string> = {
    'times square': 'times-square-new-york-ny',
    'chinatown': 'chinatown-new-york-ny',
    'east harlem': 'east-harlem-new-york-ny', 
    'turtle bay': 'turtle-bay-new-york-ny',
    'east village': 'east-village-new-york-ny',
    'battery park': 'battery-park-new-york-ny',
    'gramercy park': 'gramercy-park-new-york-ny',
    'greenwich village': 'greenwich-village-new-york-ny',
    'hamilton heights': 'hamilton-heights-new-york-ny',
    'harlem': 'harlem-new-york-ny',
    'hells kitchen': 'hells-kitchen-new-york-ny',
    'hell\'s kitchen': 'hells-kitchen-new-york-ny',
    'inwood': 'inwood-new-york-ny',
    'lower east side': 'lower-east-side-new-york-ny',
    'manhattanville': 'manhattanville-new-york-ny',
    'flatiron district': 'flatiron-district-new-york-ny',
    'morningside heights': 'morningside-heights-new-york-ny',
    'kips bay': 'kips-bay-new-york-ny',
    'soho': 'soho-new-york-ny',
    'little italy': 'little-italy-new-york-ny',
    'tribeca': 'tribeca-new-york-ny',
    'carnegie hill': 'carnegie-hill-new-york-ny',
    'lenox hill': 'lenox-hill-new-york-ny',
    'yorkville': 'yorkville-new-york-ny',
    'upper west side': 'upper-west-side-new-york-ny',
    'lincoln square': 'lincoln-square-new-york-ny',
    'manhattan valley': 'manhattan-valley-new-york-ny',
    'washington heights': 'washington-heights-new-york-ny',
    'west village': 'west-village-new-york-ny',
    'two bridges': 'two-bridges-new-york-ny',
    'chelsea': 'hells-kitchen-new-york-ny', // Chelsea maps to Hell's Kitchen (adjacent)
  };

  // 🎯 COMPLEX NTA MAPPINGS - Map census tract compound names to working neighborhoods
  const ntaMappings: Record<string, string> = {
    // Chelsea area mappings
    'chelsea-hudson yards': 'hells-kitchen-new-york-ny',
    'chelsea hudson yards': 'hells-kitchen-new-york-ny',
    'hudson yards': 'hells-kitchen-new-york-ny',
    'chelsea': 'hells-kitchen-new-york-ny',
    
    // Midtown compound names
    'midtown-midtown south': 'times-square-new-york-ny',
    'murray hill-kips bay': 'kips-bay-new-york-ny', 
    'turtle bay-east midtown': 'turtle-bay-new-york-ny',
    'clinton': 'hells-kitchen-new-york-ny', // Clinton = Hell's Kitchen
    'times sq-theatre district': 'times-square-new-york-ny',
    'times square-theatre district': 'times-square-new-york-ny',
    
    // Downtown compound names  
    'soho-tribeca-civic center-little italy': 'soho-new-york-ny',
    'battery park city-lower manhattan': 'battery-park-new-york-ny',
    'stuyvesant town-cooper village': 'gramercy-park-new-york-ny',
    
    // Upper Manhattan compound names
    'upper east side-carnegie hill': 'carnegie-hill-new-york-ny',
    'central harlem north-polo grounds': 'harlem-new-york-ny',
    'central harlem': 'harlem-new-york-ny',
    'east harlem south': 'east-harlem-new-york-ny',
    'east harlem north': 'east-harlem-new-york-ny',
    
    // Alternative neighborhood names that map to working ones
    'nolita': 'little-italy-new-york-ny',
    'nomad': 'flatiron-district-new-york-ny',
    'noho': 'east-village-new-york-ny',
    'meatpacking district': 'west-village-new-york-ny',
    'bowery': 'lower-east-side-new-york-ny',
    'alphabet city': 'east-village-new-york-ny',
    
    // Upper Manhattan compound variations
    'morningside heights-hamilton heights': 'morningside-heights-new-york-ny',
    'washington heights-inwood': 'washington-heights-new-york-ny',
    'manhattanville-hamilton heights': 'hamilton-heights-new-york-ny',
    
    // Midtown direction mappings
    'midtown east': 'turtle-bay-new-york-ny',
    'midtown west': 'hells-kitchen-new-york-ny',
    
    // UES/UWS compound mappings
    'upper east side': 'lenox-hill-new-york-ny',
    'yorkville-upper east side': 'yorkville-new-york-ny',
    'carnegie hill-upper east side': 'carnegie-hill-new-york-ny',
    'lincoln square-upper west side': 'lincoln-square-new-york-ny',
    'manhattan valley-upper west side': 'manhattan-valley-new-york-ny',
  };

  // Combine confirmed working neighborhoods with NTA mappings
  const allMappings = { ...workingNeighborhoods, ...ntaMappings };
  
  // Try exact match first
  if (allMappings[normalized]) {
    console.log(`✅ [LoopNet] Direct match found: ${normalized} → ${allMappings[normalized]}`);
    return allMappings[normalized];
  }
  
  // Try partial matches for complex NTA names
  for (const [key, value] of Object.entries(allMappings)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      console.log(`✅ [LoopNet] Partial match found: ${normalized} → ${value} (via ${key})`);
      return value;
    }
  }
  
  // Try word-by-word matching for compound census tract names
  const normalizedWords = normalized.split(/[-\s]+/);
  for (const [key, value] of Object.entries(workingNeighborhoods)) {
    const keyWords = key.split(/[-\s]+/);
    
    // Check for significant word matches (excluding common words)
    const commonWords = ['and', 'the', 'of', 'in', 'on', 'at', 'district', 'area', 'park'];
    const significantMatches = normalizedWords.filter(word => 
      keyWords.includes(word) && !commonWords.includes(word) && word.length > 2
    );
    
    if (significantMatches.length > 0) {
      console.log(`✅ [LoopNet] Word match found: ${normalized} → ${value} (words: ${significantMatches.join(', ')})`);
      return value;
    }
  }
  
  console.log(`❌ [LoopNet] No working neighborhood found for: ${normalized} - will use Manhattan fallback`);
  return null;
};

/**
 * Generate LoopNet search URL with confirmed working property types
 */
export const generateLoopNetUrl = (
  tract: TractResult, 
  propertyType: 'commercial-real-estate' | 'retail-space' | 'office-space' = 'commercial-real-estate',
  transactionType: 'for-lease' | 'for-sale' = 'for-lease'
): string => {
  const baseUrl = 'https://www.loopnet.com/search';
  
  // Try neighborhood-specific URL first
  if (tract.nta_name && tract.nta_name !== 'Unknown' && tract.nta_name.trim() !== '') {
    const neighborhoodUrl = getLoopNetNeighborhoodUrl(tract.nta_name);
    
    if (neighborhoodUrl) {
      const url = `${baseUrl}/${propertyType}/${neighborhoodUrl}/${transactionType}/`;
      console.log(`✅ [LoopNet] Neighborhood-specific URL: ${url}`);
      return url;
    }
  }
  
  // Fallback to Times Square (central Manhattan, always has listings)
  const fallbackUrl = `${baseUrl}/${propertyType}/times-square-new-york-ny/${transactionType}/`;
  console.log(`🏙️ [LoopNet] Times Square fallback URL: ${fallbackUrl}`);
  return fallbackUrl;
};

/**
 * Open LoopNet search for commercial real estate
 */
export const openLoopNetSearch = (
  tract: TractResult,
  propertyType: 'commercial-real-estate' | 'retail-space' | 'office-space' = 'commercial-real-estate',
  transactionType: 'for-lease' | 'for-sale' = 'for-lease'
) => {
  const url = generateLoopNetUrl(tract, propertyType, transactionType);
  
  console.log(`[LoopNet] Opening ${propertyType} search for ${tract.nta_name || tract.geoid}`);
  console.log(`[LoopNet] URL: ${url}`);
  
  window.open(url, '_blank', 'noopener,noreferrer');
};

// ============================================================================
// LoopNet Button Component
// ============================================================================

interface LoopNetButtonProps {
  tract: TractResult;
  propertyType?: 'commercial-real-estate' | 'retail-space' | 'office-space';
  transactionType?: 'for-lease' | 'for-sale';
  size?: 'sm' | 'md' | 'lg';
  flex?: string | number;
  children?: React.ReactNode;
}

export const LoopNetButton: React.FC<LoopNetButtonProps> = ({
  tract,
  propertyType = 'commercial-real-estate',
  transactionType = 'for-lease',
  size = 'lg',
  flex = '1',
  children
}) => {
  return (
    <Button
      size={size}
      bg="linear-gradient(135deg, rgba(234, 88, 12, 0.9) 0%, rgba(249, 115, 22, 0.9) 100%)"
      color="white"
      _hover={{ 
        bg: "linear-gradient(135deg, rgba(234, 88, 12, 1) 0%, rgba(249, 115, 22, 1) 100%)",
        transform: "translateY(-2px)",
        boxShadow: "0 12px 40px rgba(234, 88, 12, 0.4)"
      }}
      _active={{ transform: "translateY(0)" }}
      flex={flex}
      borderRadius="2xl"
      fontWeight="600"
      h="56px"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.3)"
      boxShadow="0 8px 32px rgba(234, 88, 12, 0.2), inset 0 1px 0 rgba(255,255,255,0.3)"
      transition="all 0.3s ease"
      onClick={() => openLoopNetSearch(tract, propertyType, transactionType)}
    >
      {children || (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <Text fontSize="lg" fontWeight="600">
            Properties
          </Text>
        </>
      )}
    </Button>
  );
};

// Export individual functions for custom implementations
export { getLoopNetNeighborhoodUrl };