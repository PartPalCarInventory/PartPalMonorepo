import { performanceService, PerformanceSummary } from '../services/performanceService';
import { databaseManager } from './database';
import { emailService } from '../services/emailService';

export interface PerformanceReport {
  generatedAt: Date;
  period: string;
  summary: PerformanceSummary;
  recommendations: string[];
  alerts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  trends: {
    responseTimetrend: 'improving' | 'degrading' | 'stable';
    errorRatetrend: 'improving' | 'degrading' | 'stable';
    memoryUsageTrend: 'improving' | 'degrading' | 'stable';
  };
}

export class PerformanceReporter {
  private static instance: PerformanceReporter;

  static getInstance(): PerformanceReporter {
    if (!PerformanceReporter.instance) {
      PerformanceReporter.instance = new PerformanceReporter();
    }
    return PerformanceReporter.instance;
  }

  async generateReport(period: PerformanceSummary['period'] = '24h'): Promise<PerformanceReport> {
    const summary = performanceService.getPerformanceSummary(period);
    const alerts = this.analyzeAlerts();
    const recommendations = this.generateRecommendations(summary, alerts);
    const trends = await this.analyzeTrends(period);

    return {
      generatedAt: new Date(),
      period,
      summary,
      recommendations,
      alerts,
      trends,
    };
  }

  private analyzeAlerts() {
    const allAlerts = performanceService.getAlerts();

    return {
      critical: allAlerts.filter(a => a.severity === 'critical').length,
      high: allAlerts.filter(a => a.severity === 'high').length,
      medium: allAlerts.filter(a => a.severity === 'medium').length,
      low: allAlerts.filter(a => a.severity === 'low').length,
    };
  }

  private generateRecommendations(summary: PerformanceSummary, alerts: any): string[] {
    const recommendations: string[] = [];

    // Response time recommendations
    if (summary.requests.averageResponseTime > 1000) {
      recommendations.push('Consider optimizing slow endpoints or adding caching');
    }

    // Error rate recommendations
    if (summary.errors.rate > 0.02) { // 2%
      recommendations.push('High error rate detected. Review error logs and fix failing endpoints');
    }

    // Memory usage recommendations
    if (summary.system.averageMemoryUsage > 0.8) {
      recommendations.push('Memory usage is high. Consider implementing memory optimization or scaling');
    }

    // Alert-based recommendations
    if (alerts.critical > 0) {
      recommendations.push('Critical performance alerts require immediate attention');
    }

    if (summary.slowestEndpoints.length > 0) {
      const slowest = summary.slowestEndpoints[0];
      if (slowest.averageResponseTime > 2000) {
        recommendations.push(`Optimize ${slowest.endpoint} endpoint (${slowest.averageResponseTime.toFixed(0)}ms avg)`);
      }
    }

    // CPU recommendations
    if (summary.system.averageCpuUsage > 0.7) {
      recommendations.push('CPU usage is high. Consider optimizing algorithms or scaling horizontally');
    }

    // Request volume recommendations
    if (summary.requests.total > 10000) {
      recommendations.push('High request volume. Consider implementing request queuing or load balancing');
    }

    if (recommendations.length === 0) {
      recommendations.push('System performance is within acceptable parameters');
    }

    return recommendations;
  }

  private async analyzeTrends(period: PerformanceSummary['period']): Promise<any> {
    // For trend analysis, we would compare current period with previous period
    // This is a simplified implementation

    const currentSummary = performanceService.getPerformanceSummary(period);

    // In a real implementation, you would store historical data and compare
    return {
      responseTimeT

: 'stable',
      errorRatetrend: 'stable',
      memoryUsageTrend: 'stable',
    };
  }

  async generateHtmlReport(report: PerformanceReport): Promise<string> {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PartPal Performance Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px; }
          .section { margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .metric { display: inline-block; margin: 10px; padding: 10px; background-color: #f8f9fa; border-radius: 4px; }
          .alert-critical { color: #dc2626; font-weight: bold; }
          .alert-high { color: #ea580c; }
          .alert-medium { color: #ca8a04; }
          .recommendation { background-color: #ecfdf5; padding: 10px; margin: 5px 0; border-left: 4px solid #10b981; }
          .table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          .table th, .table td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          .table th { background-color: #f3f4f6; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PartPal Performance Report</h1>
          <p>Generated: ${report.generatedAt.toLocaleString()}</p>
          <p>Period: ${report.period}</p>
        </div>

        <div class="section">
          <h2>Request Summary</h2>
          <div class="metric">
            <strong>Total Requests:</strong> ${report.summary.requests.total.toLocaleString()}
          </div>
          <div class="metric">
            <strong>Success Rate:</strong> ${((report.summary.requests.successful / report.summary.requests.total) * 100).toFixed(1)}%
          </div>
          <div class="metric">
            <strong>Average Response Time:</strong> ${report.summary.requests.averageResponseTime.toFixed(0)}ms
          </div>
          <div class="metric">
            <strong>Error Rate:</strong> ${(report.summary.errors.rate * 100).toFixed(2)}%
          </div>
        </div>

        <div class="section">
          <h2>System Performance</h2>
          <div class="metric">
            <strong>Average CPU Usage:</strong> ${(report.summary.system.averageCpuUsage * 100).toFixed(1)}%
          </div>
          <div class="metric">
            <strong>Average Memory Usage:</strong> ${(report.summary.system.averageMemoryUsage * 100).toFixed(1)}%
          </div>
          <div class="metric">
            <strong>Peak Memory Usage:</strong> ${(report.summary.system.peakMemoryUsage * 100).toFixed(1)}%
          </div>
        </div>

        <div class="section">
          <h2>Performance Alerts</h2>
          <div class="metric alert-critical">Critical: ${report.alerts.critical}</div>
          <div class="metric alert-high">High: ${report.alerts.high}</div>
          <div class="metric alert-medium">Medium: ${report.alerts.medium}</div>
          <div class="metric">Low: ${report.alerts.low}</div>
        </div>

        <div class="section">
          <h2>Slowest Endpoints</h2>
          <table class="table">
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Average Response Time</th>
                <th>Call Count</th>
              </tr>
            </thead>
            <tbody>
              ${report.summary.slowestEndpoints.slice(0, 10).map(endpoint => `
                <tr>
                  <td>${endpoint.endpoint}</td>
                  <td>${endpoint.averageResponseTime.toFixed(0)}ms</td>
                  <td>${endpoint.callCount.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Recommendations</h2>
          ${report.recommendations.map(rec => `
            <div class="recommendation">${rec}</div>
          `).join('')}
        </div>
      </body>
      </html>
    `;
  }

  async sendPerformanceReport(adminEmail: string, period: PerformanceSummary['period'] = '24h'): Promise<boolean> {
    try {
      const report = await this.generateReport(period);
      const htmlContent = await this.generateHtmlReport(report);

      const subject = `PartPal Performance Report - ${period.toUpperCase()}`;

      const textContent = `
        PartPal Performance Report
        Generated: ${report.generatedAt.toLocaleString()}
        Period: ${report.period}

        Request Summary:
        - Total Requests: ${report.summary.requests.total.toLocaleString()}
        - Success Rate: ${((report.summary.requests.successful / report.summary.requests.total) * 100).toFixed(1)}%
        - Average Response Time: ${report.summary.requests.averageResponseTime.toFixed(0)}ms
        - Error Rate: ${(report.summary.errors.rate * 100).toFixed(2)}%

        System Performance:
        - Average CPU Usage: ${(report.summary.system.averageCpuUsage * 100).toFixed(1)}%
        - Average Memory Usage: ${(report.summary.system.averageMemoryUsage * 100).toFixed(1)}%

        Alerts:
        - Critical: ${report.alerts.critical}
        - High: ${report.alerts.high}
        - Medium: ${report.alerts.medium}
        - Low: ${report.alerts.low}

        Recommendations:
        ${report.recommendations.map(rec => `- ${rec}`).join('\n')}
      `;

      return await emailService.sendEmail({
        to: adminEmail,
        subject,
        html: htmlContent,
        text: textContent,
      });
    } catch (error) {
      console.error('Failed to send performance report:', error);
      return false;
    }
  }

  schedulePerformanceReports(): void {
    // Send daily reports at 9 AM
    const sendDailyReport = async () => {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        await this.sendPerformanceReport(adminEmail, '24h');
        console.log('Daily performance report sent');
      }
    };

    // Schedule daily reports (would need proper cron implementation)
    setInterval(sendDailyReport, 24 * 60 * 60 * 1000); // 24 hours

    console.log('Performance report scheduling enabled');
  }
}

export const performanceReporter = PerformanceReporter.getInstance();