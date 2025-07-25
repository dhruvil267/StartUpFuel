// API Configuration for different environments
const config = {
  development: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  },
  production: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://d3h3t395jtlnig.cloudfront.net/api',
  }
};

// Determine current environment safely
const getEnvironment = () => {
  // Check if we're in development mode (available during build)
  if (import.meta.env.DEV) {
    return 'development';
  }
  
  // Check if window is available (client-side only)
  if (typeof window !== 'undefined') {
    // Check if we're running on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'development';
    }
  }
  
  // Default to production
  return 'production';
};

const currentEnv = getEnvironment();
export const API_CONFIG = config[currentEnv];

// Export the base URL for easy access
export const API_BASE_URL = API_CONFIG.baseURL;

// Export environment info for debugging (safe for build time)
export const ENV_INFO = {
  environment: currentEnv,
  isDevelopment: currentEnv === 'development',
  isProduction: currentEnv === 'production',
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'build-time',
  baseURL: API_CONFIG.baseURL
};