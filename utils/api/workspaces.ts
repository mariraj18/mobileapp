import { apiClient, ApiResponse, ApiError } from './client';

export interface Workspace {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  role?: string;
  joined_at?: string;
  memberCount?: number;
  projectCount?: number;
  creator?: {
    id: string;
    user_id: string;
    name: string;
    email: string;
    profile_image?: string;
  };
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  userCode: string;
  name: string;
  email: string;
  profileImage?: string;
  role: string;
  joined_at: string;
}

export const workspaceApi = {
  async getAll(page = 1, limit = 20): Promise<ApiResponse<Workspace[]> | ApiError> {
    return apiClient.get<Workspace[]>(`/workspaces?page=${page}&limit=${limit}`);
  },

  async getById(id: string): Promise<ApiResponse<Workspace> | ApiError> {
    return apiClient.get<Workspace>(`/workspaces/${id}`);
  },

  async create(name: string): Promise<ApiResponse<Workspace> | ApiError> {
    return apiClient.post<Workspace>('/workspaces', { name });
  },

  async update(id: string, name: string): Promise<ApiResponse<Workspace> | ApiError> {
    return apiClient.put<Workspace>(`/workspaces/${id}`, { name });
  },

  async delete(id: string): Promise<ApiResponse<void> | ApiError> {
    return apiClient.delete<void>(`/workspaces/${id}`);
  },

  async getMembers(id: string): Promise<ApiResponse<WorkspaceMember[]> | ApiError> {
    return apiClient.get<WorkspaceMember[]>(`/workspaces/${id}/members`);
  },

  async addMember(id: string, userId: string, role: string): Promise<ApiResponse<WorkspaceMember> | ApiError> {
    return apiClient.post<WorkspaceMember>(`/workspaces/${id}/members`, { userId, role });
  },

  async addMemberByCode(id: string, userCode: string, role: string): Promise<ApiResponse<WorkspaceMember> | ApiError> {
    return apiClient.post<WorkspaceMember>(`/workspaces/${id}/members/code`, { userCode, role });
  },

  async updateMemberRole(id: string, userId: string, role: string): Promise<ApiResponse<WorkspaceMember> | ApiError> {
    return apiClient.put<WorkspaceMember>(`/workspaces/${id}/members/${userId}`, { role });
  },

  async removeMember(id: string, userId: string): Promise<ApiResponse<void> | ApiError> {
    return apiClient.delete<void>(`/workspaces/${id}/members/${userId}`);
  },
};