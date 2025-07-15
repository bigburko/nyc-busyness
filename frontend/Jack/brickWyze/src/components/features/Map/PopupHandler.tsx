'use client';

import mapboxgl from 'mapbox-gl';

// A specific type for the weighting objects.
interface Weighting {
  id: string; // Assuming an ID from your state management
  label: string;
  value: number;
}

export const renderPopup = (
  e: mapboxgl.MapLayerMouseEvent,
  // These parameters will now be used, fixing the error.
  weights?: Weighting[],
  selectedEthnicities?: string[],
  selectedGenders?: string[]
) => {
  if (!e.features?.length) return;
  const feature = e.features[0];
  const props = feature.properties || {};

  // This block handles popups for tracts that haven't been scored yet.
  if (!props.hasScore) {
    const simpleContent = `
      <div style="font-family: sans-serif; max-width: 240px;">
        <h3 style="margin: 0 0 4px; font-size: 16px;">📍 ${props.NTAName || 'Unknown Area'}</h3>
        <div style="font-size: 12px; margin-bottom: 8px; color: #888;">
          Tract ID: ${props.GEOID || 'Unknown'}
        </div>
        <p style="font-size: 14px; color: #666;">Click "Search" to see resilience scores</p>
      </div>
    `;
    new mapboxgl.Popup({ closeButton: true, maxWidth: '260px' })
      .setLngLat(e.lngLat)
      .setHTML(simpleContent)
      .addTo(e.target);
    return;
  }

  // --- Helper Functions (Type-safe) ---
  const toScore = (val: string | number | null | undefined): number | 'N/A' => {
    if (val === null || val === undefined) return 'N/A';
    const score = parseFloat(String(val));
    return isNaN(score) ? 'N/A' : Math.round(score * 100);
  };

  const formatPct = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return 'N/A';
    const pct = parseFloat(String(val));
    return isNaN(pct) ? 'N/A' : `${(pct * 100).toFixed(1)}%`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#1a9850';
    if (score >= 60) return '#67a9cf';
    if (score >= 40) return '#fee08b';
    if (score >= 20) return '#fc8d59';
    return '#d73027';
  };

  const overallScore = toScore(props.custom_score);
  const scoreColor = getScoreColor(overallScore === 'N/A' ? 0 : overallScore);
  const scoreTextColor = (overallScore !== 'N/A' && overallScore >= 40 && overallScore < 60) ? '#333' : '#fff';

  // --- Popup Content ---
  const content = `
    <div style="font-family: sans-serif; max-width: 300px; font-size: 14px;">
      <h3 style="margin: 0 0 4px; font-size: 16px;">📍 ${props.NTAName || 'Unknown Area'}</h3>
      <div style="font-size: 12px; margin-bottom: 8px; color: #666;">
        Tract ID: ${props.GEOID || 'Unknown'}
      </div>
      <div style="background-color: ${scoreColor}; color: ${scoreTextColor}; padding: 8px 12px; border-radius: 6px; text-align: center; margin-bottom: 12px;">
        <span style="font-size: 28px; font-weight: bold;">${overallScore}</span>
        <span style="font-size: 14px; margin-left: 4px;">/ 100</span>
        <div style="font-size: 12px; opacity: 0.9;">Overall Score</div>
      </div>

      <div style="font-size: 13px;">
        <div style="display: flex; justify-content: space-between; margin: 5px 0; padding-bottom: 5px; border-bottom: 1px solid #eee;"><span>Crime Safety</span> <strong>${toScore(props.crime_score)}</strong></div>
        <div style="display: flex; justify-content: space-between; margin: 5px 0; padding-bottom: 5px; border-bottom: 1px solid #eee;"><span>Foot Traffic</span> <strong>${toScore(props.foot_traffic_score)}</strong></div>
        <div style="display: flex; justify-content: space-between; margin: 5px 0; padding-bottom: 5px; border-bottom: 1px solid #eee;"><span>Flood Safety</span> <strong>${toScore(props.flood_risk_score)}</strong></div>
        <div style="display: flex; justify-content: space-between; margin: 5px 0; padding-bottom: 5px; border-bottom: 1px solid #eee;"><span>Rent Value</span> <strong>${toScore(props.rent_score)}</strong></div>
        <div style="display: flex; justify-content: space-between; margin: 5px 0; padding-bottom: 5px; border-bottom: 1px solid #eee;"><span>Points of Interest</span> <strong>${toScore(props.poi_score)}</strong></div>
        <div style="display: flex; justify-content: space-between; margin: 5px 0;"><span>Demographics</span> <strong>${toScore(props.demographic_score)}</strong></div>
      </div>
      
      <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 12px; color: #555;">
        <h4 style="margin: 0 0 5px; font-size: 13px; color: #000;">Demographic Match Details</h4>
        <div style="display: flex; justify-content: space-between;"><span>Race/Ethnicity</span> <strong>${formatPct(props.demographic_match_pct)}</strong></div>
        <div style="display: flex; justify-content: space-between;"><span>Gender</span> <strong>${formatPct(props.gender_match_pct)}</strong></div>
        <div style="display: flex; justify-content: space-between;"><span>Age</span> <strong>${formatPct(props.age_match_pct)}</strong></div>
        <div style="display: flex; justify-content: space-between;"><span>Income</span> <strong>${formatPct(props.income_match_pct)}</strong></div>
        <div style="display: flex; justify-content: space-between; margin-top: 5px; padding-top: 5px; border-top: 1px solid #eee;"><span>Combined</span> <strong>${formatPct(props.combined_match_pct)}</strong></div>
      </div>

       <!-- FIX: Re-added the sections that use the filter parameters -->
      ${ (weights && weights.length > 0) || (selectedEthnicities && selectedEthnicities.length > 0) || (selectedGenders && selectedGenders.length > 0)
        ? `<div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #ddd;">
             <h4 style="margin: 0 0 5px; font-size: 13px; color: #000;">Active Filters</h4>
             <div style="font-size: 12px; color: #555;">
               ${weights && weights.length > 0
                  ? `<div><strong>Weights:</strong> ${weights.map(w => `${w.label} (${w.value})`).join(', ')}</div>`
                  : ''
               }
               ${selectedEthnicities && selectedEthnicities.length > 0
                  ? `<div style="margin-top: 4px;"><strong>Ethnicities:</strong> ${selectedEthnicities.join(', ')}</div>`
                  : ''
               }
               ${selectedGenders && selectedGenders.length > 0
                  ? `<div style="margin-top: 4px;"><strong>Genders:</strong> ${selectedGenders.join(', ')}</div>`
                  : ''
               }
             </div>
           </div>`
        : ''
      }
    </div>
  `;

  new mapboxgl.Popup({ closeButton: true, maxWidth: '320px' })
    .setLngLat(e.lngLat)
    .setHTML(content)
    .addTo(e.target);
};
