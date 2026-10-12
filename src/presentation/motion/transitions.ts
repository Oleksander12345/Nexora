import type { Transition } from 'motion/react';
// Shared timing: settle gently on entry, accelerate slightly when leaving.
export const ease = [0.22, 1, 0.36, 1] as const;
export const settle: Transition = { type: 'tween', duration: 0.32, ease };
export const quick: Transition = { type: 'tween', duration: 0.18, ease };

export const leave: Transition = {
  type: 'tween',
  duration: 0.22,
  ease: [0.4, 0, 1, 1],
};
