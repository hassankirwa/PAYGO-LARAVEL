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
  fetchPromise = (async () => {
    try {
      // Try to fetch from the current ngrok URL first (fallback)
      const fallbackUrls = [
        'https://b2858d950083.ngrok-free.app/api/config',
        'http://localhost:8000/api/config' // Local fallback
      ];

      for (const configUrl of fallbackUrls) {
        try {
          console.log('🔍 Fetching API config from:', configUrl);
          
          const response = await fetch(configUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
            // Add timeout for faster fallback
            signal: AbortSignal.timeout(5000)
          });

          if (response.ok) {
            const config = await response.json();
            cachedApiBaseUrl = config.api_base_url;
            console.log('✅ API base URL loaded:', cachedApiBaseUrl);
            return cachedApiBaseUrl;
          }
        } catch (error) {
          console.warn(`❌ Failed to fetch config from ${configUrl}:`, error);
          continue;
        }
      }

      // If all attempts fail, use fallback
      const fallbackUrl = 'https://b2858d950083.ngrok-free.app/api';
      console.warn('⚠️ Using fallback API URL:', fallbackUrl);
      cachedApiBaseUrl = fallbackUrl;
      return cachedApiBaseUrl;

    } catch (error) {
      console.error('❌ Failed to fetch API config:', error);
      // Ultimate fallback
      const fallbackUrl = 'https://b2858d950083.ngrok-free.app/api';
      cachedApiBaseUrl = fallbackUrl;
      return cachedApiBaseUrl;
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