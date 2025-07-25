'use client';

import { useState, useEffect } from 'react';
import { LighthouseResult } from '@/lib/supabase';

interface ResultsHistoryProps {
  refreshTrigger?: number;
}

export default function ResultsHistory({ refreshTrigger }: ResultsHistoryProps) {
  const [results, setResults] = useState<LighthouseResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/results?limit=20');
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      
      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [refreshTrigger]);

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
        <button
          onClick={fetchResults}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
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
              <div className="bg-gray-800/50 rounded p-2">
                <div className="text-gray-400">FCP</div>
                <div className="text-white font-semibold">{result.first_content_paint?.toFixed(1)}s</div>
              </div>
              <div className="bg-gray-800/50 rounded p-2">
                <div className="text-gray-400">SI</div>
                <div className="text-white font-semibold">{result.speed_index?.toFixed(1)}s</div>
              </div>
              <div className="bg-gray-800/50 rounded p-2">
                <div className="text-gray-400">LCP</div>
                <div className="text-white font-semibold">{result.largest_content_paint?.toFixed(1)}s</div>
              </div>
              <div className="bg-gray-800/50 rounded p-2">
                <div className="text-gray-400">TBT</div>
                <div className="text-white font-semibold">{result.total_blocking_time?.toFixed(0)}ms</div>
              </div>
              <div className="bg-gray-800/50 rounded p-2">
                <div className="text-gray-400">TTI</div>
                <div className="text-white font-semibold">{result.time_to_interactive?.toFixed(1)}s</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
