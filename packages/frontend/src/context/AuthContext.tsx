import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchAuthStatus, login as apiLogin } from "../api";
import { clearSessionToken, getSessionToken, setSessionToken } from "../auth";

type AuthContextValue = {
  authRequired: boolean | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authRequired, setAuthRequired] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!getSessionToken(),
  );

  useEffect(() => {
    fetchAuthStatus()
      .then(({ authRequired: required }) => {
        setAuthRequired(required);
        if (!required) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(!!getSessionToken());
        }
      })
      .catch(() => {
        setAuthRequired(false);
        setIsAuthenticated(true);
      });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { token } = await apiLogin(username, password);
    setSessionToken(token);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    clearSessionToken();
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ authRequired, isAuthenticated, login, logout }),
    [authRequired, isAuthenticated, login, logout],
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
