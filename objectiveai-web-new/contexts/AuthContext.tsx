"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    // Replace with actual session check when backend is connected
    const checkSession = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/auth/session');
        // const data = await response.json();
        // if (data.user) setUser(data.user);
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const signInWithGoogle = async () => {
    // TODO: Replace with actual Google OAuth flow
    // This is where the developer's Google sign-in gets plugged in
    // Example: window.location.href = '/api/auth/google';
    // Or trigger the OAuth popup/redirect
    console.log("Google sign-in triggered - connect to backend");
  };

  const signOut = async () => {
    try {
      // TODO: Replace with actual sign-out API call
      // await fetch('/api/auth/signout', { method: 'POST' });
      setUser(null);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
