/**
 * lib/responsive-scale.ts
 *
 * Responsive scaling utilities for cases where CSS variables aren't sufficient.
 * Used for dynamic calculations, animation timing, layout algorithms.
 */

import React from 'react';

export class ResponsiveScale {
  private static readonly MIN_VIEWPORT = 300;
  private static readonly MAX_VIEWPORT = 2560;
  private static fpsCache: number | null = null;

  /**
   * Get computed value of CSS variable
   * @param name CSS variable name (with or without --)
   * @returns Numeric pixel value
   */
  static getCSSVariable(name: string): number {
    if (typeof window === 'undefined') return 0;

    const varName = name.startsWith('--') ? name : `--${name}`;
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();

    // Parse "80px" → 80
    return parseInt(value, 10) || 0;
  }

  /**
   * Get string value of CSS variable
   * @param name CSS variable name
   * @returns Full value string (e.g., "clamp(75px, 9vw, 120px)")
   */
  static getCSSVariableRaw(name: string): string {
    if (typeof window === 'undefined') return '';

    const varName = name.startsWith('--') ? name : `--${name}`;
    return getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
  }

  /**
   * Measure actual device FPS capability
   * Runs for ~1 second, returns approximate FPS
   * Results cached for performance
   */
  static measureFps(): number {
    if (this.fpsCache !== null) return this.fpsCache;
    if (typeof window === 'undefined') return 60;

    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 60; // Default if measurement fails

    const measureFrame = () => {
      frameCount++;
      const now = performance.now();
      const elapsed = now - lastTime;

      if (elapsed >= 1000) {
        fps = frameCount;
        this.fpsCache = fps; // Cache result
        return;
      }

      requestAnimationFrame(measureFrame);
    };

    requestAnimationFrame(measureFrame);

    // If measurement hasn't completed quickly, return default
    setTimeout(() => {
      if (this.fpsCache === null) {
        this.fpsCache = frameCount || 60;
      }
    }, 1100);

    return fps;
  }

  /**
   * Clear FPS cache (call on device change)
   */
  static clearFpsCache(): void {
    this.fpsCache = null;
  }

  /**
   * Adjust animation duration for device FPS
   * Ensures same visual frame count on all devices
   *
   * Example: 300ms animation at 60fps = 18 frames
   *          At 30fps, should be 600ms to maintain 18 frames
   */
  static responsiveAnimationDuration(
    baseDuration: number,
    targetFps: number = 60
  ): number {
    if (typeof window === 'undefined') return baseDuration;

    const measuredFps = this.measureFps();
    if (measuredFps === 0) return baseDuration;

    const fpsFactor = targetFps / measuredFps;
    return Math.round(baseDuration * fpsFactor);
  }

  /**
   * Determine optimal FPS target based on device
   * Heuristic based on viewport size and pixel ratio
   */
  static determineFpsTarget(): 20 | 30 | 45 | 60 | 90 | 120 {
    if (typeof window === 'undefined') return 60;

    const vw = window.innerWidth;
    const pixelRatio = window.devicePixelRatio || 1;

    // Small phones: target 30fps
    if (vw < 500) return 30;

    // Tablets: target 45fps
    if (vw < 1024) return 45;

    // Standard laptops: target 60fps
    if (vw < 1440) return 60;

    // High-end desktop: target 90-120fps based on pixel ratio
    return pixelRatio > 1.5 ? 90 : 120;
  }

  /**
   * Scale value linearly between two breakpoints
   * @param minVw Minimum viewport width
   * @param maxVw Maximum viewport width
   * @param minValue Value at min viewport
   * @param maxValue Value at max viewport
   * @returns Scaled value for current viewport
   */
  static scaleWithViewport(
    minVw: number,
    maxVw: number,
    minValue: number,
    maxValue: number
  ): number {
    if (typeof window === 'undefined') return minValue;

    const currentVw = window.innerWidth;
    const ratio = (currentVw - minVw) / (maxVw - minVw);
    const clamped = Math.max(0, Math.min(1, ratio));

    return minValue + (maxValue - minValue) * clamped;
  }

  /**
   * Calculate how many columns fit in available width
   * Used for responsive grid layouts
   */
  static calculateColumns(
    containerWidth: number,
    nodeWidth: number,
    gapWidth: number
  ): number {
    const itemWidth = nodeWidth + gapWidth;
    return Math.max(1, Math.floor(containerWidth / itemWidth));
  }

  /**
   * Parse CSS clamp() string to get current computed value
   * Creates temporary element, measures it, cleans up
   * Useful for getting actual pixel value of "clamp(75px, 9vw, 120px)"
   */
  static parseCSSValue(cssValue: string): number {
    if (typeof window === 'undefined') return 0;

    const temp = document.createElement('div');
    temp.style.width = cssValue;
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';

    document.body.appendChild(temp);
    const computed = window.getComputedStyle(temp).width;
    document.body.removeChild(temp);

    return parseInt(computed, 10) || 0;
  }
}

/**
 * React Hook: useResponsiveScale
 * Subscribe to viewport resize events
 * Returns current viewport dimensions
 */
export function useResponsiveScale() {
  const [scale, setScale] = React.useState(() => ({
    vw: typeof window !== 'undefined' ? window.innerWidth : 1024,
    vh: typeof window !== 'undefined' ? window.innerHeight : 768,
  }));

  React.useEffect(() => {
    const handleResize = () => {
      setScale({
        vw: window.innerWidth,
        vh: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return scale;
}

/**
 * React Hook: useResponsiveAnimation
 * Get animation duration adjusted for device FPS capability
 * Animations will have same frame count on all devices
 */
export function useResponsiveAnimation(baseDuration: number = 300) {
  const [duration, setDuration] = React.useState(baseDuration);

  React.useEffect(() => {
    const adjusted = ResponsiveScale.responsiveAnimationDuration(baseDuration);
    setDuration(adjusted);
  }, [baseDuration]);

  return duration;
}

/**
 * React Hook: useMeasureContainer
 * Subscribe to container resize changes
 * Returns current width and height of container element
 * Used for responsive layout calculations
 */
export function useMeasureContainer(
  ref: React.RefObject<HTMLDivElement>
): { width: number; height: number } {
  const [dimensions, setDimensions] = React.useState({
    width: 0,
    height: 0,
  });

  React.useEffect(() => {
    if (!ref.current) return;

    // Initial measurement
    const rect = ref.current.getBoundingClientRect();
    setDimensions({
      width: rect.width,
      height: rect.height,
    });

    // Watch for resize
    const observer = new ResizeObserver(([entry]) => {
      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return dimensions;
}

/**
 * React Hook: useResponsiveFps
 * Measure device FPS and subscribe to changes
 * Updates when viewport changes (since FPS target changes with viewport)
 */
export function useResponsiveFps() {
  const [fps, setFps] = React.useState(() => ResponsiveScale.measureFps());
  const [fpsTarget, setFpsTarget] = React.useState(() => ResponsiveScale.determineFpsTarget());

  React.useEffect(() => {
    const measured = ResponsiveScale.measureFps();
    setFps(measured);
    setFpsTarget(ResponsiveScale.determineFpsTarget());
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      ResponsiveScale.clearFpsCache();
      const measured = ResponsiveScale.measureFps();
      setFps(measured);
      setFpsTarget(ResponsiveScale.determineFpsTarget());
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { fps, fpsTarget };
}

/**
 * Utility: Get readable description of device category
 * For debugging, logging, testing
 */
export function getDeviceSizeCategory(vw: number): string {
  if (vw < 640) return 'phone';
  if (vw < 1024) return 'tablet';
  if (vw < 1440) return 'desktop';
  return 'ultrawide';
}

/**
 * Utility: Get readable description of FPS capability
 */
export function getFpsCategory(fps: number): string {
  if (fps < 25) return 'very-low';
  if (fps < 35) return 'low';
  if (fps < 50) return 'medium';
  if (fps < 75) return 'high';
  return 'very-high';
}

export default ResponsiveScale;
