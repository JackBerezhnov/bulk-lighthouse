'use client';

import { useState, useEffect } from 'react';
import { LighthouseResult } from '@/lib/supabase';

interface ResultsHistoryProps {
  refreshTrigger?: number;
}

type SortField = 'created_at' | 'first_content_paint' | 'speed_index' | 'largest_content_paint' | 'total_blocking_time' | 'time_to_interactive';
type SortDirection = 'asc' | 'desc';

export default function ResultsHistory({ refreshTrigger }: ResultsHistoryProps) {
  const [results, setResults] = useState<LighthouseResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchResults = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/results?limit=20');
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      
      const data = await response.json();
      const sortedResults = sortResults(data.results, sortField, sortDirection);
      setResults(sortedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const sortResults = (data: LighthouseResult[], field: SortField, direction: SortDirection) => {
    return [...data].sort((a, b) => {
      let aValue: number | string | Date;
      let bValue: number | string | Date;

      if (field === 'created_at') {
        aValue = new Date(a[field] || 0);
        bValue = new Date(b[field] || 0);
      } else {
        aValue = a[field] || 0;
        bValue = b[field] || 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Color coding based on Core Web Vitals thresholds
  const getMetricColor = (metric: string, value: number): string => {
    switch (metric) {
      case 'first_content_paint':
        if (value <= 1.8) return 'text-green-400 bg-green-900/30 border-green-700';
        if (value <= 3.0) return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
        return 'text-red-400 bg-red-900/30 border-red-700';
      
      case 'largest_content_paint':
        if (value <= 2.5) return 'text-green-400 bg-green-900/30 border-green-700';
        if (value <= 4.0) return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
        return 'text-red-400 bg-red-900/30 border-red-700';
      
      case 'speed_index':
        if (value <= 3.4) return 'text-green-400 bg-green-900/30 border-green-700';
        if (value <= 5.8) return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
        return 'text-red-400 bg-red-900/30 border-red-700';
      
      case 'time_to_interactive':
        if (value <= 3.8) return 'text-green-400 bg-green-900/30 border-green-700';
        if (value <= 7.3) return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
        return 'text-red-400 bg-red-900/30 border-red-700';
      
      case 'total_blocking_time':
        if (value <= 200) return 'text-green-400 bg-green-900/30 border-green-700';
        if (value <= 600) return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
        return 'text-red-400 bg-red-900/30 border-red-700';
      
      default:
        return 'text-gray-400 bg-gray-800/50 border-gray-600';
    }
  };

  useEffect(() => {
    fetchResults();
  }, [refreshTrigger, sortField, sortDirection]);

  if (loading && results.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-2 text-gray-300">Loading results...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 backdrop-blur-sm">
        <p className="text-red-200">Error loading results: {error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 backdrop-blur-sm text-center">
        <p className="text-gray-400">No results found. Run your first PageSpeed test to see results here!</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Recent Results ({results.length})
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={`${sortField}-${sortDirection}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-') as [SortField, SortDirection];
              setSortField(field);
              setSortDirection(direction);
            }}
            className="px-2 py-1 bg-gray-700 text-white rounded text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="first_content_paint-asc">Best FCP</option>
            <option value="first_content_paint-desc">Worst FCP</option>
            <option value="speed_index-asc">Best Speed Index</option>
            <option value="speed_index-desc">Worst Speed Index</option>
            <option value="largest_content_paint-asc">Best LCP</option>
            <option value="largest_content_paint-desc">Worst LCP</option>
            <option value="total_blocking_time-asc">Best TBT</option>
            <option value="total_blocking_time-desc">Worst TBT</option>
            <option value="time_to_interactive-asc">Best TTI</option>
            <option value="time_to_interactive-desc">Worst TTI</option>
          </select>
          <button
            onClick={fetchResults}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {results.map((result, index) => (
          <div key={result.id || index} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                {result.url && (
                  <p className="text-blue-400 text-sm font-medium truncate">{result.url}</p>
                )}
                <p className="text-gray-400 text-xs">
                  {result.created_at ? new Date(result.created_at).toLocaleString() : 'Unknown time'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <div className={`rounded p-2 border ${getMetricColor('first_content_paint', result.first_content_paint || 0)}`}>
                <div className="text-gray-300">FCP</div>
                <div className="font-semibold">{result.first_content_paint?.toFixed(1)}s</div>
              </div>
              <div className={`rounded p-2 border ${getMetricColor('speed_index', result.speed_index || 0)}`}>
                <div className="text-gray-300">SI</div>
                <div className="font-semibold">{result.speed_index?.toFixed(1)}s</div>
              </div>
              <div className={`rounded p-2 border ${getMetricColor('largest_content_paint', result.largest_content_paint || 0)}`}>
                <div className="text-gray-300">LCP</div>
                <div className="font-semibold">{result.largest_content_paint?.toFixed(1)}s</div>
              </div>
              <div className={`rounded p-2 border ${getMetricColor('total_blocking_time', result.total_blocking_time || 0)}`}>
                <div className="text-gray-300">TBT</div>
                <div className="font-semibold">{result.total_blocking_time?.toFixed(0)}ms</div>
              </div>
              <div className={`rounded p-2 border ${getMetricColor('time_to_interactive', result.time_to_interactive || 0)}`}>
                <div className="text-gray-300">TTI</div>
                <div className="font-semibold">{result.time_to_interactive?.toFixed(1)}s</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
