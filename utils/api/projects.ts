import { apiClient, ApiResponse, ApiError } from './client';

export interface Project {
  id: string;
  name: string;
  description?: string;
  workspace_id: string;
  created_by: string;
  is_completed: boolean;
  completed_at?: string;
  completed_by?: string;
  created_at: string;
  updated_at: string;
  taskCount?: number;
  completedTaskCount?: number;
  isMember?: boolean;
  creator?: {
    id: string;
    user_id: string;
    name: string;
    email: string;
    profile_image?: string;
  };
  completedBy?: {
    id: string;
    user_id: string;
    name: string;
    email: string;
  };
  members?: Array<{
    id: string;
    user_id: string;
    name: string;
    email: string;
    profile_image?: string;
  }>;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  added_by: string;
  added_at: string;
  user: {
    id: string;
    user_id: string;
    name: string;
    email: string;
    profile_image?: string;
  };
  addedBy: {
    id: string;
    name: string;
    email: string;
  };
}

export const projectApi = {
  async getByWorkspace(workspaceId: string, showCompleted = false): Promise<ApiResponse<Project[]> | ApiError> {
    return apiClient.get<Project[]>(`/projects/workspace/${workspaceId}?showCompleted=${showCompleted}`);
  },

  async getById(id: string): Promise<ApiResponse<Project> | ApiError> {
    return apiClient.get<Project>(`/projects/${id}`);
  },

  async create(workspaceId: string, name: string, description?: string, memberIds?: string[]): Promise<ApiResponse<Project> | ApiError> {
    return apiClient.post<Project>(`/projects/workspace/${workspaceId}`, { name, description, memberIds });
  },

  async update(id: string, name: string, description?: string): Promise<ApiResponse<Project> | ApiError> {
    return apiClient.put<Project>(`/projects/${id}`, { name, description });
  },

  async complete(id: string): Promise<ApiResponse<Project> | ApiError> {
    return apiClient.put<Project>(`/projects/${id}/complete`, {});
  },

  async reopen(id: string): Promise<ApiResponse<Project> | ApiError> {
    return apiClient.put<Project>(`/projects/${id}/reopen`, {});
  },

  async delete(id: string): Promise<ApiResponse<void> | ApiError> {
    return apiClient.delete<void>(`/projects/${id}`);
  },

  async addMember(id: string, userId: string): Promise<ApiResponse<void> | ApiError> {
    return apiClient.post<void>(`/projects/${id}/members`, { userId });
  },

  async removeMember(id: string, userId: string): Promise<ApiResponse<void> | ApiError> {
    return apiClient.delete<void>(`/projects/${id}/members/${userId}`);
  },

  async getMembers(id: string): Promise<ApiResponse<ProjectMember[]> | ApiError> {
    return apiClient.get<ProjectMember[]>(`/projects/${id}/members`);
  },
};