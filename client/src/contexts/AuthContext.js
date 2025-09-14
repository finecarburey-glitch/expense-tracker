import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Simple state management without authentication
  const [user] = useState({
    id: '1',
    name: 'Family User',
    email: 'family@example.com'
  });
  const [isAuthenticated] = useState(true);
  const [loading] = useState(false);

  const value = {
    user,
    isAuthenticated,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
