"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { login as authLogin, logout as authLogout, isAuthenticated, clearAuthState } from "@/services/auth-service";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credential: string) => Promise<boolean>;
  logout: () => Promise<void>;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  useEffect(() => {
    const authState = isAuthenticated();
    setAuthenticated(authState);
    setIsLoading(false);
    if (!authState) {
      setShowLoginModal(true);
    }
  }, []);

  const handleLogin = useCallback(async (credential: string): Promise<boolean> => {
    const result = await authLogin(credential);
    if (result.success) {
      setAuthenticated(true);
      setShowLoginModal(false);
      return true;
    }
    return false;
  }, []);

  const handleLogout = useCallback(async (): Promise<void> => {
    await authLogout();
    setAuthenticated(false);
    setShowLoginModal(true);
  }, []);

  useEffect(() => {
    const handleAuthRequired = () => {
      clearAuthState();
      setAuthenticated(false);
      setShowLoginModal(true);
    };

    window.addEventListener("auth:required", handleAuthRequired);
    return () => {
      window.removeEventListener("auth:required", handleAuthRequired);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: authenticated,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
        showLoginModal,
        setShowLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

