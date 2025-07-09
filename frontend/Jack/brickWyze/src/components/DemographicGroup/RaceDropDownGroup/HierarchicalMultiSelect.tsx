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
  SelectInstance,
} from 'chakra-react-select';
import { ethnicityData } from './ethnicityData';
import { Pill } from './Pill';
import { MenuOption } from './MenuOption';

// Interfaces (no changes needed here)
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
  controlledInput: string;
  setControlledInput: (val: string) => void;
  externalSelectedValues: string[];
  externalExpandedGroups: Set<string>;
  setExternalExpandedGroups: React.Dispatch<React.SetStateAction<Set<string>>>;
  setMenuIsOpenExternal?: (open: boolean) => void;
  selectWrapperRef?: React.RefObject<HTMLDivElement | null>;
}

// Helper function buildHierarchyTree (no changes)
const buildHierarchyTree = (data: Option[]) => {
  const nodeMap: Record<string, HierarchyNode> = {};

  data.forEach(item => {
    nodeMap[item.value] = {
      ...item,
      children: [],
      level: 0,
      fullPath: [],
    };
  });

  data.forEach(item => {
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

  const rootNodes = Object.values(nodeMap)
    .filter(node => node.parent === node.value)
    .sort((a, b) => a.label.localeCompare(b.label));

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
  controlledInput,
  setControlledInput,
  externalSelectedValues,
  externalExpandedGroups,
  setExternalExpandedGroups,
  setMenuIsOpenExternal,
  selectWrapperRef,
}: Props) {
  // Hooks and State (no changes here)
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedValues = externalSelectedValues;
  const setSelectedValues = onChange;
  const expandedGroups = externalExpandedGroups;
  const setExpandedGroups = setExternalExpandedGroups;
  const inputValue = controlledInput;
  const setInputValue = setControlledInput;
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const selectRef = useRef<SelectInstance<EnhancedOption, true>>(null);
  const hierarchyTree = useMemo(() => buildHierarchyTree(data), [data]);
  
  // All useEffects and useMemos from before are unchanged, but included for completeness.
  // Their dependencies have been correctly set in the previous step.
  useEffect(() => {
    if (autoFocus && selectRef.current) {
      setTimeout(() => {
        selectRef.current?.focus();
        setMenuIsOpen(true);
      }, 400);
    }
  }, [autoFocus]);

  useEffect(() => {
    if (selectWrapperRef && wrapperRef.current) {
      (selectWrapperRef as React.MutableRefObject<HTMLDivElement | null>).current = wrapperRef.current;
    }
  }, [selectWrapperRef]);

  useEffect(() => {
    onMenuOpenChange?.(menuIsOpen);
    setMenuIsOpenExternal?.(menuIsOpen);
  }, [menuIsOpen, onMenuOpenChange, setMenuIsOpenExternal]);

  const flatOptions = useMemo(() => {
     const options: EnhancedOption[] = [];
    hierarchyTree.rootNodes.forEach(rootNode => {
      options.push({
        ...rootNode,
        hierarchyLevel: 0,
        hierarchyPath: [rootNode.label],
        displayName: rootNode.label,
        nodeType: 'race',
        nodeRef: rootNode,
      });
      rootNode.children.forEach(childNode => {
        if (childNode.children.length > 0) {
          options.push({
            ...childNode,
            hierarchyLevel: 1,
            hierarchyPath: [rootNode.label, childNode.label],
            displayName: childNode.label,
            nodeType: 'midLevel',
            nodeRef: childNode,
          });
          childNode.children.forEach(leafNode => {
            options.push({
              ...leafNode,
              hierarchyLevel: 2,
              hierarchyPath: [rootNode.label, childNode.label, leafNode.label],
              displayName: leafNode.label,
              nodeType: 'leaf',
              nodeRef: leafNode,
            });
          });
        } else {
          options.push({
            ...childNode,
            hierarchyLevel: 1,
            hierarchyPath: [rootNode.label, childNode.label],
            displayName: childNode.label,
            nodeType: 'leaf',
            nodeRef: childNode,
          });
        }
      });
    });
    return options;
  }, [hierarchyTree]);
  
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
  }, [inputValue, flatOptions, hierarchyTree.nodeMap, setExpandedGroups]);
  
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
              const ancestor = flatOptions.find(
                opt =>
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

    return flatOptions.filter(option => matchingNodes.has(option.value) || ancestorNodes.has(option.value));
  }, [inputValue, flatOptions]);

  const selectableFilteredOptions = useMemo(() => {
    return filteredOptions.filter(opt => opt.nodeType === 'leaf');
  }, [filteredOptions]);
  
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
    return selectedValues.map(value => enhancedOptionsMap[value]).filter(Boolean);
  }, [selectedValues, enhancedOptionsMap]);
  
  const displayPills = useMemo(() => {
     const pills: DisplayPill[] = [];
    const processedValues = new Set<string>();

    const checkNodeCompleteness = (node: HierarchyNode): boolean => {
      const leaves = node.leafNodes || [];
      return leaves.length > 0 && leaves.every(leaf => selectedValues.includes(leaf.value));
    };

    const processNodesRecursively = (nodes: HierarchyNode[]) => {
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
            level: node.level,
          });
          leaves.forEach(leaf => processedValues.add(leaf.value));
        } else {
          processNodesRecursively(node.children);
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
            actualValue: value,
          });
        }
      }
    });

    return pills;
  }, [selectedValues, hierarchyTree, enhancedOptionsMap]);

  // All useCallback hooks from before are unchanged and dependencies are correct
  const handleChange = (selected: MultiValue<EnhancedOption>, actionMeta: ActionMeta<EnhancedOption>) => {
    if (inputValue.trim() && actionMeta.action === 'select-option') {
      setInputValue('');
    }
    const final = selected.map(opt => opt.value);
    setSelectedValues(final);
  };
  
  const toggleGroup = useCallback(
    (groupId: string) => {
      setExpandedGroups(prev => {
        const next = new Set(prev);
        if (next.has(groupId)) {
          next.delete(groupId);
        } else {
          next.add(groupId);
        }
        return next;
      });
    },
    [setExpandedGroups]
  );

  const toggleSelection = useCallback(
    (values: string[], add: boolean) => {
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
      if (inputValue.trim()) {
        setInputValue('');
      }
    },
    [selectedValues, inputValue, setInputValue, setSelectedValues]
  );
  
  const removePill = useCallback(
    (pill: DisplayPill) => {
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
    },
    [selectedValues, setSelectedValues]
  );


  // Custom Components
  const CustomMenuList = (props: MenuListProps<EnhancedOption, true>) => {
    const optionsToRender = inputValue.trim() ? filteredOptions : flatOptions;
    return (
      <Box
        {...props.innerProps}
        ref={props.innerRef}
        maxH="380px"
        overflowY="auto"
        overflowX="hidden"
        // ✅ FIXED: Restored CSS object to prevent JSX error.
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
          optionsToRender.map(option => (
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

    // ✅ FIXED: The type guard now safely checks if 'child.type' is a function
    // before attempting to access its '.name' property, resolving the TS error.
    const nonMultiValueChildren = React.Children.toArray(children).filter(child => {
      if (React.isValidElement(child) && typeof child.type === 'function') {
        return !child.type.name.includes('MultiValue');
      }
      return true;
    });

    return (
      <chakraComponents.ValueContainer {...containerProps}>
        <Box display="flex" flexWrap="wrap" gap={1} maxW="100%" alignItems="center" py={1}>
          {displayPills.map(pill => (
            <Pill key={`${pill.value}-${pill.type}`} pill={pill} onRemove={removePill} />
          ))}
          <Box display="flex" flex="1" minW="100px">
            {nonMultiValueChildren}
          </Box>
        </Box>
      </chakraComponents.ValueContainer>
    );
  };

  return (
    <Box w="100%" position="relative" ref={wrapperRef}>
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
        getOptionValue={opt => opt.value}
        options={selectableFilteredOptions}
        isClearable
        menuIsOpen={menuIsOpen}
        onMenuOpen={() => {
          if (!menuIsOpen) {
            setMenuIsOpen(true);
          }
        }}
        onMenuClose={() => {
          setMenuIsOpen(false);
          setMenuIsOpenExternal?.(false);
        }}
        menuPosition="absolute"
        menuPlacement="bottom"
        // ✅ FIXED: Restored the complete chakraStyles object.
        chakraStyles={{
          container: provided => ({
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
          valueContainer: provided => ({
            ...provided,
            padding: '2px 8px',
            maxWidth: '100%',
            flexWrap: 'wrap',
          }),
          menu: provided => ({
            ...provided,
            backgroundColor: 'white',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            marginTop: '4px',
            width: '100%',
            zIndex: 100,
            maxHeight: undefined,
            height: 'auto',
            overflow: 'visible',
          }),
          menuList: provided => ({
            ...provided,
            backgroundColor: '#FAFAFA',
            padding: '4px',
            maxHeight: '380px',
            overflowY: 'auto',
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
