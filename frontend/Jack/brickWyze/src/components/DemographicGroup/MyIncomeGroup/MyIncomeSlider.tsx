// components/MyIncomeSlider.tsx
'use client';

import MyRangeSlider from '../../MyRangeSlider';

export default function MyIncomeSlider({
  value,
  onChangeEnd,
}: {
  value: [number, number];
  onChangeEnd: (range: [number, number]) => void; // Use onChangeEnd
}) {
  return (
    <MyRangeSlider
      heading="Household Income"
      defaultRange={value}
      min={0}
      max={250000}
      step={5000}
      filledTrack="#68D391"
      unFilledTrack="#C6F6D5"
      showSymbol={true}
      symbol="$"
      toolTipText="Filter census tracts by household income range in USD"
      onChangeEnd={onChangeEnd} // Pass onChangeEnd through
    />
  );
}
