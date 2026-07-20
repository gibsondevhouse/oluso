import { cubicOut } from "svelte/easing";
import { fade, fly, scale, type TransitionConfig } from "svelte/transition";

interface CorporateMotionParams {
  delay?: number;
  duration?: number;
}

interface CorporateSlideParams extends CorporateMotionParams {
  y?: number;
}

interface CorporateScaleParams extends CorporateMotionParams {
  start?: number;
}

function durationFor(node: Element, duration: number) {
  const reducedMotion = node.ownerDocument.defaultView?.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  return reducedMotion ? 0 : duration;
}

export function corporateFade(
  node: Element,
  { delay = 0, duration = 150 }: CorporateMotionParams = {},
): TransitionConfig {
  return fade(node, { delay, duration: durationFor(node, duration), easing: cubicOut });
}

export function corporateSlideFly(
  node: Element,
  { delay = 0, duration = 200, y = 4 }: CorporateSlideParams = {},
): TransitionConfig {
  return fly(node, {
    delay,
    duration: durationFor(node, duration),
    easing: cubicOut,
    opacity: 0,
    y,
  });
}

export function corporateScaleIn(
  node: Element,
  { delay = 0, duration = 100, start = 0.86 }: CorporateScaleParams = {},
): TransitionConfig {
  return scale(node, {
    delay,
    duration: durationFor(node, duration),
    easing: cubicOut,
    opacity: 0.72,
    start,
  });
}
