'use client';

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Box, FormLabel, Badge, HStack } from '@chakra-ui/react';
import {
  Select,
  chakraComponents,
  MultiValue,
  ActionMeta,
  GroupBase,
  MenuListProps,
  ValueContainerProps,
} from 'chakra-react-select';
import { ethnicityData } from '../app/Data/ethncityData'; 

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

interface DisplayPill {
  type: 'group' | 'individual';
  label: string;
  value: string;
  actualValue?: string; // The actual value in selectedValues for individual pills
  groupChildren?: string[];
  level?: number;
}

interface EnhancedOption extends Option {
  hierarchyLevel: number;
  hierarchyPath: string[];
  displayName: string;
  nodeType: 'race' | 'midLevel' | 'leaf';
  nodeRef?: HierarchyNode;
}

interface Props {
  data?: Option[];
  label?: string;
  onChange: (selected: string[]) => void;
}

export default function HierarchicalMultiSelect({
  data = ethnicityData,
  label = 'Select Ethnicities',
  onChange,
}: Props) {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [inputValue, setInputValue] = useState('');
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const selectRef = useRef<any>(null);

  // Build hierarchical tree
  const hierarchyTree = useMemo(() => {
    const nodeMap: Record<string, HierarchyNode> = {};
    
    data.forEach((item) => {
      nodeMap[item.value] = {
        ...item,
        children: [],
        level: 0,
        fullPath: []
      };
    });

    data.forEach((item) => {
      if (item.parent && item.parent !== item.value && nodeMap[item.parent]) {
        nodeMap[item.parent].children.push(nodeMap[item.value]);
      }
    });

    const calculateLeafNodes = (node: HierarchyNode): HierarchyNode[] => {
      if (node.children.length === 0) {
        node.leafNodes = [node];
        return [node];
      }
      const leaves = node.children.flatMap(child => calculateLeafNodes(child));
      node.leafNodes = leaves;
      return leaves;
    };

    const calculateHierarchy = (node: HierarchyNode, level: number, parentPath: string[] = []) => {
      node.level = level;
      node.fullPath = [...parentPath, node.label];
      node.children.sort((a, b) => a.label.localeCompare(b.label));
      node.children.forEach(child => calculateHierarchy(child, level + 1, node.fullPath));
    };

    const rootNodes = Object.values(nodeMap).filter(
      node => node.parent === node.value
    ).sort((a, b) => a.label.localeCompare(b.label));
    
    rootNodes.forEach(root => {
      calculateHierarchy(root, 0);
      calculateLeafNodes(root);
    });

    return { nodeMap, rootNodes };
  }, [data]);

  // Create flat options list
  const flatOptions = useMemo(() => {
    const options: EnhancedOption[] = [];
    
    hierarchyTree.rootNodes.forEach(rootNode => {
      // Add race header
      options.push({
        ...rootNode,
        hierarchyLevel: 0,
        hierarchyPath: [rootNode.label],
        displayName: rootNode.label,
        nodeType: 'race',
        nodeRef: rootNode
      });

      // Process children
      rootNode.children.forEach(childNode => {
        // Check if this child has its own children
        if (childNode.children.length > 0) {
          // This is a mid-level category
          options.push({
            ...childNode,
            hierarchyLevel: 1,
            hierarchyPath: [rootNode.label, childNode.label],
            displayName: childNode.label,
            nodeType: 'midLevel',
            nodeRef: childNode
          });
          
          // Add its leaf children
          childNode.children.forEach(leafNode => {
            options.push({
              ...leafNode,
              hierarchyLevel: 2,
              hierarchyPath: [rootNode.label, childNode.label, leafNode.label],
              displayName: leafNode.label,
              nodeType: 'leaf',
              nodeRef: leafNode
            });
          });
        } else {
          // This is a direct leaf child of the race
          options.push({
            ...childNode,
            hierarchyLevel: 1,
            hierarchyPath: [rootNode.label, childNode.label],
            displayName: childNode.label,
            nodeType: 'leaf',
            nodeRef: childNode
          });
        }
      });
    });
    
    return options;
  }, [hierarchyTree]);

  // Auto-expand groups when searching
  useEffect(() => {
    if (inputValue.trim()) {
      const searchLower = inputValue.toLowerCase();
      const groupsToExpand = new Set<string>();
      
      flatOptions.forEach(option => {
        const matchesSearch = 
          option.label.toLowerCase().includes(searchLower) ||
          option.hierarchyPath.some(path => path.toLowerCase().includes(searchLower));
        
        if (matchesSearch && option.nodeType === 'leaf') {
          // Expand parent groups
          if (option.parent) {
            const parentNode = hierarchyTree.nodeMap[option.parent];
            if (parentNode) {
              groupsToExpand.add(parentNode.value);
              // If parent has a parent (grandparent), expand that too
              if (parentNode.parent && parentNode.parent !== parentNode.value) {
                groupsToExpand.add(parentNode.parent);
              }
            }
          }
        }
      });
      
      setExpandedGroups(prev => new Set([...prev, ...groupsToExpand]));
    }
  }, [inputValue, flatOptions, hierarchyTree.nodeMap]);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!inputValue.trim()) return flatOptions;
    
    const searchLower = inputValue.toLowerCase();
    const matchingNodes = new Set<string>();
    const ancestorNodes = new Set<string>();
    
    // Find all matching leaf nodes and their ancestors
    flatOptions.forEach(option => {
      if (option.nodeType === 'leaf') {
        const matches = 
          option.label.toLowerCase().includes(searchLower) ||
          option.hierarchyPath.some(path => path.toLowerCase().includes(searchLower));
        
        if (matches) {
          matchingNodes.add(option.value);
          // Add all ancestors
          option.hierarchyPath.forEach((_, index) => {
            if (index < option.hierarchyPath.length - 1) {
              const ancestorPath = option.hierarchyPath.slice(0, index + 1);
              const ancestor = flatOptions.find(opt => 
                opt.hierarchyPath.length === ancestorPath.length &&
                opt.hierarchyPath.every((p, i) => p === ancestorPath[i])
              );
              if (ancestor) {
                ancestorNodes.add(ancestor.value);
              }
            }
          });
        }
      }
    });
    
    // Return options that are either matching or ancestors of matching
    return flatOptions.filter(option => 
      matchingNodes.has(option.value) || ancestorNodes.has(option.value)
    );
  }, [inputValue, flatOptions]);

  // Get selectable (leaf) options for keyboard navigation
  const selectableFilteredOptions = useMemo(() => {
    return filteredOptions.filter(opt => opt.nodeType === 'leaf');
  }, [filteredOptions]);

  // Get only selectable options for react-select value
  const selectableOptions = useMemo(() => {
    return flatOptions.filter(opt => opt.nodeType === 'leaf');
  }, [flatOptions]);

  const enhancedOptionsMap = useMemo(() => {
    const map: Record<string, EnhancedOption> = {};
    selectableOptions.forEach(option => {
      map[option.value] = option;
    });
    return map;
  }, [selectableOptions]);

  const selectedOptions = useMemo(() => {
    return selectedValues
      .map(value => enhancedOptionsMap[value])
      .filter(Boolean);
  }, [selectedValues, enhancedOptionsMap]);

  // Calculate display pills
  const displayPills = useMemo(() => {
    const pills: DisplayPill[] = [];
    const processedValues = new Set<string>();

    const checkNodeCompleteness = (node: HierarchyNode): boolean => {
      const leaves = node.leafNodes || [];
      return leaves.length > 0 && leaves.every(leaf => selectedValues.includes(leaf.value));
    };

    const processNodesRecursively = (nodes: HierarchyNode[], level: number = 0) => {
      nodes.forEach(node => {
        const leaves = node.leafNodes || [];
        
        if (leaves.some(leaf => processedValues.has(leaf.value)) || leaves.length === 0) {
          return;
        }

        const isComplete = checkNodeCompleteness(node);

        if (isComplete) {
          pills.push({
            type: 'group',
            label: `${node.label} (${leaves.length})`,
            value: `group_${node.value}`, // Keep a unique identifier for the pill
            groupChildren: leaves.map(leaf => leaf.value),
            level: node.level
          });

          leaves.forEach(leaf => processedValues.add(leaf.value));
        } else {
          processNodesRecursively(node.children, level + 1);
        }
      });
    };

    processNodesRecursively(hierarchyTree.rootNodes);

    selectedValues.forEach(value => {
      if (!processedValues.has(value)) {
        const item = enhancedOptionsMap[value];
        if (item) {
          pills.push({
            type: 'individual',
            label: item.label,
            value: `individual_${value}`, // Keep a unique identifier for the pill
            actualValue: value // Store the actual value separately
          });
        }
      }
    });

    return pills;
  }, [selectedValues, hierarchyTree, enhancedOptionsMap]);

  const handleChange = (
    selected: MultiValue<EnhancedOption>,
    actionMeta: ActionMeta<EnhancedOption>
  ) => {
    // If we have a search and are selecting something, clear the search
    if (inputValue.trim() && actionMeta.action === 'select-option') {
      setInputValue('');
    }
    
    const final = selected.map((opt) => opt.value);
    setSelectedValues(final);
    onChange(final);
  };

  const getRaceEmoji = useCallback((label: string) => {
    if (label.includes('Asian')) return '🌏';
    if (label.includes('American Indian')) return '🪶';
    if (label.includes('Pacific Islander')) return '🏝️';
    if (label.includes('Some Other Race')) return '🌈';
    if (label.includes('Black')) return '🌍';
    if (label.includes('White')) return '🌎';
    if (label.includes('Hispanic')) return '🌮';
    return '📁';
  }, []);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  // Remove pill handler
  const removePill = useCallback((pill: DisplayPill) => {
    let newSelected: string[];
    
    if (pill.type === 'group' && pill.groupChildren) {
      // Remove all children in the group
      const toRemove = new Set(pill.groupChildren);
      newSelected = selectedValues.filter(val => !toRemove.has(val));
    } else if (pill.type === 'individual' && pill.actualValue) {
      // Remove individual item using actualValue
      newSelected = selectedValues.filter(val => val !== pill.actualValue);
    } else {
      // Fallback
      newSelected = selectedValues;
    }
    
    setSelectedValues(newSelected);
    onChange(newSelected);
  }, [selectedValues, onChange]);

  const CustomMenuList = (props: MenuListProps<EnhancedOption, true>) => {
    const optionsToRender = inputValue.trim() ? filteredOptions : flatOptions;
    
    return (
      <Box 
        {...props.innerProps} 
        ref={props.innerRef}
        maxH="380px"
        overflowY="auto"
        overflowX="hidden"
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
            '&:hover': {
              background: '#555',
            },
          },
        }}
      >
        {optionsToRender.length === 0 ? (
          <Box p={4} textAlign="center" color="gray.500">
            No results found
          </Box>
        ) : (
          optionsToRender.map((option) => {
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
                const newSelected = new Set(selectedValues);

                if (allSelected) {
                  childValues.forEach((val) => newSelected.delete(val));
                } else {
                  childValues.forEach((val) => newSelected.add(val));
                }

                const final = Array.from(newSelected);
                setSelectedValues(final);
                onChange(final);
              }
            };

            const handleExpandClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              toggleGroup(option.value);
            };

            if (option.nodeType === 'race') {
              // Race header
              return (
                <Box key={option.value}>
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
                  key={option.value}
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
              const parentNode = option.parent ? hierarchyTree.nodeMap[option.parent] : null;
              const isUnderMidLevel = parentNode && parentNode.children.length > 0 && parentNode.level > 0;
              const grandParentExpanded = 
                !parentNode ? false :
                parentNode.level === 0 ? (expandedGroups.has(parentNode.value) || inputValue.trim() !== '') :
                (expandedGroups.has(parentNode.parent!) || inputValue.trim() !== '');
              
              if (!grandParentExpanded) return null;

              const isSelected = selectedValues.includes(option.value);
              
              return (
                <Box
                  key={option.value}
                  onClick={() => {
                    const newSelected = isSelected 
                      ? selectedValues.filter(v => v !== option.value)
                      : [...selectedValues, option.value];
                    setSelectedValues(newSelected);
                    onChange(newSelected);
                    // Clear search after selection
                    if (inputValue.trim()) {
                      setInputValue('');
                    }
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
          })
        )}
      </Box>
    );
  };

  const CustomValueContainer = (props: ValueContainerProps<EnhancedOption, true>) => {
    const { children, ...containerProps } = props;
    
    const childrenArray = React.Children.toArray(children);
    const nonMultiValueChildren = childrenArray.filter((child: any) => 
      !child?.type?.name?.includes('MultiValue')
    );

    return (
      <chakraComponents.ValueContainer {...containerProps}>
        <Box 
          display="flex" 
          flexWrap="wrap" 
          gap={1} 
          maxW="100%" 
          overflow="hidden"
          alignItems="center"
          flex={1}
        >
          {displayPills.map((pill) => (
            <Box
              key={`${pill.value}-${pill.type}`}
              display="inline-flex"
              alignItems="center"
              backgroundColor="blue.500"
              color="white"
              borderRadius="md"
              fontSize="sm"
              fontWeight="500"
              maxW="250px" // Increased from 200px to give more room
              minW="0" // Allow shrinking
              flexShrink={1} // Allow the pill to shrink if needed
              onMouseDown={(e) => {
                // Prevent the Select component from receiving this event
                e.stopPropagation();
              }}
            >
              <Box 
                px={2} 
                py={1} 
                display="flex" 
                alignItems="center" 
                gap={1}
                minW="0" // Allow content to shrink
                flex="1 1 auto" // Allow growing and shrinking
                overflow="hidden" // Hide overflow
              >
                <Box flexShrink={0}>{pill.type === 'group' ? '📁' : '📄'}</Box>
                <Box 
                  isTruncated 
                  title={pill.label} // Add tooltip to show full text on hover
                >
                  {pill.label}
                </Box>
              </Box>
              <Box
                onMouseDown={(e) => {
                  // Prevent mousedown from bubbling
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  // Prevent click from bubbling
                  e.preventDefault();
                  e.stopPropagation();
                  removePill(pill);
                }}
                cursor="pointer"
                display="flex"
                alignItems="center"
                justifyContent="center"
                px={2}
                py={1}
                color="white"
                borderRadius="0 4px 4px 0"
                bg="red.500"
                _hover={{
                  backgroundColor: 'red.600',
                }}
                flexShrink={0} // Never shrink the delete button
                borderLeft="1px solid"
                borderLeftColor="red.600"
              >
                ✕
              </Box>
            </Box>
          ))}
          {nonMultiValueChildren}
        </Box>
      </chakraComponents.ValueContainer>
    );
  };

  return (
    <Box w="100%">
      <FormLabel mb={1}>{label}</FormLabel>
      <Select<EnhancedOption, true>
        ref={selectRef}
        isMulti
        value={selectedOptions}
        onChange={handleChange}
        inputValue={inputValue}
        onInputChange={(newValue, actionMeta) => {
          // Only update input value for user input, not when clearing programmatically
          if (actionMeta.action === 'input-change') {
            setInputValue(newValue);
          }
        }}
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        placeholder="Select options..."
        getOptionValue={(opt) => opt.value}
        options={selectableFilteredOptions} // Provide filtered leaf options for keyboard navigation
        isClearable
        menuIsOpen={menuIsOpen}
        onMenuOpen={() => setMenuIsOpen(true)}
        onMenuClose={() => setMenuIsOpen(false)}
        chakraStyles={{
          container: (provided) => ({
            ...provided,
            backgroundColor: 'white',
            width: '100%',
          }),
          control: (provided) => ({
            ...provided,
            backgroundColor: 'white',
            borderColor: '#E2E8F0',
            boxShadow: 'none',
            minHeight: '38px',
            width: '100%',
            '&:hover': {
              borderColor: '#CBD5E0',
            },
          }),
          valueContainer: (provided) => ({
            ...provided,
            padding: '2px 8px',
            maxWidth: '100%',
            flexWrap: 'wrap',
          }),
          menu: (provided) => ({
            ...provided,
            backgroundColor: 'white',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
          }),
          menuList: (provided) => ({
            ...provided,
            backgroundColor: '#FAFAFA',
            padding: '4px',
            maxHeight: 'none', // We handle this in CustomMenuList
          }),
          dropdownIndicator: (provided) => ({ 
            ...provided, 
            padding: '4px 8px',
            color: '#718096',
          }),
          clearIndicator: (provided) => ({ 
            ...provided, 
            padding: '4px 8px',
            color: '#718096',
          }),
          noOptionsMessage: (provided) => ({
            ...provided,
            display: 'none', // Hide since we handle this in CustomMenuList
          }),
        }}
        components={{
          MenuList: CustomMenuList,
          ValueContainer: CustomValueContainer,
          MultiValue: () => null,
          Option: () => null,
          GroupHeading: () => null,
        }}
      />
    </Box>
  );
}
