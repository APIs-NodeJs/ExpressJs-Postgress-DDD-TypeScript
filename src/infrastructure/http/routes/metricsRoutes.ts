import { Router, Request, Response } from "express";
import { metricsCollector } from "../../monitoring/MetricsCollector";
import { authenticate } from "../middlewares/authenticate";

const router = Router();

/**
 * GET /metrics
 * Returns application metrics (requires authentication)
 */
router.get("/metrics", authenticate, (req: Request, res: Response) => {
  const metrics = metricsCollector.getMetrics();
  res.status(200).json(metrics);
});

/**
 * GET /metrics/prometheus
 * Returns metrics in Prometheus format (for Prometheus scraping)
 */
router.get("/metrics/prometheus", (req: Request, res: Response) => {
  const metrics = metricsCollector.getMetrics();

  const prometheusFormat = `
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total ${metrics.totalRequests}

# HELP http_errors_total Total number of HTTP errors
# TYPE http_errors_total counter
http_errors_total ${metrics.totalErrors}

# HELP http_request_duration_ms Average HTTP request duration
# TYPE http_request_duration_ms gauge
http_request_duration_ms ${metrics.averageResponseTime}

# HELP nodejs_heap_used_bytes Node.js heap used
# TYPE nodejs_heap_used_bytes gauge
nodejs_heap_used_bytes ${metrics.memoryUsage.heapUsed * 1024 * 1024}

# HELP nodejs_heap_total_bytes Node.js heap total
# TYPE nodejs_heap_total_bytes gauge
nodejs_heap_total_bytes ${metrics.memoryUsage.heapTotal * 1024 * 1024}

# HELP process_uptime_seconds Process uptime
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${metrics.uptime}
  `.trim();

  res.set("Content-Type", "text/plain; version=0.0.4");
  res.send(prometheusFormat);
});

export { router as metricsRoutes };
