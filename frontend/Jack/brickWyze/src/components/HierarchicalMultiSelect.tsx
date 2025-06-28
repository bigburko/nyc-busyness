'use client';

import React, { useMemo, useState } from 'react';
import { Box, FormLabel } from '@chakra-ui/react';
import {
  Select,
  chakraComponents,
  MultiValue,
  ActionMeta,
  GroupBase,
  GroupHeadingProps,
  ValueContainerProps,
  MultiValueRemoveProps,
} from 'chakra-react-select';

interface Option {
  key: string;
  label: string;
  value: string;
  parent?: string;
}

interface DisplayPill {
  type: 'group' | 'individual';
  label: string;
  value: string;
  groupChildren?: string[];
}

interface Props {
  data: Option[]; // flat list of items with parent codes
  label?: string;
  onChange: (selected: string[]) => void;
}

export default function HierarchicalMultiSelect({
  data,
  label = 'Select Groups',
  onChange,
}: Props) {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  // Build groups from flat data
  const groups = useMemo(() => {
    const parentMap: Record<string, Option & { children: Option[] }> = {};
    const children: Option[] = [];

    // First pass: identify parents and children
    data.forEach((item) => {
      if (!item.parent || item.parent === item.value) {
        // This is a parent
        parentMap[item.value] = { ...item, children: [] };
      } else {
        // This is a child
        children.push(item);
      }
    });

    // Second pass: assign children to parents
    children.forEach((child) => {
      const parent = parentMap[child.parent!];
      if (parent) {
        parent.children.push(child);
      }
    });

    return Object.values(parentMap);
  }, [data]);

  // Get actual selected options for PERFECT selection logic
  const selectedOptions = useMemo(() => {
    const result: Option[] = [];
    
    groups.forEach(group => {
      group.children.forEach(child => {
        if (selectedValues.includes(child.value)) {
          result.push(child);
        }
      });
    });
    
    return result;
  }, [selectedValues, groups]);

  // Create display pills for what we actually want to show
  const displayPills = useMemo(() => {
    const pills: DisplayPill[] = [];
    const processedChildren = new Set<string>();

    // First, handle complete groups
    groups.forEach((group) => {
      const allChildrenSelected = group.children.every(child => 
        selectedValues.includes(child.value)
      );

      if (allChildrenSelected && group.children.length > 0) {
        // All children selected - show as group pill
        pills.push({
          type: 'group',
          label: `${group.label} (${group.children.length})`,
          value: `group_${group.value}`,
          groupChildren: group.children.map(c => c.value)
        });
        
        // Mark all children as processed
        group.children.forEach(child => {
          processedChildren.add(child.value);
        });
      }
    });

    // Then, add individual children that weren't part of complete groups
    selectedValues.forEach(value => {
      if (!processedChildren.has(value)) {
        const child = data.find(item => item.value === value);
        if (child) {
          pills.push({
            type: 'individual',
            label: child.label,
            value: child.value
          });
        }
      }
    });

    return pills;
  }, [selectedValues, groups, data]);

  const handleChange = (
    selected: MultiValue<Option>,
    _actionMeta: ActionMeta<Option>
  ) => {
    const final = selected.map((opt) => opt.value);
    setSelectedValues(final);
    onChange(final);
  };

  const groupedOptions = useMemo(() => {
    return groups.map((group) => ({
      label: group.label,
      options: group.children,
    }));
  }, [groups]);

  const CustomGroupHeading = (
    props: GroupHeadingProps<Option, true, GroupBase<Option>>
  ) => {
    const group = groups.find((g) => g.label === props.children);
    if (!group) {
      return <chakraComponents.GroupHeading {...props} />;
    }

    const allSelected = group.children.every((child) =>
      selectedValues.includes(child.value)
    );

    const handleClick = () => {
      const childValues = group.children.map((c) => c.value);
      const newSelected = new Set(selectedValues);

      if (allSelected) {
        // Deselect all children
        childValues.forEach((val) => newSelected.delete(val));
      } else {
        // Select all children
        childValues.forEach((val) => newSelected.add(val));
      }

      const final = Array.from(newSelected);
      setSelectedValues(final);
      onChange(final);
    };

    return (
      <Box
        onClick={handleClick}
        style={{
          cursor: 'pointer',
          fontWeight: 'bold',
          userSelect: 'none',
          backgroundColor: allSelected ? '#2B6CB0' : '#FFFFFF',
          color: allSelected ? '#FFFFFF' : '#2D3748',
          padding: '8px 12px',
          margin: '2px 0',
          borderRadius: '4px',
          width: '100%',
          boxSizing: 'border-box',
          transition: 'all 0.2s ease',
          border: allSelected ? '1px solid #2B6CB0' : '1px solid #E2E8F0',
        }}
        _hover={{
          backgroundColor: allSelected ? '#2C5282' : '#F7FAFC',
          color: allSelected ? '#FFFFFF' : '#2D3748',
        }}
      >
        {props.children} ({group.children.length} items)
      </Box>
    );
  };

  const CustomValueContainer = (props: ValueContainerProps<Option, true>) => {
    const { children, ...containerProps } = props;
    
    // Extract the input and other non-MultiValue children
    const childrenArray = React.Children.toArray(children);
    const nonMultiValueChildren = childrenArray.filter((child: any) => 
      !child?.type?.name?.includes('MultiValue')
    );

    return (
      <chakraComponents.ValueContainer {...containerProps}>
        {/* Render our custom pills */}
        {displayPills.map((pill, index) => (
          <Box
            key={pill.value}
            display="inline-flex"
            alignItems="center"
            backgroundColor="#2B6CB0"
            color="white"
            borderRadius="md"
            fontSize="sm"
            fontWeight="500"
            marginRight="4px"
            marginBottom="2px"
            marginTop="2px"
          >
            <Box px={3} py={1}>
              {pill.label}
            </Box>
            <CustomMultiValueRemove pill={pill} />
          </Box>
        ))}
        {/* Render input and other components */}
        {nonMultiValueChildren}
      </chakraComponents.ValueContainer>
    );
  };

  const CustomMultiValueRemove = ({ pill }: { pill: DisplayPill }) => {
    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      
      if (pill.type === 'group' && pill.groupChildren) {
        // This is a group pill - remove all children in the group
        const newSelected = selectedValues.filter(val => !pill.groupChildren!.includes(val));
        setSelectedValues(newSelected);
        onChange(newSelected);
      } else {
        // This is an individual child - remove just this one
        const newSelected = selectedValues.filter(val => val !== pill.value);
        setSelectedValues(newSelected);
        onChange(newSelected);
      }
    };

    return (
      <Box
        onClick={handleRemove}
        cursor="pointer"
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={2}
        py={1}
        color="white"
        borderRadius="0 4px 4px 0"
        _hover={{
          backgroundColor: '#2C5282',
        }}
      >
        ✕
      </Box>
    );
  };

  return (
    <Box>
      <FormLabel mb={1}>{label}</FormLabel>
      <Select<Option, true>
        isMulti
        options={groupedOptions}
        value={selectedOptions} // PERFECT selection logic
        onChange={handleChange}
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        placeholder="Select options..."
        getOptionValue={(opt) => opt.value}
        chakraStyles={{
          container: (provided) => ({
            ...provided,
            backgroundColor: 'white',
          }),
          control: (provided) => ({
            ...provided,
            backgroundColor: 'white',
            borderColor: '#E2E8F0',
            boxShadow: 'none',
            '&:hover': {
              borderColor: '#CBD5E0',
            },
          }),
          menu: (provided) => ({
            ...provided,
            backgroundColor: 'white',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }),
          menuList: (provided) => ({
            ...provided,
            backgroundColor: 'white',
            padding: '4px',
          }),
          option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected 
              ? '#2B6CB0' 
              : state.isFocused 
                ? '#EBF8FF' 
                : 'white',
            color: state.isSelected ? 'white' : '#2D3748',
            '&:hover': {
              backgroundColor: state.isSelected ? '#2C5282' : '#EBF8FF',
              color: state.isSelected ? 'white' : '#2D3748',
            },
          }),
          groupHeading: (provided) => ({
            ...provided,
            backgroundColor: 'transparent',
            margin: 0,
            padding: 0,
          }),
          dropdownIndicator: (provided) => ({ 
            ...provided, 
            px: 2,
            color: '#718096',
          }),
        }}
        components={{
          GroupHeading: CustomGroupHeading,
          ValueContainer: CustomValueContainer, // Completely controls pill display
          // Remove default MultiValue since we handle it in ValueContainer
          MultiValue: () => null,
        }}
      />
    </Box>
  );
}
