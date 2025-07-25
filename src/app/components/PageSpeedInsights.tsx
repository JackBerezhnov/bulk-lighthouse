'use client';

import { useState } from 'react';

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
}

export default function PageSpeedInsights() {
  const [url, setUrl] = useState('https://web.dev/');
  const [data, setData] = useState<PageSpeedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        PageSpeed Insights API Demo
      </h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL to test"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          Error: {error}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-lg">
              <strong>Page tested:</strong> {data.id}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">
              Chrome User Experience Report Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(data.cruxMetrics).map(([key, value]) => (
                <div key={key} className="p-3 bg-gray-50 rounded">
                  <span className="font-medium">{key}:</span>{' '}
                  <span className={`px-2 py-1 rounded text-sm ${
                    value === 'FAST' ? 'bg-green-100 text-green-800' :
                    value === 'AVERAGE' ? 'bg-yellow-100 text-yellow-800' :
                    value === 'SLOW' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Lighthouse Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(data.lighthouseMetrics).map(([key, value]) => (
                <div key={key} className="p-3 bg-gray-50 rounded">
                  <div className="font-medium text-sm text-gray-600">{key}</div>
                  <div className="text-lg font-semibold">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
