// src/components/landing/WhoWeAre.tsx
'use client';

import React from "react";
import Image from 'next/image';

interface IconItem {
  icon: string;
  label: string;
}

const items: IconItem[] = [
  { icon: 'Transit_Access.png', label: "Transit Access" },
  { icon: 'Foot_Traffic_Proxy.png', label: "Foot Traffic Proxy" },
  { icon: 'Crime_Rates.png', label: "Crime Rates" },
  { icon: 'BID_Presence.png', label: "BID Presence" },
  { icon: 'Demographic_Alignment.png', label: "Demographic Alignment" },
  { icon: 'Flood_Risk.png', label: "Flood Risk" },
  { icon: 'Zoning_Compatibility.png', label: "Zoning Compatibility" },
];

const WhoWeAre: React.FC = () => {
  return (
    <section className="who-we-are">
      <h2 className="who-we-are-title">Who We're Here For</h2>
      <p className="who-we-are-description">
        We support founders who want to build smart from day one — not just with ideas, but with location intelligence. BrickWyze is built for entrepreneurs seeking to understand the factors they can't control, so they can launch in places that set them up to succeed.
      </p>
      <div className="who-we-are-icons">
        {items.map((item, idx) => (
          <div key={idx} className="icon-item">
            <Image
              src={`/assets/icons/${item.icon}`}
              alt={item.label}
              className="icon-img"
              width={64}
              height={64}
            />
            <p className="icon-label">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhoWeAre;