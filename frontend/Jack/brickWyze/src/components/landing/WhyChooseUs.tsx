// src/components/landing/WhyChooseUs.tsx
'use client';

import React from "react";
import Link from 'next/link';
import styles from './landing.module.css';

interface CardData {
  title: string;
  text: string;
  link: string;
  image: string;
}

const cardData: CardData[] = [
  {
    title: "Smart Filtering Algorithm",
    text: "Find the perfect business location with our intelligent algorithm that analyzes:\n\n• Industry-specific requirements\n• Budget and demographic alignment\n• Foot traffic and accessibility\n• Competition and market potential\n• Local incentives and policies\n\nGet data-driven recommendations tailored to your business goals in seconds.",
    link: "Try it on the map",
    image: "/images/why1.png",
  },
  {
    title: "Reliable Data Sources",
    text: "Our platform uses trusted, real-time data from:\n\n• Official government records\n• Demographic and census statistics\n• Urban planning databases\n• Verified business district insights\n• Transportation networks\n\nEvery recommendation is grounded in facts, not guesswork. Make confident decisions with reliable information.",
    link: "Explore the data",
    image: "/images/why2.png",
  },
  {
    title: "AI Generated Reports by Bricky",
    text: "Meet Bricky, your intelligent AI assistant that provides:\n\n• Comprehensive location analysis\n• Personalized business recommendations\n• Clear explanations of data insights\n• Industry-specific guidance\n• Instant report generation\n\nGet detailed reports in minutes that explain exactly what the data means for your success.",
    link: "Chat with Bricky",
    image: "/images/why3.png",
  },
];

const WhyChooseUs: React.FC = () => {
  return (
    <section className={styles.whychooseusSection}>
      <h2 className={styles.whyTitle}>
        Why <span className={styles.highlight}>Entrepreneurs</span> Choose Us
      </h2>
      <div className={styles.underline} />

      <div className={styles.cardContainer}>
        {cardData.map((card, index) => (
          <div className={styles.whyCard} key={index}>
            <div 
              className={styles.cardBackground} 
              style={{ backgroundImage: `url(${card.image})` }} 
            />
            <div className={styles.cardContent}>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <Link href="/map">
                <button className={styles.cardButton}>
                  {card.link}
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyChooseUs;