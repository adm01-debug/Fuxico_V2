import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from "web-vitals";
import { logger } from "./logger";

const reportMetric = (metric: Metric) => {
  const { name, value, rating, id } = metric;
  
  logger.info(`[Web Vitals] ${name}: ${Math.round(value)}ms (${rating})`, {
    metric: name,
    value: Math.round(value),
    rating,
    id,
  });

  // Send to analytics endpoint in production
  if (import.meta.env.PROD && navigator.sendBeacon) {
    const body = JSON.stringify({
      name,
      value: Math.round(value),
      rating,
      id,
      url: window.location.pathname,
      timestamp: Date.now(),
    });
    navigator.sendBeacon("/api/vitals", body);
  }
};

export const initWebVitals = () => {
  onCLS(reportMetric);
  onINP(reportMetric);
  onLCP(reportMetric);
  onFCP(reportMetric);
  onTTFB(reportMetric);
};
