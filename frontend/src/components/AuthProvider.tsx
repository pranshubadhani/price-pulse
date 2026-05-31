"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import {
  ACCESS_TOKEN_KEY,
  AUTH_STATE_EVENT,
  REFRESH_TOKEN_KEY,
  hasAuthTokens,
  logoutUser,
  setAuthTokens,
} from "@/lib/api";

type AuthContextValue = {
  isAuthenticated: boolean;
  isReady: boolean;
  login: (access: string, refresh: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const updateAuthState = () => {
      setIsAuthenticated(hasAuthTokens());
      setIsReady(true);
    };

    updateAuthState();

    const onStorage = (event: StorageEvent) => {
      if (event.key === ACCESS_TOKEN_KEY || event.key === REFRESH_TOKEN_KEY || event.key === null) {
        updateAuthState();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(AUTH_STATE_EVENT, updateAuthState);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AUTH_STATE_EVENT, updateAuthState);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isReady,
      login: (access: string, refresh: string) => {
        setAuthTokens(access, refresh);
      },
      logout: () => {
        logoutUser();
      },
    }),
    [isAuthenticated, isReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
