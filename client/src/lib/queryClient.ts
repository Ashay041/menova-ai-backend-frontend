import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

type FetcherOptions = {
  on401?: 'returnNull' | 'throw';
};

export const getQueryFn =
  (options: FetcherOptions = {}) =>
  async ({ queryKey }: { queryKey: string[] }) => {
    const [endpoint] = queryKey;
    
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.status === 401) {
        if (options.on401 === 'returnNull') {
          return null;
        } else {
          throw new Error('Unauthorized');
        }
      }
      
      if (response.status === 503) {
        // Handle database connection errors
        const errorData = await response.json();
        if (errorData.error === 'Database Unavailable') {
          throw new Error(errorData.message || 'Database is currently unavailable');
        }
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'An error occurred while fetching data');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  };

export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: any,
) {
  try {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    
    if (response.status === 503) {
      // Handle database connection errors
      const errorData = await response.json();
      if (errorData.error === 'Database Unavailable') {
        throw new Error(errorData.message || 'Database is currently unavailable');
      }
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error(`Error in API request to ${endpoint}:`, error);
    throw error;
  }
}