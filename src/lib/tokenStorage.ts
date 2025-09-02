// src/lib/tokenStorage.ts

const TOKEN_KEY = 'auth_token';

export const tokenStorage = {
  // Store token in localStorage
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  // Get token from localStorage
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  // Remove token from localStorage
  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  // Check if token exists
  hasToken: (): boolean => {
    return tokenStorage.getToken() !== null;
  }
};
