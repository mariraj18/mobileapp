import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authApi, User, RegisterData, LoginData } from '@/utils/api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<{ success: boolean; message?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; profile_image?: string }) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        const currentUser = await authApi.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          const response = await authApi.getMe();
          if (response.success) {
            setUser(response.data);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginData) => {
    try {
      const response = await authApi.login(data);
      if (response.success) {
        setUser(response.data.user);
        await AsyncStorage.multiSet([
          ['accessToken', response.data.accessToken],
          ['refreshToken', response.data.refreshToken],
        ]);
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authApi.register(data);
      if (response.success) {
        setUser(response.data.user);
        await AsyncStorage.multiSet([
          ['accessToken', response.data.accessToken],
          ['refreshToken', response.data.refreshToken],
        ]);
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  };

  const logout = async () => {
    console.log('[AuthContext] Logout initiated');
    try {
      await authApi.logout();
      console.log('[AuthContext] API Logout successful');
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
    } finally {
      console.log('[AuthContext] Clearing local state and storage');
      setUser(null);
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      console.log('[AuthContext] Logout complete');
    }
  };

  const updateProfile = async (data: { name?: string; profile_image?: string }) => {
    console.log('[AuthContext] UpdateProfile', data.name, data.profile_image ? 'Image present' : 'No image');
    try {
      const response = await authApi.updateProfile(data);
      if (response.success) {
        console.log('[AuthContext] UpdateProfile Success', response.data);
        setUser(response.data);
        return { success: true };
      } else {
        console.error('[AuthContext] UpdateProfile Failed', response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('[AuthContext] UpdateProfile Error', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
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
