import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const AUTH_API_URL = process.env.EXPO_PUBLIC_AUTH_API_URL || 'http://localhost:5000/api/auth';

export interface ApiError {
  success: false;
  message: string;
  status?: number;
  errors?: Array<{ field: string; message: string }>;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  status: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  stats?: {
    active: number;
    dueToday: number;
    completed: number;
  };
}

class ApiClient {
  private baseURL: string;
  private authBaseURL: string;

  constructor() {
    this.baseURL = API_URL;
    this.authBaseURL = AUTH_API_URL;
  }

  private async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('accessToken');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  private async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('refreshToken');
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  private async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
      ]);
    } catch (error) {
      console.error('Error setting tokens:', error);
    }
  }

  public async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${this.authBaseURL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        mode: 'cors',
        credentials: 'omit',
      });

      const data = await response.json();

      if (data.success && data.data) {
        await this.setTokens(data.data.accessToken, data.data.refreshToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useAuthBase = false
  ): Promise<ApiResponse<T> | ApiError> {
    const token = await this.getToken();
    const baseURL = useAuthBase ? this.authBaseURL : this.baseURL;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      console.log(`[API-CLIENT] Request: ${options.method || 'GET'} ${baseURL}${endpoint}`);
      if (options.body) console.log(`[API-CLIENT] Body:`, options.body);

      const response = await fetch(`${baseURL}${endpoint}`, {
        ...options,
        headers,
        mode: 'cors',
        credentials: 'omit',
      });

      const data = await response.json();

      if (
        response.status === 401 &&
        endpoint !== '/login' &&
        endpoint !== '/register' &&
        endpoint !== '/refresh'
      ) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return this.request<T>(endpoint, options, useAuthBase);
        } else {
          await this.clearTokens();
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        return { ...(data as ApiError), status: response.status } as ApiError;
      }

      return { ...(data as ApiResponse<T>), status: response.status } as ApiResponse<T>;
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  public async get<T>(endpoint: string, useAuthBase = false): Promise<ApiResponse<T> | ApiError> {
    return this.request<T>(endpoint, { method: 'GET' }, useAuthBase);
  }

  public async post<T>(
    endpoint: string,
    body?: unknown,
    useAuthBase = false
  ): Promise<ApiResponse<T> | ApiError> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      useAuthBase
    );
  }

  public async put<T>(
    endpoint: string,
    body?: unknown,
    useAuthBase = false
  ): Promise<ApiResponse<T> | ApiError> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      },
      useAuthBase
    );
  }

  public async delete<T>(endpoint: string, useAuthBase = false): Promise<ApiResponse<T> | ApiError> {
    return this.request<T>(endpoint, { method: 'DELETE' }, useAuthBase);
  }

  public async uploadFile<T>(
    endpoint: string,
    file: FormData
  ): Promise<ApiResponse<T> | ApiError> {
    const token = await this.getToken();

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // FIXED: Added mode: 'cors' and credentials: 'omit' for file uploads too
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: file,
        mode: 'cors',
        credentials: 'omit',
      });

      const data = await response.json();

      if (response.status === 401) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return this.uploadFile<T>(endpoint, file);
        } else {
          await this.clearTokens();
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        return { ...(data as ApiError), status: response.status } as ApiError;
      }

      return { ...(data as ApiResponse<T>), status: response.status } as ApiResponse<T>;
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }
}

export const apiClient = new ApiClient();