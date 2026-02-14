import { apiClient, ApiResponse, ApiError } from './client';

export interface Notification {
    id: string;
    user_id: string;
    type: 'DUE_DATE' | 'PRIORITY' | 'ASSIGNMENT' | 'COMMENT' | 'PROJECT_INVITE' | 'TASK_ASSIGNMENT' | 'PROJECT_COMPLETED';
    message: string;
    read: boolean;
    data?: any;
    created_at: string;
}

export const notificationApi = {
    async getAll(page = 1, limit = 20): Promise<ApiResponse<Notification[]> | ApiError> {
        return apiClient.get<Notification[]>(`/notifications?page=${page}&limit=${limit}`);
    },

    async markAsRead(id: string): Promise<ApiResponse<void> | ApiError> {
        return apiClient.put<void>(`/notifications/${id}/read`, {});
    },

    async markAllAsRead(): Promise<ApiResponse<void> | ApiError> {
        return apiClient.put<void>('/notifications/read-all', {});
    },
};
