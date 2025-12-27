import { logger } from "../utils/AdvancedLogger";

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number; // Median
  p95: number;
  p99: number;
  errors: number;
  errorRate: number;
  lastUpdated: Date;
}

interface RequestTiming {
  duration: number;
  timestamp: Date;
  statusCode: number;
}

/**
 * Performance monitoring and analytics service
 */
export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: Map<string, RequestTiming[]> = new Map();
  private readonly MAX_SAMPLES = 1000; // Keep last 1000 requests per endpoint
  private readonly CLEANUP_INTERVAL = 3600000; // 1 hour

  private constructor() {
    // Periodic cleanup of old data
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
  }

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance =
        new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * Record a request
   */
  public recordRequest(
    method: string,
    endpoint: string,
    duration: number,
    statusCode: number
  ): void {
    const key = `${method}:${endpoint}`;

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const timings = this.metrics.get(key)!;
    timings.push({
      duration,
      timestamp: new Date(),
      statusCode,
    });

    // Keep only recent samples
    if (timings.length > this.MAX_SAMPLES) {
      timings.shift();
    }

    // Alert on slow requests
    if (duration > 5000) {
      logger.error("🐌 Critical slow request detected", {
        method,
        endpoint,
        duration: `${duration}ms`,
        statusCode,
      });
    } else if (duration > 1000) {
      logger.warn("⏱️  Slow request detected", {
        method,
        endpoint,
        duration: `${duration}ms`,
        statusCode,
      });
    }
  }

  /**
   * Get metrics for specific endpoint
   */
  public getEndpointMetrics(
    method: string,
    endpoint: string
  ): PerformanceMetrics | null {
    const key = `${method}:${endpoint}`;
    const timings = this.metrics.get(key);

    if (!timings || timings.length === 0) {
      return null;
    }

    const durations = timings.map((t) => t.duration).sort((a, b) => a - b);
    const errors = timings.filter((t) => t.statusCode >= 400).length;

    return {
      endpoint,
      method,
      count: timings.length,
      avgDuration: this.average(durations),
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p50: this.percentile(durations, 50),
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99),
      errors,
      errorRate: (errors / timings.length) * 100,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get all metrics
   */
  public getAllMetrics(): PerformanceMetrics[] {
    const allMetrics: PerformanceMetrics[] = [];

    for (const [key, _] of this.metrics) {
      const [method, endpoint] = key.split(":");
      const metrics = this.getEndpointMetrics(method, endpoint);
      if (metrics) {
        allMetrics.push(metrics);
      }
    }

    // Sort by average duration (slowest first)
    return allMetrics.sort((a, b) => b.avgDuration - a.avgDuration);
  }

  /**
   * Get summary statistics
   */
  public getSummary(): {
    totalEndpoints: number;
    totalRequests: number;
    overallAvgDuration: number;
    slowestEndpoints: PerformanceMetrics[];
    highestErrorRates: PerformanceMetrics[];
  } {
    const allMetrics = this.getAllMetrics();

    const totalRequests = allMetrics.reduce((sum, m) => sum + m.count, 0);
    const totalDuration = allMetrics.reduce(
      (sum, m) => sum + m.avgDuration * m.count,
      0
    );

    return {
      totalEndpoints: allMetrics.length,
      totalRequests,
      overallAvgDuration: totalRequests > 0 ? totalDuration / totalRequests : 0,
      slowestEndpoints: allMetrics.slice(0, 10),
      highestErrorRates: allMetrics
        .sort((a, b) => b.errorRate - a.errorRate)
        .slice(0, 10),
    };
  }

  /**
   * Get recommendations based on metrics
   */
  public getRecommendations(): string[] {
    const recommendations: string[] = [];
    const allMetrics = this.getAllMetrics();

    for (const metric of allMetrics) {
      // Slow endpoints
      if (metric.p95 > 2000) {
        recommendations.push(
          `⚠️  ${metric.method} ${metric.endpoint} has slow P95 latency (${metric.p95.toFixed(0)}ms). Consider optimization.`
        );
      }

      // High error rates
      if (metric.errorRate > 5 && metric.count > 10) {
        recommendations.push(
          `❌ ${metric.method} ${metric.endpoint} has high error rate (${metric.errorRate.toFixed(1)}%). Investigate failures.`
        );
      }

      // High variability
      const variability = metric.maxDuration - metric.minDuration;
      if (variability > 10000 && metric.count > 100) {
        recommendations.push(
          `📊 ${metric.method} ${metric.endpoint} has high latency variability (${variability.toFixed(0)}ms). Check for bottlenecks.`
        );
      }
    }

    return recommendations;
  }

  /**
   * Clear old data
   */
  private cleanup(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    for (const [key, timings] of this.metrics) {
      const filtered = timings.filter((t) => t.timestamp > cutoffTime);

      if (filtered.length === 0) {
        this.metrics.delete(key);
      } else {
        this.metrics.set(key, filtered);
      }
    }

    logger.debug("Performance metrics cleanup completed", {
      endpointsTracked: this.metrics.size,
    });
  }

  /**
   * Calculate average
   */
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedNumbers: number[], p: number): number {
    if (sortedNumbers.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedNumbers.length) - 1;
    return sortedNumbers[Math.max(0, index)];
  }

  /**
   * Export metrics for external systems (Prometheus, Grafana, etc.)
   */
  public exportMetrics(): string {
    const metrics = this.getAllMetrics();
    const lines: string[] = [];

    lines.push(
      "# HELP http_request_duration_ms HTTP request duration in milliseconds"
    );
    lines.push("# TYPE http_request_duration_ms summary");

    for (const metric of metrics) {
      const labels = `method="${metric.method}",endpoint="${metric.endpoint}"`;
      lines.push(
        `http_request_duration_ms_sum{${labels}} ${metric.avgDuration * metric.count}`
      );
      lines.push(`http_request_duration_ms_count{${labels}} ${metric.count}`);
      lines.push(
        `http_request_duration_ms{${labels},quantile="0.5"} ${metric.p50}`
      );
      lines.push(
        `http_request_duration_ms{${labels},quantile="0.95"} ${metric.p95}`
      );
      lines.push(
        `http_request_duration_ms{${labels},quantile="0.99"} ${metric.p99}`
      );
    }

    lines.push("");
    lines.push(
      "# HELP http_request_errors_total Total number of HTTP request errors"
    );
    lines.push("# TYPE http_request_errors_total counter");

    for (const metric of metrics) {
      const labels = `method="${metric.method}",endpoint="${metric.endpoint}"`;
      lines.push(`http_request_errors_total{${labels}} ${metric.errors}`);
    }

    return lines.join("\n");
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitoringService.getInstance();
