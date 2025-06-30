'use client';

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Box, FormLabel } from '@chakra-ui/react';
import {
  Select,
  chakraComponents,
  MultiValue,
  ActionMeta,
  MenuListProps,
  ValueContainerProps,
  GroupBase,
} from 'chakra-react-select';
import { ethnicityData } from './ethnicityData';
import { Pill } from './Pill';
import { MenuOption } from './MenuOption';

// Define all interfaces
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
  actualValue?: string;
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
  autoFocus?: boolean;
  onMenuOpenChange?: (isOpen: boolean) => void;
}

// Helper function
const buildHierarchyTree = (data: Option[]) => {
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
};

export default function HierarchicalMultiSelect({
  data = ethnicityData,
  label = 'Select Ethnicities',
  onChange,
  autoFocus = false,
  onMenuOpenChange,
}: Props) {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [inputValue, setInputValue] = useState('');
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const selectRef = useRef<any>(null);

  const hierarchyTree = useMemo(() => buildHierarchyTree(data), [data]);

  // Handle auto-focus
  useEffect(() => {
    if (autoFocus && selectRef.current) {
      setTimeout(() => {
        selectRef.current.focus();
        setMenuIsOpen(true);
      }, 400);
    }
  }, [autoFocus]);

  // Notify parent when menu state changes
  useEffect(() => {
    onMenuOpenChange?.(menuIsOpen);
  }, [menuIsOpen, onMenuOpenChange]);

  // Create flat options list
  const flatOptions = useMemo(() => {
    const options: EnhancedOption[] = [];
    
    hierarchyTree.rootNodes.forEach(rootNode => {
      options.push({
        ...rootNode,
        hierarchyLevel: 0,
        hierarchyPath: [rootNode.label],
        displayName: rootNode.label,
        nodeType: 'race',
        nodeRef: rootNode
      });

      rootNode.children.forEach(childNode => {
        if (childNode.children.length > 0) {
          options.push({
            ...childNode,
            hierarchyLevel: 1,
            hierarchyPath: [rootNode.label, childNode.label],
            displayName: childNode.label,
            nodeType: 'midLevel',
            nodeRef: childNode
          });
          
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
          if (option.parent) {
            const parentNode = hierarchyTree.nodeMap[option.parent];
            if (parentNode) {
              groupsToExpand.add(parentNode.value);
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
    
    flatOptions.forEach(option => {
      if (option.nodeType === 'leaf') {
        const matches = 
          option.label.toLowerCase().includes(searchLower) ||
          option.hierarchyPath.some(path => path.toLowerCase().includes(searchLower));
        
        if (matches) {
          matchingNodes.add(option.value);
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
            value: `group_${node.value}`,
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
            value: `individual_${value}`,
            actualValue: value
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
    if (inputValue.trim() && actionMeta.action === 'select-option') {
      setInputValue('');
    }
    
    const final = selected.map((opt) => opt.value);
    setSelectedValues(final);
    onChange(final);
  };

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

  const toggleSelection = useCallback((values: string[], add: boolean) => {
    const newSelected = new Set(selectedValues);
    values.forEach(val => {
      if (add) {
        newSelected.add(val);
      } else {
        newSelected.delete(val);
      }
    });
    const final = Array.from(newSelected);
    setSelectedValues(final);
    onChange(final);
    if (inputValue.trim()) {
      setInputValue('');
    }
  }, [selectedValues, onChange, inputValue]);

  const removePill = useCallback((pill: DisplayPill) => {
    let newSelected: string[];
    
    if (pill.type === 'group' && pill.groupChildren) {
      const toRemove = new Set(pill.groupChildren);
      newSelected = selectedValues.filter(val => !toRemove.has(val));
    } else if (pill.type === 'individual' && pill.actualValue) {
      newSelected = selectedValues.filter(val => val !== pill.actualValue);
    } else {
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
          optionsToRender.map((option) => (
            <MenuOption
              key={option.value}
              option={option}
              selectedValues={selectedValues}
              expandedGroups={expandedGroups}
              onToggleGroup={toggleGroup}
              onToggleGroupSelection={toggleSelection}
              onSelectOption={(value, isSelected) => {
                toggleSelection([value], !isSelected);
              }}
              inputValue={inputValue}
              hierarchyNodeMap={hierarchyTree.nodeMap}
            />
          ))
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
          alignItems="center"
          py={1}
        >
          {displayPills.map((pill) => (
            <Pill
                key={`${pill.value}-${pill.type}`}
                pill={pill}
                onRemove={removePill}
              />


          ))}
          <Box display="flex" flex="1" minW="100px">
            {nonMultiValueChildren}
          </Box>
        </Box>
      </chakraComponents.ValueContainer>
    );
  };

  return (
    <Box w="100%" position="relative">
      <FormLabel mb={1}>{label}</FormLabel>
      <Select<EnhancedOption, true, GroupBase<EnhancedOption>>
        ref={selectRef}
        isMulti
        value={selectedOptions}
        onChange={handleChange}
        inputValue={inputValue}
        onInputChange={(newValue, actionMeta) => {
          if (actionMeta.action === 'input-change') {
            setInputValue(newValue);
          }
        }}
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        placeholder="Select options..."
        getOptionValue={(opt) => opt.value}
        options={selectableFilteredOptions}
        isClearable
        menuIsOpen={menuIsOpen}
        onMenuOpen={() => setMenuIsOpen(true)}
        onMenuClose={() => setMenuIsOpen(false)}
        menuPosition="absolute"
        menuPlacement="bottom"
        chakraStyles={{
          container: (provided) => ({
            ...provided,
            backgroundColor: 'white',
            width: '100%',
          }),
          control: (provided, state) => ({
            ...provided,
            backgroundColor: 'white',
            borderColor: state.isFocused ? '#FF492C' : '#E2E8F0',
            boxShadow: state.isFocused ? '0 0 0 1px #FF492C' : 'none',
            minHeight: 'auto',
            width: '100%',
            '&:hover': {
              borderColor: state.isFocused ? '#FF492C' : '#CBD5E0',
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
            marginTop: '4px',
            marginBottom: '4px',
            width: '100%',
            height: '380px',        // 👈 forces fixed total menu height
            maxHeight: '380px',
            minHeight: '240px',
            overflowY: 'auto',
            zIndex: 100,
          }),
          menuList: (provided) => ({
            ...provided,
            backgroundColor: '#FAFAFA',
            padding: '4px',
            height: '100%',         // 👈 force it to take the parent height
            overflowY: 'auto',
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
            display: 'none',
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
