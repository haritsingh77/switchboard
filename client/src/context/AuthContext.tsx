import { createContext, useContext, useState } from "react";

interface AuthContextValue {
  token: string | null;
  login: (token: string, remember?: boolean) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("token") || sessionStorage.getItem("token"),
  );

  // remember = true  → persist in localStorage (survives browser restart)
  // remember = false → sessionStorage only (cleared when the browser closes)
  const login = (newToken: string, remember = true) => {
    if (remember) {
      localStorage.setItem("token", newToken);
      sessionStorage.removeItem("token");
    } else {
      sessionStorage.setItem("token", newToken);
      localStorage.removeItem("token");
    }
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setToken(null);
  };

  const value: AuthContextValue = {
    token,
    login,
    logout,
    isAuthenticated: token !== null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
