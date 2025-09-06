import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Configure axios defaults
  axios.defaults.withCredentials = true;

  useEffect(() => {
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      // Handle OAuth callback
      handleOAuthCallback(code);
    } else {
      checkAuthStatus();
    }
  }, []);

  const handleOAuthCallback = async (code) => {
    try {
      // For now, create a mock user since we don't have backend
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        name: 'Test User',
        picture: 'https://via.placeholder.com/150'
      };
      
      setUser(mockUser);
      setIsAuthenticated(true);
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('OAuth callback error:', error);
    }
  };

  const checkAuthStatus = async () => {
    try {
      // Check localStorage for user data
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setUser(user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log('User not authenticated');
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    // Use Google's client-side OAuth
    const clientId = '161392434222-lj1bvq77fgdubnncrb5nkocv05q7rp9v.apps.googleusercontent.com';
    const redirectUri = 'https://familyexp.netlify.app';
    const scope = 'profile email';
    
    const authUrl = `https://accounts.google.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code`;
    window.location.href = authUrl;
  };

  const logout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
