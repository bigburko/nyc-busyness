'use client';

import mapboxgl from 'mapbox-gl';

export const renderPopup = (
  e: mapboxgl.MapLayerMouseEvent,
  weights?: any[],
  selectedEthnicities?: string[],
  selectedGenders?: string[]
) => {
  if (!e.features?.length) return;
  const feature = e.features[0];
  const props = feature.properties || {};

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
    new mapboxgl.Popup({ closeButton: true })
      .setLngLat(e.lngLat)
      .setHTML(simpleContent)
      .addTo(e.target);
    return;
  }

  const toScore = (val: any) => {
    if (val === null || val === undefined) return 'N/A';
    const score = parseFloat(val);
    return isNaN(score) ? 'N/A' : Math.round(score * 100);
  };

  const formatPct = (val: any) => {
    if (val === null || val === undefined) return 'N/A';
    const pct = parseFloat(val);
    return isNaN(pct) ? 'N/A' : `${(pct * 100).toFixed(1)}%`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#1a9850';
    if (score >= 60) return '#91bfdb';
    if (score >= 40) return '#fee08b';
    if (score >= 20) return '#fc8d59';
    return '#d73027';
  };

  const overallScore = toScore(props.custom_score);
  const scoreColor = getScoreColor(overallScore === 'N/A' ? 0 : overallScore);

  const content = `
    <div style="font-family: sans-serif; max-width: 280px;">
      <h3 style="margin: 0 0 4px; font-size: 16px;">📍 ${props.NTAName || 'Unknown Area'}</h3>
      <div style="font-size: 12px; margin-bottom: 8px; color: #888;">
        Tract ID: ${props.GEOID || 'Unknown'}
      </div>
      <div style="font-size: 14px; margin-bottom: 12px;">
        <div style="background: #f0f0f0; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
          <strong style="font-size: 24px; color: ${scoreColor};">
            ${overallScore}
          </strong>
          <span style="font-size: 14px;"> /100 Overall Score</span>
        </div>

        <div style="margin-top: 10px; font-size: 13px;">
          <div style="margin: 4px 0;"><strong>Crime Safety:</strong> ${toScore(props.crime_score)}/100</div>
          <div style="margin: 4px 0;"><strong>Foot Traffic:</strong> ${toScore(props.foot_traffic_score)}/100</div>
          <div style="margin: 4px 0;"><strong>Flood Safety:</strong> ${toScore(props.flood_risk_score)}/100</div>
          <div style="margin: 4px 0;"><strong>Rent Value:</strong> ${toScore(props.rent_score)}/100</div>
          <div style="margin: 4px 0;"><strong>Points of Interest:</strong> ${toScore(props.poi_score)}/100</div>
          <div style="margin: 4px 0;"><strong>Demographics:</strong> ${toScore(props.demographic_score)}/100</div>
          
          <div style="margin-top: 10px; font-size: 12px; color: #666;">
            <div><strong>Race/Ethnicity Match:</strong> ${formatPct(props.demographic_match_pct)}</div>
            <div><strong>Gender Match:</strong> ${formatPct(props.gender_match_pct)}</div>
            <div><strong>Age Match:</strong> ${formatPct(props.age_match_pct)}</div>
            <div><strong>Income Match:</strong> ${formatPct(props.income_match_pct)}</div> <!-- ✅ ADDED -->
            <div><strong>Combined Match:</strong> ${formatPct(props.combined_match_pct)}</div>
          </div>

          ${props.avg_rent
            ? `<div style="margin: 8px 0;"><strong>Avg Rent:</strong> $${props.avg_rent}</div>`
            : ''
          }
        </div>

        ${weights?.length
          ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd;">
              <strong style="font-size: 12px;">Weights Applied:</strong>
              <div style="font-size: 11px; margin-top: 4px;">
                ${weights.map((w) => `<div style="margin: 2px 0;">${w.label}: ${w.value}%</div>`).join('')}
              </div>
            </div>`
          : ''
        }

        ${selectedEthnicities?.length
          ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd;">
              <strong style="font-size: 12px;">Selected Demographics:</strong>
              <div style="font-size: 11px; margin-top: 4px; max-height: 60px; overflow-y: auto;">
                ${selectedEthnicities.join(', ')}
              </div>
            </div>`
          : ''
        }

        ${selectedGenders?.length
          ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd;">
              <strong style="font-size: 12px;">Selected Genders:</strong>
              <div style="font-size: 11px; margin-top: 4px;">
                ${selectedGenders.join(', ')}
              </div>
            </div>`
          : ''
        }
      </div>
    </div>
  `;

  new mapboxgl.Popup({ closeButton: true })
    .setLngLat(e.lngLat)
    .setHTML(content)
    .addTo(e.target);
};
