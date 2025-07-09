// components/MyIncomeSlider.tsx
'use client';

import MyRangeSlider from '../../MyRangeSlider';

export default function MyIncomeSlider({
  value,
  onChange,
}: {
  value: [number, number];
  onChange: (range: [number, number]) => void;
}) {
  return (
    <MyRangeSlider
      heading="Household Income"
      defaultRange={value}
      min={0}
      max={250000}
      step={5000}
      filledTrack="#68D391"        // green tone
      unFilledTrack="#C6F6D5"
      showSymbol={true}            // ✅ keep dollar sign
      symbol="$"
      toolTipText="Filter census tracts by household income range in USD"
      onChange={onChange}
    />
  );
}
