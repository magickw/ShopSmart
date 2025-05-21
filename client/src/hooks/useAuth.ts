import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  
  // Get current user
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });
  
  // Login mutation
  const login = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }
      
      const data = await response.json();
      
      // Store token in localStorage
      localStorage.setItem("authToken", data.token);
      
      return data;
    },
    onSuccess: () => {
      // Refetch user data after login
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
  
  // Register mutation
  const register = useMutation({
    mutationFn: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }
      
      const data = await response.json();
      
      // Store token in localStorage
      localStorage.setItem("authToken", data.token);
      
      return data;
    },
    onSuccess: () => {
      // Refetch user data after registration
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
  
  // Logout mutation
  const logout = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Logout failed");
      }
      
      // Remove token from localStorage
      localStorage.removeItem("authToken");
      
      return await response.json();
    },
    onSuccess: () => {
      // Clear user data after logout
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
  
  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };
}