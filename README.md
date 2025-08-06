# Bulk Lighthouse

A powerful web application for running bulk PageSpeed Insights and Lighthouse audits on multiple websites. Built with Next.js, React, and Supabase for efficient performance testing and analysis.

## Features

- **Bulk Website Analysis**: Run PageSpeed Insights tests on multiple URLs
- **Desktop & Mobile Testing**: Support for both desktop and mobile performance strategies
- **Real-time Results**: Live progress tracking with elapsed time display
- **Results History**: Store and view historical test results with Supabase integration
- **Performance Metrics**: Comprehensive Lighthouse and CrUX (Chrome User Experience Report) metrics
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Website Management**: Organize and manage your websites for repeated testing

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **API**: Google PageSpeed Insights API
- **Development**: ESLint, Turbopack


   ```bash
## Usage

### Running a Single Test
1. Enter the website URL you want to test
2. Choose between desktop or mobile testing strategy
3. Click "Run PageSpeed Test"
4. View comprehensive performance metrics including:
   - Core Web Vitals (LCP, FID, CLS)
   - Performance score
   - Accessibility score
   - Best practices score
   - SEO score

### Managing Results
- All test results are automatically saved to your Supabase database
- Access historical results through the Results History component
- Filter and search through past performance audits
- Track performance improvements over time
