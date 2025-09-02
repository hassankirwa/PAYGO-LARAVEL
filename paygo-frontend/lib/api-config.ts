// API Configuration utility to dynamically fetch base URL
let cachedApiBaseUrl: string | null = null;
let fetchPromise: Promise<string> | null = null;

/**
 * Fetches the API base URL from the backend configuration
 * Uses caching to avoid multiple requests
 */
export async function getApiBaseUrl(): Promise<string> {
  // Return cached URL if available
  if (cachedApiBaseUrl) {
    return cachedApiBaseUrl;
  }

  // Return existing promise if already fetching
  if (fetchPromise) {
    return fetchPromise;
  }

  // Create fetch promise
  fetchPromise = (async (): Promise<string> => {
    try {
      // Only try local backend - no hardcoded fallbacks
      const configUrl = 'http://localhost:8000/api/config';
      
      console.log('🔍 Fetching API config from backend:', configUrl);
      
      const response = await fetch(configUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        // Timeout for faster error reporting
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
      }

      const config = await response.json();
      
      if (!config.api_base_url || typeof config.api_base_url !== 'string') {
        throw new Error('Backend returned invalid config: missing or invalid api_base_url');
      }

      cachedApiBaseUrl = config.api_base_url;
      console.log('✅ API base URL loaded from database:', cachedApiBaseUrl);
      return config.api_base_url;

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? `Failed to load API configuration: ${error.message}` 
        : 'Failed to load API configuration: Unknown error';
      
      console.error('❌', errorMessage);
      console.error('💡 Make sure your Laravel backend is running on http://localhost:8000');
      console.error('💡 Run: cd paygo-backend && php artisan serve');
      
      throw new Error(errorMessage);
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

/**
 * Clear the cached API base URL (useful for testing or when URL changes)
 */
export function clearApiBaseUrlCache(): void {
  cachedApiBaseUrl = null;
  fetchPromise = null;
}

/**
 * Get API base URL with path
 */
export async function getApiUrl(path: string): Promise<string> {
  const baseUrl = await getApiBaseUrl();
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Synchronous method to get cached API base URL
 * Returns null if not yet loaded - use getApiBaseUrl() for async loading
 */
export function getCachedApiBaseUrl(): string | null {
  return cachedApiBaseUrl;
} 