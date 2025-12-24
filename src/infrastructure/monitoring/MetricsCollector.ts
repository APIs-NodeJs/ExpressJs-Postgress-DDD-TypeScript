export interface Metrics {
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  averageResponseTime: number;
  requestsPerSecond: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  uptime: number;
  timestamp: string;
}

export class MetricsCollector {
  private requestCount = 0;
  private errorCount = 0;
  private responseTimes: number[] = [];
  private startTime = Date.now();
  private windowStart = Date.now();

  incrementRequests(): void {
    this.requestCount++;
  }

  incrementErrors(): void {
    this.errorCount++;
  }

  recordResponseTime(duration: number): void {
    this.responseTimes.push(duration);
    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
  }

  getMetrics(): Metrics {
    const now = Date.now();
    const windowDuration = (now - this.windowStart) / 1000; // seconds
    const averageResponseTime =
      this.responseTimes.length > 0
        ? this.responseTimes.reduce((a, b) => a + b, 0) /
          this.responseTimes.length
        : 0;

    const memory = process.memoryUsage();

    return {
      totalRequests: this.requestCount,
      totalErrors: this.errorCount,
      errorRate:
        this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
      averageResponseTime: Math.round(averageResponseTime),
      requestsPerSecond: Math.round(this.requestCount / windowDuration),
      memoryUsage: {
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
        rss: Math.round(memory.rss / 1024 / 1024),
      },
      uptime: Math.round((now - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  reset(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimes = [];
    this.windowStart = Date.now();
  }
}

export const metricsCollector = new MetricsCollector();
