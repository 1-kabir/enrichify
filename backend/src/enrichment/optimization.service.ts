/**
 * Agent Swarm Optimization Utilities
 * 
 * This file contains utilities for optimizing the agent swarm performance
 */

import { Injectable, Logger } from '@nestjs/common';
import { MonitoringService } from '../src/enrichment/monitoring.service';
import { SwarmMetrics } from '../src/enrichment/monitoring.service';

@Injectable()
export class OptimizationService {
  private readonly logger = new Logger(OptimizationService.name);

  constructor(private monitoringService: MonitoringService) {}

  /**
   * Analyzes current performance and suggests optimizations
   */
  async analyzePerformance(): Promise<OptimizationRecommendations> {
    const metrics = await this.monitoringService.collectMetrics();
    const historicalMetrics = this.monitoringService.getHistoricalMetrics(1); // Last hour

    const recommendations: OptimizationRecommendations = {
      concurrencyAdjustments: [],
      resourceAllocations: [],
      scalingSuggestions: [],
      performanceIssues: [],
    };

    // Analyze error rate
    if (metrics.errorRate > 10) {
      recommendations.performanceIssues.push({
        issue: 'High error rate detected',
        severity: 'high',
        current: `${metrics.errorRate.toFixed(2)}%`,
        recommendation: 'Investigate provider connectivity and rate limits',
      });
    } else if (metrics.errorRate > 5) {
      recommendations.performanceIssues.push({
        issue: 'Moderate error rate',
        severity: 'medium',
        current: `${metrics.errorRate.toFixed(2)}%`,
        recommendation: 'Monitor closely and consider provider diversification',
      });
    }

    // Analyze agent utilization
    if (metrics.agentUtilization < 30) {
      recommendations.scalingSuggestions.push({
        suggestion: 'Low agent utilization',
        current: `${metrics.agentUtilization.toFixed(2)}%`,
        recommendation: 'Consider reducing number of active agents to save resources',
      });
    } else if (metrics.agentUtilization > 90) {
      recommendations.scalingSuggestions.push({
        suggestion: 'High agent utilization',
        current: `${metrics.agentUtilization.toFixed(2)}%`,
        recommendation: 'Consider increasing number of agents to handle load',
      });
    }

    // Analyze throughput
    if (metrics.throughput < 5) {
      recommendations.concurrencyAdjustments.push({
        parameter: 'concurrency_level',
        current: 'low',
        recommended: 'increase',
        reason: 'Low throughput detected',
      });
    }

    // Analyze processing time
    if (metrics.avgProcessingTime > 10000) { // More than 10 seconds
      recommendations.performanceIssues.push({
        issue: 'Slow processing time',
        severity: 'medium',
        current: `${(metrics.avgProcessingTime / 1000).toFixed(2)}s`,
        recommendation: 'Optimize data processing pipeline or upgrade hardware',
      });
    }

    return recommendations;
  }

  /**
   * Automatically applies optimizations based on analysis
   */
  async applyOptimizations(applySettings: OptimizationSettings = {}): Promise<OptimizationResult> {
    const recommendations = await this.analyzePerformance();
    const results: OptimizationResult = {
      appliedChanges: [],
      skippedChanges: [],
      overallImpact: 'neutral',
    };

    // Apply concurrency adjustments
    for (const adj of recommendations.concurrencyAdjustments) {
      if (applySettings.applyConcurrencyChanges !== false) {
        // In a real implementation, this would adjust actual concurrency
        results.appliedChanges.push({
          type: 'concurrency',
          parameter: adj.parameter,
          previous: adj.current,
          new: adj.recommended,
          impact: 'medium',
        });
      } else {
        results.skippedChanges.push(`Skipped concurrency adjustment: ${adj.parameter}`);
      }
    }

    // Apply scaling suggestions
    for (const scale of recommendations.scalingSuggestions) {
      if (applySettings.applyScalingChanges !== false) {
        // In a real implementation, this would scale agents up/down
        results.appliedChanges.push({
          type: 'scaling',
          parameter: 'agent_count',
          previous: 'current',
          new: scale.recommendation,
          impact: 'high',
        });
      } else {
        results.skippedChanges.push(`Skipped scaling suggestion: ${scale.suggestion}`);
      }
    }

    // Determine overall impact
    if (results.appliedChanges.length > 0) {
      results.overallImpact = results.appliedChanges.some(c => c.impact === 'high') ? 'high' : 'medium';
    }

    this.logger.log(`Applied ${results.appliedChanges.length} optimizations, skipped ${results.skippedChanges.length}`);

    return results;
  }

  /**
   * Gets performance baseline for comparison
   */
  async getBaseline(): Promise<SwarmMetrics> {
    // In a real implementation, this would retrieve stored baseline metrics
    // For now, we'll return a representative sample
    return {
      totalJobs: 100,
      activeJobs: 5,
      completedJobs: 85,
      failedJobs: 2,
      avgProcessingTime: 5000, // 5 seconds
      activeAgents: 4,
      totalAgents: 5,
      agentUtilization: 80,
      errorRate: 2.3,
      throughput: 15, // jobs per minute
    };
  }

  /**
   * Compares current performance to baseline
   */
  async comparePerformanceToBaseline(): Promise<PerformanceComparison> {
    const currentMetrics = await this.monitoringService.collectMetrics();
    const baseline = await this.getBaseline();

    return {
      current: currentMetrics,
      baseline,
      differences: {
        totalJobs: currentMetrics.totalJobs - baseline.totalJobs,
        errorRateChange: currentMetrics.errorRate - baseline.errorRate,
        throughputChange: currentMetrics.throughput - baseline.throughput,
        avgProcessingTimeChange: currentMetrics.avgProcessingTime - baseline.avgProcessingTime,
        agentUtilizationChange: currentMetrics.agentUtilization - baseline.agentUtilization,
      },
      performanceTrend: this.calculatePerformanceTrend(currentMetrics, baseline),
    };
  }

  /**
   * Calculates overall performance trend
   */
  private calculatePerformanceTrend(current: SwarmMetrics, baseline: SwarmMetrics): 'improving' | 'declining' | 'stable' {
    // Simple heuristic: if error rate decreased and throughput increased, it's improving
    const errorImproved = current.errorRate < baseline.errorRate;
    const throughputImproved = current.throughput > baseline.throughput;
    const processingTimeImproved = current.avgProcessingTime < baseline.avgProcessingTime;

    if ((errorImproved && throughputImproved) || (errorImproved && processingTimeImproved)) {
      return 'improving';
    } else if ((!errorImproved && !throughputImproved) || (!errorImproved && !processingTimeImproved)) {
      return 'declining';
    } else {
      return 'stable';
    }
  }
}

// Types for optimization
export interface OptimizationRecommendations {
  concurrencyAdjustments: ConcurrencyAdjustment[];
  resourceAllocations: ResourceAllocation[];
  scalingSuggestions: ScalingSuggestion[];
  performanceIssues: PerformanceIssue[];
}

export interface ConcurrencyAdjustment {
  parameter: string;
  current: string;
  recommended: string;
  reason: string;
}

export interface ResourceAllocation {
  resource: string;
  currentAllocation: number;
  recommendedAllocation: number;
  reason: string;
}

export interface ScalingSuggestion {
  suggestion: string;
  current: string;
  recommendation: string;
}

export interface PerformanceIssue {
  issue: string;
  severity: 'low' | 'medium' | 'high';
  current: string;
  recommendation: string;
}

export interface OptimizationSettings {
  applyConcurrencyChanges?: boolean;
  applyScalingChanges?: boolean;
  applyResourceChanges?: boolean;
}

export interface OptimizationResult {
  appliedChanges: AppliedChange[];
  skippedChanges: string[];
  overallImpact: 'low' | 'medium' | 'high' | 'neutral';
}

export interface AppliedChange {
  type: string;
  parameter: string;
  previous: string;
  new: string;
  impact: 'low' | 'medium' | 'high';
}

export interface PerformanceComparison {
  current: SwarmMetrics;
  baseline: SwarmMetrics;
  differences: PerformanceDifferences;
  performanceTrend: 'improving' | 'declining' | 'stable';
}

export interface PerformanceDifferences {
  totalJobs: number;
  errorRateChange: number;
  throughputChange: number;
  avgProcessingTimeChange: number;
  agentUtilizationChange: number;
}