import { useState, useEffect } from 'react';
import { authService, type User } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      // First try to get user from authService
      const storedUser = authService.getUser();
      console.log('Stored user from authService:', storedUser);
      
      if (storedUser && authService.isAuthenticated()) {
        setUser(storedUser);
        
        // Validate with server in background
        try {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          }
        } catch (error) {
          console.error('Auth validation failed:', error);
          authService.logout();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      setUser(result.user);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: 'tenant' | 'landlord') => {
    setIsLoading(true);
    try {
      const result = await authService.register(name, email, password, role);
      setUser(result.user);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isLandlord: user?.role === 'landlord',
    isTenant: user?.role === 'tenant',
    login,
    register,
    logout,
  };
}
