'use client';

import { useState, useEffect } from 'react';
import { LighthouseResult } from '@/lib/supabase';

interface ResultsHistoryProps {
  refreshTrigger?: number;
  selectedWebsite?: string | null;
}

type SortField = 'created_at' | 'first_content_paint' | 'speed_index' | 'largest_content_paint' | 'total_blocking_time' | 'time_to_interactive';
type SortDirection = 'asc' | 'desc';

export default function ResultsHistory({ refreshTrigger, selectedWebsite }: ResultsHistoryProps) {
  const [results, setResults] = useState<LighthouseResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
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
      
      const sortedResults = sortResults(filteredResults, sortField, sortDirection);
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
  const exportToCSV = () => {
    if (results.length === 0) {
      alert('No results to export');
      return;
    }

    // Define CSV headers
    const headers = [
      'ID',
      'Created At',
      'URL',
      'Device Strategy',
      'First Content Paint (s)',
      'Speed Index (s)',
      'Largest Content Paint (s)',
      'Total Blocking Time (ms)',
      'Time to Interactive (s)'
    ];

    // Convert results to CSV rows
    const csvRows = results.map(result => [
      result.id || '',
      result.created_at ? new Date(result.created_at).toISOString() : '',
      result.url || '',
      result.device_strategy || '',
      result.first_content_paint?.toFixed(3) || '',
      result.speed_index?.toFixed(3) || '',
      result.largest_content_paint?.toFixed(3) || '',
      result.total_blocking_time?.toFixed(0) || '',
      result.time_to_interactive?.toFixed(3) || ''
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Generate filename with current date and filters
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const websiteFilter = selectedWebsite ? `_${selectedWebsite.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    const strategyFilter_str = strategyFilter !== 'all' ? `_${strategyFilter}` : '';
    const filename = `lighthouse_results_${dateStr}${websiteFilter}${strategyFilter_str}.csv`;
    
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
  }, [refreshTrigger, sortField, sortDirection, selectedWebsite, strategyFilter]);

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
          <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {selectedWebsite ? `Results for ${selectedWebsite.replace(/^www\./, '')}` : 'Recent Results'} ({results.length})
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={strategyFilter}
            onChange={(e) => setStrategyFilter(e.target.value as 'all' | 'desktop' | 'mobile')}
            className="px-2 py-1 bg-gray-700 text-white rounded text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Devices</option>
            <option value="desktop">🖥️ Desktop</option>
            <option value="mobile">📱 Mobile</option>
          </select>
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
          <button
            onClick={exportToCSV}
            disabled={loading || results.length === 0}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={results.length === 0 ? 'No results to export' : 'Export results as CSV'}
          >
            📊 Export CSV
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
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-gray-400 text-xs">
                    {result.created_at ? new Date(result.created_at).toLocaleString() : 'Unknown time'}
                  </p>
                  {result.device_strategy && (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      result.device_strategy === 'desktop' 
                        ? 'bg-blue-900/50 text-blue-300 border border-blue-700' 
                        : 'bg-purple-900/50 text-purple-300 border border-purple-700'
                    }`}>
                      {result.device_strategy === 'desktop' ? '🖥️ Desktop' : '📱 Mobile'}
                    </span>
                  )}
                </div>
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
