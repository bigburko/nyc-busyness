// src/components/landing/WhoWeAre.tsx
'use client';

import React from "react";
import Image from 'next/image';
import styles from './landing.module.css';

interface IconItem {
  icon: string;
  label: string;
}

const items: IconItem[] = [
  { icon: 'Transit_Access.png', label: "Transit Access" },
  { icon: 'Foot_Traffic_Proxy.png', label: "Foot Traffic Proxy" },
  { icon: 'Crime_Rates.png', label: "Crime Rates" },
  { icon: 'Demographic_Alignment.png', label: "Demographic Alignment" },
  { icon: 'Flood_Risk.png', label: "Flood Risk" },
];

const WhoWeAre: React.FC = () => {
  return (
    <section className={styles.whoWeAre}>
      <h2 className={styles.whoWeAreTitle}>Who We're Here For</h2>
      <p className={styles.whoWeAreDescription}>
        We support founders who want to build smart from day one — not just with ideas, but with location intelligence. BrickWyze is built for entrepreneurs seeking to understand the factors they can't control, so they can launch in places that set them up to succeed.
      </p>
      <div className={styles.whoWeAreIcons}>
        {items.map((item, idx) => (
          <div key={idx} className={styles.iconItem}>
            <Image
              src={`/icons/${item.icon}`}
              alt={item.label}
              className={styles.iconImg}
              width={64}
              height={64}
            />
            <p className={styles.iconLabel}>{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhoWeAre;