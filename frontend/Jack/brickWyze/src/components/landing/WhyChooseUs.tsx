// src/components/landing/WhyChooseUs.tsx
'use client';

import React from "react";
import Image from 'next/image';
import Link from 'next/link';

interface CardData {
  title: string;
  text: string;
  link: string;
  image: string;
}

const cardData: CardData[] = [
  {
    title: "Smart Filtering Algorithm",
    text: "Our Smart Filtering Algorithm helps entrepreneurs and startups find the most suitable business locations with ease. By analyzing key factors such as industry type, budget range, foot traffic, demographics, competition, and accessibility, it delivers data-driven recommendations tailored to your goals. Whether you're opening a retail store, café, or tech startup, the algorithm identifies high-potential areas that align with your strategy. It also considers local incentives and policies to help you make informed, cost-effective decisions. Save time, reduce risk, and launch smarter with our intelligent location engine.",
    link: "Learn how it works",
    image: "/assets/images/why1.png",
  },
  {
    title: "Reliable Data Sources",
    text: "Our platform is built on a foundation of trustworthy, real-time data from official government records, demographic statistics, urban planning databases, and verified business district insights. By aggregating and updating this data continuously, we ensure that every recommendation is grounded in facts, not guesswork. Users gain access to accurate information on population density, income levels, zoning regulations, transportation networks, and commercial activity. This enables smarter, data-driven decisions when choosing locations, assessing market potential, or evaluating risks. With our reliable data sources, you can move forward with confidence and clarity.",
    link: "View our data sources",
    image: "/assets/images/why2.png",
  },
  {
    title: "Real Entrepreneur Stories",
    text: "Learn how real founders turned ideas into thriving businesses with the help of our platform. From first-time entrepreneurs to seasoned business owners, our users share how smart location insights helped them identify high-potential areas, avoid costly mistakes, and launch with confidence. These stories highlight a wide range of industries — from retail and food services to tech startups — and show how data-driven decisions led to real-world success. Gain inspiration, practical tips, and a deeper understanding of how location can shape your journey. These are not just case studies — they're proof that the right tools can make all the difference.",
    link: "See their journeys",
    image: "/assets/images/why3.png",
  },
];

const WhyChooseUs: React.FC = () => {
  return (
    <section className="whychooseus-section">
      <h2 className="why-title">
        Why <span className="highlight">Entrepreneurs</span> Choose Us
      </h2>
      <div className="underline" />

      <div className="card-container">
        {cardData.map((card, index) => (
          <div className="why-card" key={index}>
            <div 
              className="card-background" 
              style={{ backgroundImage: `url(${card.image})` }} 
            />
            <div className="card-content">
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <Link href="/">
                {card.link}{" "}
                <Image 
                  src="/assets/icons/rightArrow.png" 
                  alt="arrow" 
                  className="right-arrow"
                  width={16}
                  height={16}
                />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyChooseUs;