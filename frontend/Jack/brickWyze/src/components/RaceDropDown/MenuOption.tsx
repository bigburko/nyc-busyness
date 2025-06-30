import React from 'react';
import { Box } from '@chakra-ui/react';

// Define the types directly in the file
interface Option {
  label: string;
  value: string;
  parent?: string;
  race?: string;
}

interface HierarchyNode extends Option {
  children: HierarchyNode[];
  level: number;
  fullPath: string[];
  leafNodes?: HierarchyNode[];
}

interface EnhancedOption extends Option {
  hierarchyLevel: number;
  hierarchyPath: string[];
  displayName: string;
  nodeType: 'race' | 'midLevel' | 'leaf';
  nodeRef?: HierarchyNode;
}

interface MenuOptionProps {
  option: EnhancedOption;
  selectedValues: string[];
  expandedGroups: Set<string>;
  onToggleGroup: (groupId: string) => void;
  onSelectOption: (value: string, isSelected: boolean) => void;
  onToggleGroupSelection: (values: string[], add: boolean) => void;
  inputValue: string;
  hierarchyNodeMap: Record<string, HierarchyNode>;
}

const getRaceEmoji = (label: string): string => {
  if (label.includes('Asian')) return '🌏';
  if (label.includes('American Indian')) return '🪶';
  if (label.includes('Pacific Islander')) return '🏝️';
  if (label.includes('Some Other Race')) return '🌈';
  if (label.includes('Black')) return '🌍';
  if (label.includes('White')) return '🌎';
  if (label.includes('Hispanic')) return '🌮';
  return '📁';
};

export const MenuOption: React.FC<MenuOptionProps> = ({
  option,
  selectedValues,
  expandedGroups,
  onToggleGroup,
  onSelectOption,
  onToggleGroupSelection,
  inputValue,
  hierarchyNodeMap,
}) => {
  if (!option.nodeRef) return null;
  
  const node = option.nodeRef;
  const leafChildren = node.leafNodes || [];
  const allSelected = leafChildren.length > 0 && leafChildren.every((child) => selectedValues.includes(child.value));
  const someSelected = leafChildren.some((child) => selectedValues.includes(child.value));
  const selectedCount = leafChildren.filter(leaf => selectedValues.includes(leaf.value)).length;
  const isExpanded = expandedGroups.has(option.value) || inputValue.trim() !== '';

  const handleHeaderClick = () => {
    if (option.nodeType !== 'leaf') {
      const childValues = leafChildren.map((c) => c.value);
      onToggleGroupSelection(childValues, !allSelected);
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleGroup(option.value);
  };

  if (option.nodeType === 'race') {
    return (
      <Box>
        <Box
          onClick={handleHeaderClick}
          style={{
            cursor: 'pointer',
            fontWeight: 'bold',
            userSelect: 'none',
            backgroundColor: allSelected ? '#1A365D' : someSelected ? '#2B6CB0' : '#E2E8F0',
            color: allSelected || someSelected ? '#FFFFFF' : '#2D3748',
            padding: '12px',
            margin: '4px',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
            border: allSelected ? '2px solid #1A365D' : someSelected ? '2px solid #2B6CB0' : '2px solid #CBD5E0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <Box display="flex" alignItems="center" gap={2} flex={1} minW={0}>
            {!inputValue.trim() && (
              <Box 
                onClick={handleExpandClick}
                fontSize="sm" 
                cursor="pointer"
                px={1}
                flexShrink={0}
              >
                {isExpanded ? '▼' : '▶'}
              </Box>
            )}
            <Box fontSize="lg" flexShrink={0}>{getRaceEmoji(option.label)}</Box>
            <Box minW={0} flex={1}>
              <Box fontSize="sm" fontWeight="bold" isTruncated>{option.label}</Box>
              <Box fontSize="xs" opacity={0.9}>
                {leafChildren.length} items
                {someSelected && !allSelected && ` • ${selectedCount} selected`}
              </Box>
            </Box>
          </Box>
          <Box fontSize="md" flexShrink={0} ml={2}>
            {allSelected ? '✅' : someSelected ? '🔘' : '⭕'}
          </Box>
        </Box>
      </Box>
    );
  } else if (option.nodeType === 'midLevel') {
    const parentExpanded = expandedGroups.has(option.parent!) || inputValue.trim() !== '';
    if (!parentExpanded) return null;

    return (
      <Box
        onClick={handleHeaderClick}
        style={{
          cursor: 'pointer',
          fontWeight: '600',
          userSelect: 'none',
          backgroundColor: allSelected ? '#2B6CB0' : someSelected ? '#EBF8FF' : '#F7FAFC',
          color: allSelected ? '#FFFFFF' : '#2D3748',
          padding: '8px 12px',
          marginLeft: '24px',
          marginRight: '4px',
          marginTop: '2px',
          marginBottom: '2px',
          borderRadius: '4px',
          transition: 'all 0.2s ease',
          border: allSelected ? '1px solid #2B6CB0' : someSelected ? '1px solid #90CDF4' : '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateX(2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        <Box minW={0} flex={1}>
          <Box fontSize="sm" isTruncated>{option.label}</Box>
          <Box fontSize="xs" opacity={0.8}>
            {leafChildren.length} items
            {someSelected && !allSelected && ` • ${selectedCount} selected`}
          </Box>
        </Box>
        <Box fontSize="sm" flexShrink={0} ml={2}>
          {allSelected ? '✅' : someSelected ? '🔘' : '⭕'}
        </Box>
      </Box>
    );
  } else {
    // Leaf option
    const parentNode = option.parent ? hierarchyNodeMap[option.parent] : null;
    const isUnderMidLevel = parentNode && parentNode.children.length > 0 && parentNode.level > 0;
    const grandParentExpanded = 
      !parentNode ? false :
      parentNode.level === 0 ? (expandedGroups.has(parentNode.value) || inputValue.trim() !== '') :
      (expandedGroups.has(parentNode.parent!) || inputValue.trim() !== '');
    
    if (!grandParentExpanded) return null;

    const isSelected = selectedValues.includes(option.value);
    
    return (
      <Box
        onClick={() => {
          onSelectOption(option.value, isSelected);
        }}
        bg={isSelected ? 'blue.500' : 'white'}
        color={isSelected ? 'white' : 'gray.800'}
        px={3}
        py={2}
        ml={isUnderMidLevel ? "48px" : "32px"}
        mr={1}
        my="2px"
        cursor="pointer"
        transition="all 0.2s"
        borderRadius="md"
        borderLeft="3px solid"
        borderLeftColor={isSelected ? 'blue.600' : 'gray.200'}
        _hover={{
          bg: isSelected ? 'blue.600' : 'gray.50',
          transform: 'translateX(2px)',
        }}
        fontSize="sm"
        isTruncated
        maxW="calc(100% - 60px)"
      >
        {option.label}
      </Box>
    );
  }
};
