import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await fetch("/api/auth/user");
      if (response.status === 401) {
        return null; // Not authenticated
      }
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
  };
}
