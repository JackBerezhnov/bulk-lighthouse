'use client';

import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LighthouseResult } from '@/lib/supabase';

interface PerformanceChartProps {
  refreshTrigger?: number;
  selectedWebsite?: string | null;
}

interface ChartDataPoint {
  date: string;
  timestamp: number;
  first_content_paint: number;
  speed_index: number;
  largest_content_paint: number;
  total_blocking_time: number;
  time_to_interactive: number;
  url?: string;
  device_strategy?: string;
}

const METRIC_COLORS = {
  first_content_paint: '#3B82F6', // Blue
  speed_index: '#10B981', // Green
  largest_content_paint: '#F59E0B', // Yellow
  total_blocking_time: '#EF4444', // Red
  time_to_interactive: '#8B5CF6', // Purple
};

const METRIC_LABELS = {
  first_content_paint: 'First Content Paint (s)',
  speed_index: 'Speed Index (s)',
  largest_content_paint: 'Largest Content Paint (s)',
  total_blocking_time: 'Total Blocking Time (ms)',
  time_to_interactive: 'Time to Interactive (s)',
};

export default function PerformanceChart({ refreshTrigger, selectedWebsite }: PerformanceChartProps) {
  const [results, setResults] = useState<LighthouseResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'first_content_paint',
    'largest_content_paint',
    'time_to_interactive'
  ]);
  const [strategyFilter, setStrategyFilter] = useState<'all' | 'desktop' | 'mobile'>('all');

  const fetchResults = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/results?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      
      const data = await response.json();
      let filteredResults = data.results;
      
      // Filter by selected website if specified
      if (selectedWebsite) {
        filteredResults = data.results.filter((result: LighthouseResult) => {
          if (!result.url) return false;
          try {
            const urlObj = new URL(result.url);
            return urlObj.hostname === selectedWebsite;
          } catch (e) {
            return false;
          }
        });
      }
      
      // Filter by strategy if specified
      if (strategyFilter !== 'all') {
        filteredResults = filteredResults.filter((result: LighthouseResult) => 
          result.device_strategy === strategyFilter
        );
      }
      
      // Sort by date (oldest first for chart)
      const sortedResults = filteredResults.sort((a: LighthouseResult, b: LighthouseResult) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateA - dateB;
      });
      
      setResults(sortedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [refreshTrigger, selectedWebsite, strategyFilter]);

  const chartData: ChartDataPoint[] = useMemo(() => {
    return results.map((result) => ({
      date: result.created_at ? new Date(result.created_at).toLocaleDateString() : 'Unknown',
      timestamp: result.created_at ? new Date(result.created_at).getTime() : 0,
      first_content_paint: result.first_content_paint || 0,
      speed_index: result.speed_index || 0,
      largest_content_paint: result.largest_content_paint || 0,
      total_blocking_time: result.total_blocking_time || 0,
      time_to_interactive: result.time_to_interactive || 0,
      url: result.url,
      device_strategy: result.device_strategy,
    }));
  }, [results]);

  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      color: string;
      dataKey: string;
      value: number;
      payload: ChartDataPoint;
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{label}</p>
          {data.url && (
            <p className="text-blue-400 text-sm truncate max-w-xs">{data.url}</p>
          )}
          {data.device_strategy && (
            <p className="text-gray-400 text-xs mb-2">
              {data.device_strategy === 'desktop' ? '🖥️ Desktop' : '📱 Mobile'}
            </p>
          )}
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {METRIC_LABELS[entry.dataKey as keyof typeof METRIC_LABELS]}: {
                entry.dataKey === 'total_blocking_time' 
                  ? `${entry.value.toFixed(0)}ms`
                  : `${entry.value.toFixed(2)}s`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading chart data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400">Error loading chart: {error}</div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Performance Trends
        </h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-gray-400">
            <p>No performance data available yet.</p>
            <p className="text-sm mt-1">Run some tests to see trends over time!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center mb-4 lg:mb-0">
          <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Performance Trends ({chartData.length} data points)
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Strategy Filter */}
          <select
            value={strategyFilter}
            onChange={(e) => setStrategyFilter(e.target.value as 'all' | 'desktop' | 'mobile')}
            className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          >
            <option value="all">All Devices</option>
            <option value="desktop">Desktop Only</option>
            <option value="mobile">Mobile Only</option>
          </select>
          
          <button
            onClick={fetchResults}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Selection */}
      <div className="mb-6">
        <p className="text-gray-300 text-sm mb-3">Select metrics to display:</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(METRIC_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleMetric(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedMetrics.includes(key)
                  ? 'border-gray-500 text-white'
                  : 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500'
              }`}
              style={{
                backgroundColor: selectedMetrics.includes(key) 
                  ? `${METRIC_COLORS[key as keyof typeof METRIC_COLORS]}20`
                  : 'transparent',
                borderColor: selectedMetrics.includes(key)
                  ? METRIC_COLORS[key as keyof typeof METRIC_COLORS]
                  : undefined
              }}
            >
              <span 
                className="inline-block w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: METRIC_COLORS[key as keyof typeof METRIC_COLORS] }}
              ></span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis stroke="#9CA3AF" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {selectedMetrics.map((metric) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={METRIC_COLORS[metric as keyof typeof METRIC_COLORS]}
                strokeWidth={2}
                dot={{ fill: METRIC_COLORS[metric as keyof typeof METRIC_COLORS], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: METRIC_COLORS[metric as keyof typeof METRIC_COLORS], strokeWidth: 2 }}
                name={METRIC_LABELS[metric as keyof typeof METRIC_LABELS]}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {chartData.length > 0 && (
        <div className="mt-4 text-xs text-gray-400">
          <p>💡 <strong>Lower values are better</strong> for all metrics. Look for downward trends to see improvements!</p>
        </div>
      )}
    </div>
  );
}
