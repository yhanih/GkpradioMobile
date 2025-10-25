import { apiRequest } from "./queryClient";
import { supabase } from "./supabase";

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  city?: string;
  country?: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Local storage key
const TOKEN_KEY = "gkp_auth_token";
const USER_KEY = "gkp_user";

// Token management - now using Supabase session
export const authToken = {
  get: () => {
    // Get from localStorage (set by our backend after Supabase auth)
    return localStorage.getItem(TOKEN_KEY);
  },
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  remove: () => {
    localStorage.removeItem(TOKEN_KEY);
    // Also sign out from Supabase
    supabase.auth.signOut();
  },
};

// User management
export const authUser = {
  get: (): User | null => {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },
  set: (user: User) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  remove: () => localStorage.removeItem(USER_KEY),
};

// Auth API calls
export const authAPI = {
  async signup(data: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    city?: string;
    country?: string;
    renderAt?: number;
    hp?: string;
  }): Promise<AuthResponse> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Turnstile token functionality removed per user request

    const response = await apiRequest("/api/auth/signup", {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    }) as any;
    
    // Set Supabase session if available
    if (response.session) {
      await supabase.auth.setSession({
        access_token: response.session.access_token,
        refresh_token: response.session.refresh_token
      });
      authToken.set(response.session.access_token);
    } else if (response.token) {
      authToken.set(response.token);
    }
    
    authUser.set(response.user);
    
    return {
      user: response.user,
      token: response.session?.access_token || response.token
    };
  },

  async login(data: {
    username: string;
    password: string;
  }): Promise<AuthResponse> {
    const response = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }) as any;
    
    // Set Supabase session if available
    if (response.session) {
      await supabase.auth.setSession({
        access_token: response.session.access_token,
        refresh_token: response.session.refresh_token
      });
      authToken.set(response.session.access_token);
    } else if (response.token) {
      authToken.set(response.token);
    }
    
    authUser.set(response.user);
    
    return {
      user: response.user,
      token: response.session?.access_token || response.token
    };
  },

  async getCurrentUser(): Promise<User> {
    const token = authToken.get();
    if (!token) {
      throw new Error("No auth token");
    }

    const response = await apiRequest("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }) as User;
    
    // Update stored user
    authUser.set(response);
    
    return response;
  },

  async updateProfile(data: {
    bio?: string;
    city?: string;
    country?: string;
    avatar?: string;
  }): Promise<User> {
    const token = authToken.get();
    if (!token) {
      throw new Error("No auth token");
    }

    const response = await apiRequest("/api/auth/profile", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }) as User;
    
    // Update stored user
    authUser.set(response);
    
    return response;
  },

  async logout() {
    // Sign out from Supabase
    await supabase.auth.signOut();
    // Clear local storage
    authToken.remove();
    authUser.remove();
    // Redirect to home
    window.location.href = "/";
  },
};

// Auth header helper for authenticated requests
export function getAuthHeaders(): HeadersInit {
  const token = authToken.get();
  return token ? { Authorization: `Bearer ${token}` } : {};
}