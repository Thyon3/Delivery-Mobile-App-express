/**
 * Metrics and Monitoring Utilities
 */

import logger from './logger';

class Metrics {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  /**
   * Increment counter
   */
  incrementCounter(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  /**
   * Set gauge value
   */
  setGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  /**
   * Record histogram value
   */
  recordHistogram(name: string, value: number): void {
    const values = this.histograms.get(name) || [];
    values.push(value);
    
    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
    
    this.histograms.set(name, values);
  }

  /**
   * Get counter value
   */
  getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }

  /**
   * Get gauge value
   */
  getGauge(name: string): number {
    return this.gauges.get(name) || 0;
  }

  /**
   * Get histogram stats
   */
  getHistogramStats(name: string): {
    min: number;
    max: number;
    avg: number;
    p95: number;
    p99: number;
  } | null {
    const values = this.histograms.get(name);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      min: sorted[0],
      max: sorted[len - 1],
      avg: sorted.reduce((sum, val) => sum + val, 0) / len,
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)],
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    histograms: Record<string, any>;
  } {
    const histograms: Record<string, any> = {};
    this.histograms.forEach((values, name) => {
      histograms[name] = this.getHistogramStats(name);
    });

    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms,
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    logger.info('Metrics reset');
  }
}

export const metrics = new Metrics();

/**
 * Measure execution time
 */
export async function measureTime<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    metrics.recordHistogram(`${name}_duration`, duration);
    return result;
  } catch (error) {
    metrics.incrementCounter(`${name}_errors`);
    throw error;
  }
}
