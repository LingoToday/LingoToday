import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

// Default query function for the API
export const defaultQueryFn = async ({ queryKey }: { queryKey: any[] }): Promise<any> => {
  const [url] = queryKey;
  
  if (typeof url !== 'string') {
    throw new Error('Invalid query key');
  }
  
  const API_BASE_URL = __DEV__ ? 'http://localhost:5000' : 'https://your-production-url.com';
  const response = await fetch(`${API_BASE_URL}${url}`);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

queryClient.setQueryDefaults([''], { queryFn: defaultQueryFn });