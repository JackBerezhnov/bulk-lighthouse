'use client';

import { useState } from 'react';
import Sidenav from './Sidenav';
import PageSpeedInsights from './PageSpeedInsights';
import ResultsHistory from './ResultsHistory';

export default function Layout() {
  const [selectedWebsite, setSelectedWebsite] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleWebsiteSelect = (website: string | null) => {
    setSelectedWebsite(website);
  };

  const handleNewResult = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidenav */}
      <Sidenav 
        onWebsiteSelect={handleWebsiteSelect}
        selectedWebsite={selectedWebsite}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-700 p-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white">
              {selectedWebsite ? (
                <span className="flex items-center gap-3">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                  {selectedWebsite.replace(/^www\./, '')}
                </span>
              ) : (
                'Lighthouse DB'
              )}
            </h1>
            {selectedWebsite && (
              <p className="text-gray-400 mt-1">
                Performance analysis for {selectedWebsite}
              </p>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            {/* Page Speed Insights Form */}
            <PageSpeedInsights 
              onNewResult={handleNewResult}
              selectedWebsite={selectedWebsite}
            />

            {/* Results History */}
            <div className="mt-8">
              <ResultsHistory 
                refreshTrigger={refreshTrigger}
                selectedWebsite={selectedWebsite}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
