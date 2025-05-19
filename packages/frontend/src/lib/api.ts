/**
 * API utility functions for making requests to the backend
 */
import type { User } from './auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

/**
 * Makes a fetch request to the backend API
 * @param endpoint - The API endpoint to call (without leading slash)
 * @param options - Fetch options
 * @returns Promise with the response data
 */
export async function fetchFromApi<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BACKEND_URL}/${endpoint.startsWith('/') ? endpoint.substring(1) : endpoint}`;
  
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  
  return data;
}

/**
 * Gets the current user session
 * @returns Promise with the session data including user information
 */
export async function getSession(): Promise<{ user?: User } | null> {
  try {
    return await fetchFromApi('auth/session');
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
    return await fetchFromApi('auth/organization');
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
    await fetchFromApi('auth/sign-out', {
      method: 'POST',
    });
    return true;
  } catch (error) {
    console.error('Failed to sign out:', error);
    return false;
  }
}
