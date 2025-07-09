// components/MyAgeSlider.tsx
'use client';

import MyRangeSlider from '../../MyRangeSlider';

export default function MyAgeSlider({
  value,
  onChange,
}: {
  value: [number, number];
  onChange: (range: [number, number]) => void;
}) {
  return (
    <MyRangeSlider
      heading="Age Range"
      defaultRange={value}
      min={0}
      max={100}
      step={1}
      filledTrack="#90CDF4"
      unFilledTrack="#BEE3F8"
      showSymbol={false} // ✅ No dollar sign for age
      toolTipText="Filter census tracts where the selected age group is most represented."
      onChange={onChange}
    />
  );
}
