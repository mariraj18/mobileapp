import { apiClient, ApiResponse, ApiError } from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  user_id: string;
  name: string;
  email: string;
  is_active: boolean;
  profile_image?: string;
  created_at?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserStats {
  projects: number;
  tasks: number;
  workspaces: number;
}

export const authApi = {
  async register(data: RegisterData): Promise<ApiResponse<AuthResponse> | ApiError> {
    const response = await apiClient.post<AuthResponse>('/register', data, true);
    if (response.success) {
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  async login(data: LoginData): Promise<ApiResponse<AuthResponse> | ApiError> {
    const response = await apiClient.post<AuthResponse>('/login', data, true);
    if (response.success) {
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  async logout(): Promise<void> {
    await apiClient.post('/logout', {}, true);
    await apiClient.clearTokens();
  },

  async getMe(): Promise<ApiResponse<User> | ApiError> {
    return apiClient.get<User>('/me', true);
  },

  async updateProfile(data: { name?: string; profile_image?: string }): Promise<ApiResponse<User> | ApiError> {
    const response = await apiClient.put<User>('/profile', data, true);
    if (response.success) {
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
    }
    return response;
  },

  async updatePushToken(pushToken: string): Promise<ApiResponse<void> | ApiError> {
    return apiClient.put<void>('/push-token', { pushToken }, true);
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  async getUserStats(): Promise<ApiResponse<UserStats> | ApiError> {
    return apiClient.get<UserStats>('/stats', true);
  },

  async findUserByCode(userCode: string): Promise<ApiResponse<User> | ApiError> {
    return apiClient.get<User>(`/users/code/${userCode}`, true);
  },
};