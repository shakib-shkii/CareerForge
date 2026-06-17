import type { Job } from '../types';

// API Configuration stored in localStorage
export interface JobSearchConfig {
  rapidApiKey: string;
  googleApiKey: string;
  googleSearchEngineId: string;
}

export function getJobSearchConfig(): JobSearchConfig {
  return {
    rapidApiKey: localStorage.getItem('rapidapi_key') || '',
    googleApiKey: localStorage.getItem('google_api_key') || '',
    googleSearchEngineId: localStorage.getItem('google_search_engine_id') || '',
  };
}

export function saveJobSearchConfig(config: Partial<JobSearchConfig>): void {
  if (config.rapidApiKey !== undefined) {
    localStorage.setItem('rapidapi_key', config.rapidApiKey);
  }
  if (config.googleApiKey !== undefined) {
    localStorage.setItem('google_api_key', config.googleApiKey);
  }
  if (config.googleSearchEngineId !== undefined) {
    localStorage.setItem('google_search_engine_id', config.googleSearchEngineId);
  }
}

// RemoteOK API (Free, no API key required)
export async function searchRemoteOKJobs(query?: string): Promise<Job[]> {
  try {
    // RemoteOK provides a public JSON API
    const response = await fetch('https://remoteok.com/api', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from RemoteOK');
    }

    const data = await response.json();
    
    // First item is metadata, skip it
    const jobs = data.slice(1);
    
    // Filter by query if provided
    let filteredJobs = jobs;
    if (query) {
      const q = query.toLowerCase();
      filteredJobs = jobs.filter((job: any) => 
        job.position?.toLowerCase().includes(q) ||
        job.company?.toLowerCase().includes(q) ||
        job.description?.toLowerCase().includes(q) ||
        job.tags?.some((tag: string) => tag.toLowerCase().includes(q))
      );
    }

    // Map to our Job type
    return filteredJobs.slice(0, 50).map((job: any): Job => ({
      id: `remoteok_${job.id}`,
      title: job.position || 'Unknown Position',
      company: job.company || 'Unknown Company',
      location: job.location || 'Remote',
      type: 'Remote',
      salary: job.salary_min && job.salary_max 
        ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
        : job.salary || 'Not specified',
      description: cleanDescription(job.description || ''),
      requirements: extractRequirements(job.description || ''),
      posted: formatDate(job.date),
      source: 'RemoteOK',
      applyUrl: job.apply_url || job.url,
    }));
  } catch (error) {
    console.error('RemoteOK API error:', error);
    throw error;
  }
}

// JSearch API via RapidAPI
export async function searchJSearchJobs(
  query: string,
  location: string = '',
  options: {
    remote?: boolean;
    employmentType?: string;
    datePosted?: string;
  } = {}
): Promise<Job[]> {
  const config = getJobSearchConfig();
  
  if (!config.rapidApiKey) {
    throw new Error('RapidAPI key not configured. Please add it in Connectors.');
  }

  try {
    const params = new URLSearchParams({
      query: query + (location ? ` in ${location}` : ''),
      page: '1',
      num_pages: '1',
    });

    if (options.remote) {
      params.append('remote_jobs_only', 'true');
    }
    if (options.employmentType) {
      params.append('employment_types', options.employmentType);
    }
    if (options.datePosted) {
      params.append('date_posted', options.datePosted);
    }

    const response = await fetch(
      `https://jsearch.p.rapidapi.com/search?${params.toString()}`,
      {
        headers: {
          'X-RapidAPI-Key': config.rapidApiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `JSearch API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.map((job: any): Job => ({
      id: `jsearch_${job.job_id}`,
      title: job.job_title || 'Unknown Position',
      company: job.employer_name || 'Unknown Company',
      location: job.job_city 
        ? `${job.job_city}, ${job.job_state || ''} ${job.job_country || ''}`.trim()
        : job.job_country || 'Not specified',
      type: job.job_employment_type || 'Full-time',
      salary: job.job_min_salary && job.job_max_salary
        ? `$${job.job_min_salary.toLocaleString()} - $${job.job_max_salary.toLocaleString()}`
        : 'Not specified',
      description: job.job_description || '',
      requirements: job.job_required_skills || extractRequirements(job.job_description || ''),
      posted: job.job_posted_at_datetime_utc 
        ? formatDate(job.job_posted_at_datetime_utc)
        : 'Recently',
      source: 'JSearch (Google Jobs)',
      applyUrl: job.job_apply_link,
      employerLogo: job.employer_logo,
    }));
  } catch (error) {
    console.error('JSearch API error:', error);
    throw error;
  }
}

// Google Custom Search API for job listings
export async function searchGoogleJobs(query: string): Promise<Job[]> {
  const config = getJobSearchConfig();
  
  if (!config.googleApiKey || !config.googleSearchEngineId) {
    throw new Error('Google API credentials not configured. Please add them in Connectors.');
  }

  try {
    const params = new URLSearchParams({
      key: config.googleApiKey,
      cx: config.googleSearchEngineId,
      q: `${query} job hiring`,
      num: '10',
    });

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Google API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }

    return data.items.map((item: any, index: number): Job => ({
      id: `google_${Date.now()}_${index}`,
      title: extractJobTitle(item.title) || 'Job Opportunity',
      company: extractCompany(item.title, item.snippet) || 'Company',
      location: 'See listing',
      type: 'Full-time',
      salary: 'Not specified',
      description: item.snippet || '',
      requirements: [],
      posted: 'Recently',
      source: 'Google Search',
      applyUrl: item.link,
    }));
  } catch (error) {
    console.error('Google Search API error:', error);
    throw error;
  }
}

// Unified search function
export async function searchAllJobs(
  query: string,
  sources: ('remoteok' | 'jsearch' | 'google')[],
  options: {
    location?: string;
    remote?: boolean;
    employmentType?: string;
  } = {}
): Promise<{ jobs: Job[]; errors: { source: string; error: string }[] }> {
  const results: Job[] = [];
  const errors: { source: string; error: string }[] = [];

  const searchPromises: Promise<void>[] = [];

  if (sources.includes('remoteok')) {
    searchPromises.push(
      searchRemoteOKJobs(query)
        .then(jobs => { results.push(...jobs); })
        .catch(err => { errors.push({ source: 'RemoteOK', error: err.message }); })
    );
  }

  if (sources.includes('jsearch')) {
    searchPromises.push(
      searchJSearchJobs(query, options.location, {
        remote: options.remote,
        employmentType: options.employmentType,
      })
        .then(jobs => { results.push(...jobs); })
        .catch(err => { errors.push({ source: 'JSearch', error: err.message }); })
    );
  }

  if (sources.includes('google')) {
    searchPromises.push(
      searchGoogleJobs(query)
        .then(jobs => { results.push(...jobs); })
        .catch(err => { errors.push({ source: 'Google', error: err.message }); })
    );
  }

  await Promise.all(searchPromises);

  // Sort by date (most recent first) and deduplicate by title+company
  const seen = new Set<string>();
  const uniqueJobs = results.filter(job => {
    const key = `${job.title.toLowerCase()}_${job.company.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { jobs: uniqueJobs, errors };
}

// Helper functions
function cleanDescription(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000);
}

function extractRequirements(description: string): string[] {
  const requirements: string[] = [];
  const lines = description.split(/[.\n]/);
  
  for (const line of lines) {
    const cleaned = line.trim();
    if (
      cleaned.length > 20 &&
      cleaned.length < 200 &&
      (cleaned.toLowerCase().includes('experience') ||
        cleaned.toLowerCase().includes('required') ||
        cleaned.toLowerCase().includes('must have') ||
        cleaned.toLowerCase().includes('proficient') ||
        cleaned.toLowerCase().includes('knowledge of') ||
        cleaned.toLowerCase().includes('years'))
    ) {
      requirements.push(cleaned);
    }
    if (requirements.length >= 6) break;
  }
  
  return requirements;
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  } catch {
    return 'Recently';
  }
}

function extractJobTitle(title: string): string {
  // Remove common suffixes like "- Company Name" or "| Company"
  return title.split(/[-|]/)[0].trim();
}

function extractCompany(title: string, snippet: string): string {
  // Try to extract company from title
  const parts = title.split(/[-|]/);
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  
  // Try to find company in snippet
  const companyMatch = snippet.match(/at\s+([A-Z][a-zA-Z\s]+?)(?:\s+is|\s+are|\.|,)/);
  if (companyMatch) {
    return companyMatch[1].trim();
  }
  
  return '';
}
