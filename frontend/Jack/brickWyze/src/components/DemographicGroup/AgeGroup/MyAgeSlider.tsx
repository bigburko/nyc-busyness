// components/MyAgeSlider.tsx
'use client';

import MyRangeSlider from '../../MyRangeSlider';

export default function MyAgeSlider({
  value,
  onChangeEnd,
}: {
  value: [number, number];
  onChangeEnd: (range: [number, number]) => void; // Use onChangeEnd
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
      showSymbol={true}
      symbol="yrs"
      toolTipText="Filter census tracts where the selected age group is most represented."
      onChangeEnd={onChangeEnd} // Pass onChangeEnd through
    />
  );
}
