// Custom hook for API queries with React Query
import { useQuery as useReactQuery, QueryKey } from '@tanstack/react-query';
import { apiService } from '../services/api';

export function useQuery<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchOnMount?: boolean;
  }
) {
  return useReactQuery({
    queryKey,
    queryFn,
    ...options,
  });
}

// Pre-configured hooks for common API calls
export function useDashboardData() {
  return useQuery(
    ['dashboard'],
    () => apiService.getDashboardData(),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

export function useCurrentUser() {
  return useQuery(
    ['user'],
    () => apiService.getCurrentUser(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}