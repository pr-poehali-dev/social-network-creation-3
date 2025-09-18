import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_verified: boolean;
}

interface AuthContextType {
  user: User | null;
  sessionToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { username: string; email: string; password: string; fullName: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = 'https://functions.poehali.dev/9532089c-eb97-4821-ac85-4a91265d8e26';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(
    localStorage.getItem('sessionToken')
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionToken) {
      checkCurrentUser();
    } else {
      setLoading(false);
    }
  }, [sessionToken]);

  const checkCurrentUser = async () => {
    if (!sessionToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}?action=me`, {
        headers: {
          'X-Auth-Token': sessionToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('sessionToken');
        setSessionToken(null);
      }
    } catch (error) {
      console.error('Ошибка проверки пользователя:', error);
      localStorage.removeItem('sessionToken');
      setSessionToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}?action=login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка входа');
    }

    setUser(data.user);
    setSessionToken(data.session_token);
    localStorage.setItem('sessionToken', data.session_token);
  };

  const register = async (registerData: { username: string; email: string; password: string; fullName: string }) => {
    const response = await fetch(`${API_BASE_URL}?action=register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка регистрации');
    }

    setUser(data.user);
    setSessionToken(data.session_token);
    localStorage.setItem('sessionToken', data.session_token);
  };

  const logout = async () => {
    if (sessionToken) {
      try {
        await fetch(`${API_BASE_URL}?action=logout`, {
          method: 'POST',
          headers: {
            'X-Auth-Token': sessionToken,
          },
        });
      } catch (error) {
        console.error('Ошибка выхода:', error);
      }
    }

    setUser(null);
    setSessionToken(null);
    localStorage.removeItem('sessionToken');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionToken,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};