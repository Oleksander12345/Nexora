import type { ReactNode } from 'react';
import { LazyMotion, MotionConfig } from 'motion/react';
import { settle } from './transitions';
const loadFeatures = () =>
  import('./features').then((module) => module.default);
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={settle}>
      <LazyMotion features={loadFeatures} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
