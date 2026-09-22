/**
 * @file src/context/AuthContext.tsx
 * Offline SQLite Authentication State & Lifecycle Provider.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, AuthAuditLog, SqliteTableInfo } from '../types';
import { sqliteAuth } from '../services/sqliteAuthService';

export interface AuthModalState {
  isOpen: boolean;
  mode: 'register' | 'signin';
  reason?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isGuest: boolean;
  sessionToken: string | null;
  isLoading: boolean;
  isReady: boolean;
  initError: string | null;
  retryInit: () => void;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    username: string,
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  enterAsGuest: () => void;
  requireAccount: (actionDescription?: string) => boolean;
  authModalState: AuthModalState;
  openAuthModal: (mode?: 'register' | 'signin', reason?: string) => void;
  closeAuthModal: () => void;
  auditLogs: AuthAuditLog[];
  tableInfo: SqliteTableInfo[];
  refreshData: () => void;
  exportDatabaseFile: () => void;
  resetDatabase: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'axpert_session_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuthAuditLog[]>([]);
  const [tableInfo, setTableInfo] = useState<SqliteTableInfo[]>([]);

  // Guest & Action Guard Modal State
  const [authModalState, setAuthModalState] = useState<AuthModalState>({
    isOpen: false,
    mode: 'register'
  });

  const isGuest = Boolean(user?.isGuest || user?.role === 'guest');

  const openAuthModal = useCallback((mode: 'register' | 'signin' = 'register', reason?: string) => {
    setAuthModalState({
      isOpen: true,
      mode,
      reason
    });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const enterAsGuest = useCallback(() => {
    const guestUser: AuthUser = {
      id: 'usr_guest',
      email: 'guest@preview.local',
      username: 'Guest Explorer',
      fullName: 'Guest (Preview Mode)',
      role: 'guest',
      createdAt: new Date().toISOString(),
      isGuest: true
    };
    setUser(guestUser);
    setSessionToken(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    closeAuthModal();
  }, [closeAuthModal]);

  const requireAccount = useCallback((actionDescription?: string): boolean => {
    // If user is logged in as a real non-guest account, allow action
    if (user && !user.isGuest && user.role !== 'guest') {
      return true;
    }

    // Otherwise block action and open the account creation modal
    openAuthModal(
      'register',
      actionDescription
        ? `To ${actionDescription}, please create an account.`
        : 'Please create an account to use this action.'
    );
    return false;
  }, [user, openAuthModal]);

  const refreshData = useCallback(() => {
    try {
      const logs = sqliteAuth.getAuditLogs(30);
      setAuditLogs(logs);
      const tables = sqliteAuth.getTableInfo();
      setTableInfo(tables);
    } catch (e) {
      console.warn('[AuthContext] Failed refreshing data:', e);
    }
  }, []);

  const [initTrigger, setInitTrigger] = useState(0);
  const retryInit = useCallback(() => {
    setIsLoading(true);
    setInitError(null);
    setInitTrigger((n) => n + 1);
  }, []);

  // Initialize SQLite Database and validate existing session
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        setInitError(null);
        await sqliteAuth.initialize();
        if (!isMounted) return;

        setIsReady(true);
        refreshData();

        // Check if there's an existing stored session
        const storedToken = localStorage.getItem(SESSION_STORAGE_KEY);
        if (storedToken) {
          const check = await sqliteAuth.validateSession(storedToken);
          if (check.valid && check.user) {
            setUser(check.user);
            setSessionToken(storedToken);
          } else {
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      } catch (err) {
        console.error('[AuthContext] Initialization failed:', err);
        if (isMounted) {
          setInitError(err instanceof Error ? err.message : 'Database initialization failed');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [refreshData, initTrigger]);

  const login = async (identifier: string, password: string) => {
    try {
      const result = await sqliteAuth.login(identifier, password);
      if (result.success && result.user && result.sessionToken) {
        setUser(result.user);
        setSessionToken(result.sessionToken);
        localStorage.setItem(SESSION_STORAGE_KEY, result.sessionToken);
        refreshData();
        closeAuthModal();
        return { success: true };
      }
      return { success: false, error: result.error || 'Authentication failed' };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Login failed' };
    }
  };

  const register = async (username: string, email: string, password: string, fullName?: string) => {
    try {
      const regResult = await sqliteAuth.register({ username, email, password, fullName });
      if (!regResult.success) {
        return { success: false, error: regResult.error };
      }

      // Automatically sign in upon registration
      const loginResult = await sqliteAuth.login(email, password);
      if (loginResult.success && loginResult.user && loginResult.sessionToken) {
        setUser(loginResult.user);
        setSessionToken(loginResult.sessionToken);
        localStorage.setItem(SESSION_STORAGE_KEY, loginResult.sessionToken);
        refreshData();
        closeAuthModal();
        return { success: true };
      }
      closeAuthModal();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Registration failed' };
    }
  };

  const logout = async () => {
    if (sessionToken) {
      await sqliteAuth.logout(sessionToken);
    }
    setUser(null);
    setSessionToken(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    closeAuthModal();
    refreshData();
  };

  const exportDatabaseFile = () => {
    try {
      const { blob, fileName } = sqliteAuth.exportDatabaseBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      console.error('[AuthContext] Failed to export database:', e);
    }
  };

  const resetDatabase = async () => {
    await sqliteAuth.resetDatabase();
    setUser(null);
    setSessionToken(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    closeAuthModal();
    refreshData();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        sessionToken,
        isLoading,
        isReady,
        initError,
        retryInit,
        login,
        register,
        logout,
        enterAsGuest,
        requireAccount,
        authModalState,
        openAuthModal,
        closeAuthModal,
        auditLogs,
        tableInfo,
        refreshData,
        exportDatabaseFile,
        resetDatabase
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
