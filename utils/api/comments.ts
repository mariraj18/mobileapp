import { apiClient, ApiResponse, ApiError } from './client';

export interface Comment {
    id: string;
    content: string;
    task_id: string;
    user_id: string;
    parent_id?: string;
    reply_to?: string;
    created_at: string;
    updated_at: string;
    user: {
        id: string;
        user_id: string;
        name: string;
        email: string;
        profile_image?: string;
    };
    replyToUser?: {
        id: string;
        user_id: string;
        name: string;
        email: string;
    };
    replies?: Comment[];
}

export interface CreateCommentData {
    content: string;
    parentId?: string;
    replyTo?: string;
}

export const commentApi = {
    async getByTask(taskId: string): Promise<ApiResponse<Comment[]> | ApiError> {
        return apiClient.get<Comment[]>(`/comments/task/${taskId}`);
    },

    async create(taskId: string, data: CreateCommentData): Promise<ApiResponse<Comment> | ApiError> {
        return apiClient.post<Comment>(`/comments/task/${taskId}`, data);
    },

    async update(id: string, content: string): Promise<ApiResponse<Comment> | ApiError> {
        return apiClient.put<Comment>(`/comments/${id}`, { content });
    },

    async delete(id: string): Promise<ApiResponse<void> | ApiError> {
        return apiClient.delete<void>(`/comments/${id}`);
    },
};