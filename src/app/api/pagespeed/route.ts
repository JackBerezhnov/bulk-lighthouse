import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url: targetUrl } = await request.json();
    
    if (!targetUrl) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const apiEndpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    const apiKey = process.env.PAGESPEED_API_KEY;
    
    const url = new URL(apiEndpoint);
    url.searchParams.set('url', targetUrl);
    
    // Add API key if available
    if (apiKey) {
      url.searchParams.set('key', apiKey);
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract the relevant metrics
    const result = {
      id: data.id,
      cruxMetrics: {
        'First Contentful Paint': data.loadingExperience?.metrics?.FIRST_CONTENTFUL_PAINT_MS?.category || 'N/A',
        'Interaction to Next Paint': data.loadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT?.category || 'N/A',
      },
      lighthouseMetrics: {
        'First Contentful Paint': data.lighthouseResult?.audits?.['first-contentful-paint']?.displayValue || 'N/A',
        'Speed Index': data.lighthouseResult?.audits?.['speed-index']?.displayValue || 'N/A',
        'Largest Contentful Paint': data.lighthouseResult?.audits?.['largest-contentful-paint']?.displayValue || 'N/A',
        'Total Blocking Time': data.lighthouseResult?.audits?.['total-blocking-time']?.displayValue || 'N/A',
        'Time To Interactive': data.lighthouseResult?.audits?.['interactive']?.displayValue || 'N/A',
      }
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('PageSpeed Insights API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PageSpeed data' },
      { status: 500 }
    );
  }
}
