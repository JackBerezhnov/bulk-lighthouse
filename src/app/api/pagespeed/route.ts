import { NextRequest, NextResponse } from 'next/server';
import { supabase, LighthouseResult } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { url: targetUrl, strategy = 'desktop' } = await request.json();
    
    if (!targetUrl) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const apiEndpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    const apiKey = process.env.NEXT_PUBLIC_PAGESPEED_API_KEY;
    
    const url = new URL(apiEndpoint);
    url.searchParams.set('url', targetUrl);
    url.searchParams.set('strategy', strategy.toUpperCase());
    
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
    const result: {
      id: string;
      cruxMetrics: Record<string, string>;
      lighthouseMetrics: Record<string, string>;
      databaseId?: number;
    } = {
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

    // Parse numeric values from Lighthouse metrics for database storage
    const parseMetricValue = (value: string): number => {
      if (!value || value === 'N/A') return 0;
      // Remove units (s, ms) and convert to number
      const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
      return isNaN(numericValue) ? 0 : numericValue;
    };

    // Prepare data for database insertion
    const dbRecord: LighthouseResult = {
      first_content_paint: parseMetricValue(result.lighthouseMetrics['First Contentful Paint']),
      speed_index: parseMetricValue(result.lighthouseMetrics['Speed Index']),
      largest_content_paint: parseMetricValue(result.lighthouseMetrics['Largest Contentful Paint']),
      total_blocking_time: parseMetricValue(result.lighthouseMetrics['Total Blocking Time']),
      time_to_interactive: parseMetricValue(result.lighthouseMetrics['Time To Interactive']),
      url: targetUrl,
      device_strategy: strategy
    };

    // Save to Supabase database
    try {
      const { data: insertData, error: dbError } = await supabase
        .from('lighthouse-score')
        .insert([dbRecord])
        .select();

      if (dbError) {
        console.error('Database error:', dbError);
        // Continue even if DB save fails - don't break the user experience
      } else {
        console.log('Successfully saved to database:', insertData);
        // Add the database ID to the result
        if (insertData && insertData[0]) {
          result.databaseId = insertData[0].id;
        }
      }
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      // Continue even if DB save fails
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('PageSpeed Insights API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PageSpeed data' },
      { status: 500 }
    );
  }
}
