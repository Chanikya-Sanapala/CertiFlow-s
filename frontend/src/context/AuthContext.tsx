import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

export type Role = "TRAINING_CENTRE" | "DISTRICT_OFFICER" | "QUALITY_TEAM" | "STATE_OFFICE";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  district?: string | null;
  department?: string | null;
  avatarUrl?: string | null;
  trainingCentre?: {
    id: string;
    code: string;
    name: string;
    district: string;
  } | null;
}

export interface DemoAccount {
  email: string;
  role: Role;
  displayName: string;
  department: string;
  district: string | null;
  description: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  demoAccounts: DemoAccount[];
  login: (email: string, password: string) => Promise<void>;
  loginGoogle: (credential: string) => Promise<void>;
  loginDemoAccount: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("certiflow_token"));
  const [isLoading, setIsLoading] = useState(true);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);

  // Validate stored session on startup
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("certiflow_token");
      if (!storedToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/me");
        if (res.data?.success && res.data.user) {
          setUser(res.data.user);
          setToken(storedToken);
        } else {
          localStorage.removeItem("certiflow_token");
          setToken(null);
          setUser(null);
        }
      } catch (err: any) {
        localStorage.removeItem("certiflow_token");
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch available demo accounts for login screen
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await api.get("/auth/demo-accounts");
        if (res.data?.success && res.data.accounts) {
          setDemoAccounts(res.data.accounts);
        }
      } catch (err) {
        console.warn("Could not fetch demo accounts list:", err);
      }
    };
    fetchAccounts();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post("/auth/login", { email: email.trim(), password });
      if (res.data?.success) {
        localStorage.setItem("certiflow_token", res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
      } else {
        throw new Error(res.data?.message || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginGoogle = async (credential: string) => {
    setIsLoading(true);
    try {
      const res = await api.post("/auth/google", { credential });
      if (res.data?.success) {
        localStorage.setItem("certiflow_token", res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
      } else {
        throw new Error(res.data?.message || "Google authentication failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemoAccount = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await api.post("/auth/demo-login", { email });
      if (res.data?.success) {
        localStorage.setItem("certiflow_token", res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
      } else {
        throw new Error(res.data?.message || "Demo login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("certiflow_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        demoAccounts,
        login,
        loginGoogle,
        loginDemoAccount,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
