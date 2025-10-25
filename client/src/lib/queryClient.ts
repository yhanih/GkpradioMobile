import { QueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Default fetcher for react-query
export const apiRequest = async (url: string, options?: RequestInit) => {
  // Get auth token from Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Handle token expiration - log out user automatically
    if (response.status === 401 || response.status === 403) {
      // Clear Supabase session
      await supabase.auth.signOut();
      
      // Only redirect if we're not already on login/signup pages
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
        // Show a user-friendly message instead of immediate redirect
        console.warn('Session expired. Please log in again.');
        // Optionally, you could show a toast notification here
      }
    }
    
    throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Set default query function
queryClient.setQueryDefaults([], {
  queryFn: ({ queryKey }) => apiRequest(queryKey[0] as string),
});