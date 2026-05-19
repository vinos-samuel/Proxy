import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "./queryClient";
import type { Customer } from "@shared/schema";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

type AuthUser = Omit<Customer, "passwordHash"> | null;

interface AuthContextType {
  user: AuthUser;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; username: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.status === 401) return null;
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    staleTime: Infinity,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      await apiRequest("POST", "/api/auth/login", { email, password });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; name: string; username: string }) => {
      await apiRequest("POST", "/api/auth/register", data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        login: async (email, password) => {
          await loginMutation.mutateAsync({ email, password });
          await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
        },
        register: async (data) => {
          const referredBy = localStorage.getItem("proxy_ref") || undefined;
          await registerMutation.mutateAsync({ ...data, referredBy });
          localStorage.removeItem("proxy_ref");
          await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
          if (typeof window.gtag === "function") {
            window.gtag("event", "sign_up", { method: "email" });
          }
        },
        logout: async () => {
          await logoutMutation.mutateAsync();
          queryClient.clear();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
