// src/components/WeightingPanel.tsx
'use client';

import { Box, Flex } from '@chakra-ui/react';
import MySlider from './MySlider';
import AddWeightSelector, { Layer } from './AddWeightSelector';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Weighting extends Layer {
  value: number;
}

const initialWeights: Weighting[] = [
  { id: uuidv4(), label: 'Safety', icon: '🛡️', value: 30, color: '#F87171' },
  { id: uuidv4(), label: 'Foot Traffic', icon: '🚶', value: 25, color: '#60A5FA' },
  { id: uuidv4(), label: 'Rent Score', icon: '💰', value: 20, color: '#34D399' },
  { id: uuidv4(), label: 'Demographics', icon: '👥', value: 15, color: '#FBBF24' },
  { id: uuidv4(), label: 'POI', icon: '📍', value: 5, color: '#A78BFA' },
  { id: uuidv4(), label: 'Flooding', icon: '🌊', value: 5, color: '#FB923C' },
];

export default function WeightingPanel() {
  const [activeWeights, setActiveWeights] = useState<Weighting[]>(initialWeights);
  const [inactiveLayers, setInactiveLayers] = useState<Layer[]>([]);

  const handleSliderChange = (id: string, newValue: number) => {
    setActiveWeights((prev) => {
      // Edge Case: If only one slider, its value must always be 100.
      if (prev.length === 1) {
        return [{ ...prev[0], value: 100 }];
      }

      const clampedNewValue = Math.round(Math.max(0, Math.min(100, newValue)));

      const others = prev.filter((w) => w.id !== id);
      const totalOfOthers = others.reduce((sum, w) => sum + w.value, 0);
      const newTotalForOthers = 100 - clampedNewValue;

      // Guard against division by zero if all other sliders were at 0.
      const scalingFactor = totalOfOthers > 0 ? newTotalForOthers / totalOfOthers : 0;

      const updatedOthers = others.map((w) => ({
        ...w,
        value: w.value * scalingFactor,
      }));

      const targetSlider = prev.find((w) => w.id === id);
      if (!targetSlider) return prev; // Should not happen

      let newWeights = [...updatedOthers, { ...targetSlider, value: clampedNewValue }];

      // Final normalization pass to ensure sum is exactly 100 due to rounding
      let sum = 0;
      const finalWeights = newWeights.map((w, index) => {
        if (index < newWeights.length - 1) {
          const roundedValue = Math.round(w.value);
          sum += roundedValue;
          return { ...w, value: roundedValue };
        }
        // The last item gets the remainder
        return { ...w, value: 100 - sum };
      });
      
      // Restore original order to prevent the list from visually re-sorting itself
      return prev.map(p => finalWeights.find(f => f.id === p.id) || p);
    });
  };

  const handleRemove = (id: string) => {
    const layerToRemove = activeWeights.find((w) => w.id === id);
    if (!layerToRemove) return;

    setInactiveLayers((prev) => [
      ...prev,
      { ...layerToRemove, value: undefined },
    ]);

    setActiveWeights((prev) => {
      const remaining = prev.filter((w) => w.id !== id);
      const total = remaining.reduce((sum, w) => sum + w.value, 0);
      return remaining.map((w) => ({
        ...w,
        value: Math.round((w.value / total) * 100),
      }));
    });
  };

  const handleAdd = (layer: Layer) => {
    setInactiveLayers((prev) => prev.filter((l) => l.id !== layer.id));

    setActiveWeights((prev) => {
      const newWeighting = { ...layer, value: 10 };
      const newTotal = prev.reduce((sum, w) => sum + w.value, 0) + newWeighting.value;
      return [...prev, newWeighting].map((w) => ({
        ...w,
        value: Math.round((w.value / newTotal) * 100),
      }));
    });
  };

  return (
    <Flex direction="column" gap={3} w="100%">
      {activeWeights.map((weight) => (
        <MySlider
          key={weight.id}
          label={weight.label}
          icon={weight.icon}
          value={weight.value}
          filledTrack={weight.color}
          onChangeEnd={(val) => handleSliderChange(weight.id, val)}
          onRemove={() => handleRemove(weight.id)}
          canBeRemoved={activeWeights.length > 1}
        />
      ))}
      <AddWeightSelector layers={inactiveLayers} onAdd={handleAdd} />
    </Flex>
  );
}
