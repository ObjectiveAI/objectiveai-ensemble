"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
};

export type AuthError = {
  message: string;
  code?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  authError: AuthError | null;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInWithX: () => Promise<void>;
  signInWithReddit: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);

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

  const clearError = () => setAuthError(null);

  const handleAuthError = (error: unknown, fallbackMessage: string) => {
    const message = error instanceof Error ? error.message : fallbackMessage;
    setAuthError({ message });
    setIsAuthenticating(false);
  };

  const signInWithGoogle = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      // TODO: Replace with actual Google OAuth flow
      // Example: window.location.href = '/api/auth/google';
      console.log("Google sign-in triggered - connect to backend");
    } catch (error) {
      handleAuthError(error, "Google sign-in failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signInWithGitHub = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      // TODO: Replace with actual GitHub OAuth flow
      console.log("GitHub sign-in triggered - connect to backend");
    } catch (error) {
      handleAuthError(error, "GitHub sign-in failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signInWithX = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      // TODO: Replace with actual X OAuth flow
      console.log("X sign-in triggered - connect to backend");
    } catch (error) {
      handleAuthError(error, "X sign-in failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signInWithReddit = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      // TODO: Replace with actual Reddit OAuth flow
      console.log("Reddit sign-in triggered - connect to backend");
    } catch (error) {
      handleAuthError(error, "Reddit sign-in failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      // TODO: Replace with actual email sign-in
      // const response = await fetch('/api/auth/signin', {
      //   method: 'POST',
      //   body: JSON.stringify({ email, password }),
      // });
      // if (!response.ok) throw new Error('Invalid credentials');
      // const data = await response.json();
      // setUser(data.user);
      console.log("Email sign-in triggered - connect to backend");
    } catch (error) {
      handleAuthError(error, "Sign in failed. Please check your credentials.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      // TODO: Replace with actual email sign-up
      // const response = await fetch('/api/auth/signup', {
      //   method: 'POST',
      //   body: JSON.stringify({ email, password, name }),
      // });
      // if (!response.ok) throw new Error('Sign up failed');
      // const data = await response.json();
      // setUser(data.user);
      console.log("Email sign-up triggered - connect to backend", { email, name });
    } catch (error) {
      handleAuthError(error, "Sign up failed. Please try again.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signOut = async () => {
    try {
      // TODO: Replace with actual sign-out API call
      // await fetch('/api/auth/signout', { method: 'POST' });
      setUser(null);
      setAuthError(null);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticating,
        authError,
        signInWithGoogle,
        signInWithGitHub,
        signInWithX,
        signInWithReddit,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        clearError,
      }}
    >
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
