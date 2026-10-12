import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { settle } from '../motion/transitions';
export function ProductGrid({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  const reduceMotion = useReducedMotion();
  useLayoutEffect(() => {
    const grid = ref.current!;
    const measure = () => setHeight(grid.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
  }, []);
  return (
    <m.div
      className="product-grid-frame"
      initial={false}
      animate={{ height: height ?? 'auto' }}
      transition={reduceMotion ? { duration: 0 } : settle}
    >
      <div className="product-grid" ref={ref}>
        <AnimatePresence initial={false} mode="popLayout">
          {children}
        </AnimatePresence>
      </div>
    </m.div>
  );
}
