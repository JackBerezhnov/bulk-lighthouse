'use client';

import { useState } from 'react';
import ResultsHistory from './ResultsHistory';

interface CruxMetrics {
  [key: string]: string;
}

interface LighthouseMetrics {
  [key: string]: string;
}

interface PageSpeedData {
  id: string;
  cruxMetrics: CruxMetrics;
  lighthouseMetrics: LighthouseMetrics;
  databaseId?: number;
}

interface PageSpeedInsightsProps {
  onNewResult?: () => void;
  selectedWebsite?: string | null;
}

export default function PageSpeedInsights({ onNewResult, selectedWebsite }: PageSpeedInsightsProps) {
  const [url, setUrl] = useState('https://web.dev/');
  const [data, setData] = useState<PageSpeedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    setSuccessMessage(null);
    const start = Date.now();
    setStartTime(start);
    setElapsedTime(0);
    
    // Start timer for elapsed time display
    const timer = setInterval(() => {
      setElapsedTime(Date.now() - start);
    }, 100);

    try {
      const response = await fetch('/api/pagespeed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data');
      }

      const result = await response.json();
      setData(result);
      
      // Show success message if data was saved to database
      if (result.databaseId) {
        setSuccessMessage(`✅ Results saved to database (ID: ${result.databaseId})`);
        // Trigger refresh of results history
        onNewResult?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setStartTime(null);
      if (timer) clearInterval(timer);
    }
  };

  return (
    <div className="w-full">

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL to test"
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg flex items-center gap-2 min-w-[120px] justify-center"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Analyze</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Loading Progress */}
      {loading && (
        <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 text-blue-200 rounded-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">Running Lighthouse analysis...</span>
            </div>
            <div className="text-sm font-mono bg-blue-800/50 px-2 py-1 rounded">
              {(elapsedTime / 1000).toFixed(1)}s
            </div>
          </div>
          <div className="w-full bg-blue-800/30 rounded-full h-1.5">
            <div className="bg-gradient-to-r from-blue-400 to-purple-400 h-1.5 rounded-full animate-pulse" style={{width: '100%'}}></div>
          </div>
          <div className="text-xs text-blue-300 mt-2 flex items-center gap-2">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            This usually takes 10-30 seconds depending on the website complexity
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg backdrop-blur-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Error: {error}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-900/50 border border-green-700 text-green-200 rounded-lg backdrop-blur-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMessage}
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 backdrop-blur-sm">
            <p className="text-lg text-gray-200">
              <strong className="text-white">Page tested:</strong> <span className="text-blue-400">{data.id}</span>
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-semibold mb-4 text-white flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Chrome User Experience Report Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(data.cruxMetrics).map(([key, value]) => (
                <div key={key} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                  <span className="font-medium text-gray-300">{key}:</span>{' '}
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    value === 'FAST' ? 'bg-green-900/50 text-green-300 border border-green-700' :
                    value === 'AVERAGE' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700' :
                    value === 'SLOW' ? 'bg-red-900/50 text-red-300 border border-red-700' :
                    'bg-gray-700/50 text-gray-300 border border-gray-600'
                  }`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-semibold mb-4 text-white flex items-center">
              <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Lighthouse Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(data.lighthouseMetrics).map(([key, value]) => (
                <div key={key} className="p-4 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                  <div className="font-medium text-sm text-gray-400 mb-1">{key}</div>
                  <div className="text-lg font-semibold text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
