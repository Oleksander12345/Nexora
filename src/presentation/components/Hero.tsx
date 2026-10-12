import { useEffect, useState } from 'react';
import { AnimatePresence, useIsPresent } from 'motion/react';
import * as m from 'motion/react-m';
import {
  ArrowRightIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from '@phosphor-icons/react';
import type { CategoryId } from '../../domain/product';
import { ease, quick, settle } from '../motion/transitions';
const slides = [
  {
    eyebrow: 'SOUND A BRIGHTER YOU',
    lines: ['More Than Sound.', 'A Brighter Everyday.'],
    description: 'Premium audio, timeless design, made for the way you live.',
    cta: 'Shop Headphones',
    image: 'hero',
    category: 'audio',
    note: ['Built for', 'Brighter Days'],
  },
  {
    eyebrow: 'FOR A BRIGHTER TOMORROW',
    lines: ['Carry What', 'Moves You.'],
    description: 'Thoughtful gear for wherever life takes you.',
    cta: 'Explore Bags',
    image: 'carry',
    category: 'bags',
    note: ['Designed for', 'Every Journey'],
  },
  {
    eyebrow: 'LESS, BUT BETTER',
    lines: ['The Details', 'Make the Difference.'],
    description:
      'Minimal tools. Major impact. Make room for a better everyday.',
    cta: 'Shop Accessories',
    image: 'details',
    category: 'phone',
    note: ['Considered in', 'Every Detail'],
  },
] as const;
type Slide = (typeof slides)[number];
function HeroCopy({
  slide,
  onShop,
}: {
  slide: Slide;
  onShop: (category: CategoryId) => void;
}) {
  const isPresent = useIsPresent();
  return (
    <m.div
      className={`hero-slide-copy hero-${slide.image}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, transition: quick }}
      transition={settle}
      aria-hidden={!isPresent}
      inert={!isPresent}
    >
      <div className="hero-copy">
        <p className="eyebrow">{slide.eyebrow}</p>
        <h1>
          {slide.lines[0]}
          <br />
          {slide.lines[1]}
        </h1>
        <p className="hero-description">{slide.description}</p>
        <button className="pill" onClick={() => onShop(slide.category)}>
          {slide.cta}
          <ArrowRightIcon size={17} />
        </button>
      </div>
      <div className="hero-note">
        <span />
        <p>
          {slide.note[0]}
          <br />
          {slide.note[1]}
        </p>
      </div>
    </m.div>
  );
}
export function Hero({ onShop }: { onShop: (category: CategoryId) => void }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    for (const slide of slides.slice(1)) {
      const image = new Image();
      image.src = `/images/${slide.image}.webp`;
      void image.decode().catch(() => {});
    }
  }, []);
  return (
    <section
      className="hero"
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      <div className="hero-media" aria-hidden="true">
        {slides.map((slide, i) => (
          <m.div
            className={`hero-background-layer hero-${slide.image}`}
            key={slide.image}
            initial={false}
            animate={{ opacity: i === index ? 1 : 0 }}
            transition={{ duration: 0.55, ease }}
          >
            <img
              className="hero-background"
              src={`/images/${slide.image}.webp`}
              alt=""
              fetchPriority={i === 0 ? 'high' : 'auto'}
            />
          </m.div>
        ))}
      </div>
      <div className="hero-shell">
        <AnimatePresence initial={false} mode="wait">
          <HeroCopy key={index} slide={slides[index]} onShop={onShop} />
        </AnimatePresence>
        <div className={`slide-controls ${index === 1 ? 'light-scene' : ''}`}>
          <button
            aria-label="Previous collection"
            onClick={() => setIndex((current) => (current + 2) % 3)}
          >
            <CaretLeftIcon size={15} />
          </button>
          <span aria-live="polite">
            0{index + 1} <span className="slide-total">/ 03</span>
          </span>
          <button
            aria-label="Next collection"
            onClick={() => setIndex((current) => (current + 1) % 3)}
          >
            <CaretRightIcon size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}
