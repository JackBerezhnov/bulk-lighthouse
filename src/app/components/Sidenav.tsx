'use client';

import { useState, useEffect } from 'react';
import { LighthouseResult } from '@/lib/supabase';

interface SidenavProps {
  onWebsiteSelect: (url: string | null) => void;
  selectedWebsite: string | null;
}

interface WebsiteGroup {
  url: string;
  domain: string;
  count: number;
  lastTested: string;
  results: LighthouseResult[];
}

export default function Sidenav({ onWebsiteSelect, selectedWebsite }: SidenavProps) {
  const [websiteGroups, setWebsiteGroups] = useState<WebsiteGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const fetchWebsiteGroups = async () => {
    try {
      const response = await fetch('/api/results?limit=100');
      if (!response.ok) throw new Error('Failed to fetch results');
      
      const data = await response.json();
      const results: LighthouseResult[] = data.results;

      // Group results by domain
      const groupMap = new Map<string, LighthouseResult[]>();
      
      results.forEach(result => {
        if (result.url) {
          try {
            const urlObj = new URL(result.url);
            const domain = urlObj.hostname;
            
            if (!groupMap.has(domain)) {
              groupMap.set(domain, []);
            }
            groupMap.get(domain)!.push(result);
          } catch (e) {
            // Invalid URL, skip
          }
        }
      });

      // Convert to WebsiteGroup array and sort by last tested
      const groups: WebsiteGroup[] = Array.from(groupMap.entries()).map(([domain, results]) => {
        const sortedResults = results.sort((a, b) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        
        return {
          url: sortedResults[0].url || domain,
          domain,
          count: results.length,
          lastTested: sortedResults[0].created_at || '',
          results: sortedResults
        };
      }).sort((a, b) => 
        new Date(b.lastTested).getTime() - new Date(a.lastTested).getTime()
      );

      setWebsiteGroups(groups);
    } catch (error) {
      console.error('Failed to fetch website groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsiteGroups();
  }, []);

  const formatDomain = (domain: string) => {
    return domain.replace(/^www\./, '');
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`bg-gray-900 border-r border-gray-700 h-screen flex flex-col transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-80'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {!collapsed && (
          <h2 className="text-lg font-semibold text-white">Websites</h2>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <svg 
            className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* All Results Option */}
      <div className="p-2">
        <button
          onClick={() => onWebsiteSelect(null)}
          className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
            selectedWebsite === null
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-medium">All Results</div>
              <div className="text-sm opacity-75">View all lighthouse tests</div>
            </div>
          )}
        </button>
      </div>

      {/* Website List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-400">
            <div className="animate-spin w-6 h-6 border-2 border-gray-600 border-t-blue-500 rounded-full mx-auto mb-2"></div>
            {!collapsed && <div>Loading websites...</div>}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {websiteGroups.map((group) => (
              <button
                key={group.domain}
                onClick={() => onWebsiteSelect(group.domain)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                  selectedWebsite === group.domain
                    ? 'bg-gray-800 text-white border border-gray-600'
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                {/* Favicon placeholder */}
                <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                </div>
                
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{formatDomain(group.domain)}</div>
                    <div className="text-sm text-gray-400 flex items-center gap-2">
                      <span>{group.count} test{group.count !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>{getRelativeTime(group.lastTested)}</span>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={fetchWebsiteGroups}
          disabled={loading}
          className={`w-full p-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center gap-2 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {!collapsed && (loading ? 'Refreshing...' : 'Refresh')}
        </button>
      </div>
    </div>
  );
}
