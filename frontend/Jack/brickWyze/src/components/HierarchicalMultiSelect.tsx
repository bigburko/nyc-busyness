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
} from 'chakra-react-select';

interface Option {
  label: string;
  value: string;
  parent?: string;
}

interface ParentOption extends Option {
  children?: Option[];
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

  // Get all children recursively
  const getDescendants = (parentValue: string): string[] => {
    const children = data.filter(
      (item) => item.parent === parentValue && item.value !== parentValue
    );
    return children.flatMap((child) => [
      `${child.value}::${child.parent}`,
      ...getDescendants(child.value),
    ]);
  };

  // Build hierarchy
  const options: ParentOption[] = useMemo(() => {
    const parentMap: Record<string, ParentOption> = {};
    data.forEach((item) => {
      if (item.value === item.parent || !item.parent) {
        parentMap[item.value] = { ...item, children: [] };
      }
    });
    data.forEach((item) => {
      if (item.parent && item.value !== item.parent) {
        const parent = parentMap[item.parent];
        if (parent) {
          parent.children!.push(item);
        }
      }
    });
    return Object.values(parentMap);
  }, [data]);

  // Handle selection change
  const handleChange = (
    selected: MultiValue<Option>,
    _actionMeta: ActionMeta<Option>
  ) => {
    const rawValues = selected.map((opt) => opt.value);
    const newSelected = new Set<string>();

    rawValues.forEach((val) => {
      const baseVal = val.split("::")[0];
      const parent = data.find((item) => item.value === baseVal && item.value === item.parent);
      if (parent) {
        const children = data.filter(
          (item) => item.parent === parent.value && item.value !== parent.value
        );
        children.forEach((child) => newSelected.add(`${child.value}::${child.parent}`));
        newSelected.add(`${parent.value}::${parent.parent}`);
      } else {
        newSelected.add(val);
      }
    });

    const final = Array.from(newSelected);
    setSelectedValues(final);
    onChange(final);
  };

  // Compute what to show in top box
  const selectedOptionObjects = useMemo(() => {
    const selectedSet = new Set(selectedValues);

    return options.map((group) => {
      const groupChildren = group.children || [];
      const childKeys = groupChildren.map(
        (child) => `${child.value}::${child.parent}`
      );
      const allSelected = childKeys.every((key) => selectedSet.has(key));
      if (allSelected) {
        return {
          label: group.label,
          value: `${group.value}::${group.parent}`,
        };
      }
      return groupChildren
        .filter((child) =>
          selectedSet.has(`${child.value}::${child.parent}`)
        )
        .map((child) => ({
          ...child,
          value: `${child.value}::${child.parent}`,
        }));
    }).flat();
  }, [selectedValues, options]);

  // Optional: prettier group heading
  const CustomGroupHeading = (
    props: GroupHeadingProps<Option, true, GroupBase<Option>>
  ) => (
    <chakraComponents.GroupHeading {...props}>
      <strong>{props.children}</strong>
    </chakraComponents.GroupHeading>
  );

  return (
    <Box>
      <FormLabel mb={1}>{label}</FormLabel>
      <Select<Option, true>
        isMulti
        options={options.map((group) => ({
          label: group.label,
          options: (group.children || []).map((child) => ({
            ...child,
            value: `${child.value}::${child.parent}`,
          })),
        }))}
        value={selectedOptionObjects}
        onChange={handleChange}
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        placeholder="Select options..."
        getOptionValue={(option) => option.value}
        chakraStyles={{
          dropdownIndicator: (provided) => ({ ...provided, px: 2 }),
          multiValue: (provided) => ({
            ...provided,
            backgroundColor: '#EDF2F7',
          }),
        }}
        components={{
          GroupHeading: CustomGroupHeading,
        }}
      />
    </Box>
  );
}
