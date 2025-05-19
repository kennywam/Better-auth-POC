/**
 * API utility functions for making requests to the backend
 */
import type { User } from './auth';

/**
 * Makes a fetch request to the backend API
 * @param endpoint - The API endpoint to call (without leading slash)
 * @param options - Fetch options
 * @returns Promise with the response data
 */
export async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
  const url = `${backendUrl}/${endpoint.startsWith('/') ? endpoint.substring(1) : endpoint}`;
  
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    mode: 'cors',
  };

  try {
    console.log(`Making API request to: ${url}`);
    
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    });

    // Handle non-JSON responses
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json().catch(e => {
        console.error('Error parsing JSON:', e);
        return { error: 'Invalid JSON response' };
      });
    } else {
      const text = await response.text();
      console.warn('Non-JSON response:', text);
      data = { message: text };
    }
    
    if (!response.ok) {
      console.error('API error:', { status: response.status, data });
      throw new Error(data.message || `API request failed with status ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * Gets the current user session
 * @returns Promise with the session data including user information
 */
export async function getSession(): Promise<{ user?: User } | null> {
  try {
    return await fetchFromApi('api/auth/session');
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

/**
 * Gets the user's organization data
 * @returns Promise with the organization data
 */
export async function getUserOrganization() {
  try {
    return await fetchFromApi('api/auth/organization');
  } catch (error) {
    console.error('Failed to get organization:', error);
    return null;
  }
}

/**
 * Signs the user out
 * @returns Promise indicating success or failure
 */
export async function signOut(): Promise<boolean> {
  try {
    await fetchFromApi('api/auth/sign-out', {
      method: 'POST',
    });
    return true;
  } catch (error) {
    console.error('Failed to sign out:', error);
    return false;
  }
}
