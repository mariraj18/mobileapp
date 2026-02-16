import { apiClient, ApiResponse, ApiError } from './client';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  due_date: string | null;
  project_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    user_id: string;
    name: string;
    email: string;
    profile_image?: string;
  };
  assignedUsers?: Array<{
    id: string;
    user_id: string;
    name: string;
    email: string;
    profile_image?: string;
  }>;
  project?: {
    id: string;
    name: string;
    workspace_id: string;
    is_completed: boolean;
    created_by: string;
  };
  commentCount?: number;
  attachmentCount?: number;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  due_date?: string;
  assignedUserIds?: string[];
}

export interface CreateStandaloneTaskData {
  title: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  due_date?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  due_date?: string;
}

export interface TaskFilters {
  page?: number;
  limit?: number;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo?: string;
  search?: string;
  sortBy?: 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'title';
  sortOrder?: 'ASC' | 'DESC';
}

export const taskApi = {
  async getAll(projectId: string, filters: TaskFilters = {}): Promise<ApiResponse<Task[]> | ApiError> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    return apiClient.get<Task[]>(`/tasks/project/${projectId}?${params.toString()}`);
  },

  async getById(id: string): Promise<ApiResponse<Task> | ApiError> {
    return apiClient.get<Task>(`/tasks/${id}`);
  },

  async create(projectId: string, data: CreateTaskData): Promise<ApiResponse<Task> | ApiError> {
    return apiClient.post<Task>(`/tasks/project/${projectId}`, data);
  },

  async update(id: string, data: UpdateTaskData): Promise<ApiResponse<Task> | ApiError> {
    return apiClient.put<Task>(`/tasks/${id}`, data);
  },

  async delete(id: string): Promise<ApiResponse<void> | ApiError> {
    return apiClient.delete<void>(`/tasks/${id}`);
  },

  async assignUsers(id: string, userIds: string[]): Promise<ApiResponse<{ assignedCount: number }> | ApiError> {
    return apiClient.post<{ assignedCount: number }>(`/tasks/${id}/assign`, { userIds });
  },

  async unassignUsers(id: string, userIds: string[]): Promise<ApiResponse<{ unassignedCount: number }> | ApiError> {
    return apiClient.post<{ unassignedCount: number }>(`/tasks/${id}/unassign`, { userIds });
  },

  async getUserTasks(filters: TaskFilters = {}): Promise<ApiResponse<Task[]> | ApiError> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    return apiClient.get<Task[]>(`/tasks/my-tasks?${params.toString()}`);
  },

  async getMyProjectsTasks(filters: TaskFilters = {}): Promise<ApiResponse<Task[]> | ApiError> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    return apiClient.get<Task[]>(`/tasks/my-projects?${params.toString()}`);
  },

  // Standalone task operations
  async createStandalone(data: CreateStandaloneTaskData): Promise<ApiResponse<Task> | ApiError> {
    return apiClient.post<Task>('/tasks/standalone', data);
  },

  async getStandalone(filters: TaskFilters = {}): Promise<ApiResponse<Task[]> | ApiError> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    return apiClient.get<Task[]>(`/tasks/standalone?${params.toString()}`);
  },

  async updateStandalone(id: string, data: UpdateTaskData): Promise<ApiResponse<Task> | ApiError> {
    return apiClient.put<Task>(`/tasks/standalone/${id}`, data);
  },

  async deleteStandalone(id: string): Promise<ApiResponse<void> | ApiError> {
    return apiClient.delete<void>(`/tasks/standalone/${id}`);
  },
};