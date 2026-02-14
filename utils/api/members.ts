import { apiClient, ApiResponse, ApiError } from './client';

export interface WorkspaceMember {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    joined_at: string;
}

export const memberApi = {
    async getMembers(workspaceId: string): Promise<ApiResponse<WorkspaceMember[]> | ApiError> {
        return apiClient.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
    },

    async addMember(workspaceId: string, userId: string, role: string): Promise<ApiResponse<WorkspaceMember> | ApiError> {
        return apiClient.post<WorkspaceMember>(`/workspaces/${workspaceId}/members`, { userId, role });
    },

    async addMemberByCode(workspaceId: string, userCode: string, role: string): Promise<ApiResponse<WorkspaceMember> | ApiError> {
        return apiClient.post<WorkspaceMember>(`/workspaces/${workspaceId}/members/code`, { userCode, role });
    },

    async updateMemberRole(workspaceId: string, userId: string, role: string): Promise<ApiResponse<WorkspaceMember> | ApiError> {
        return apiClient.put<WorkspaceMember>(`/workspaces/${workspaceId}/members/${userId}`, { role });
    },

    async removeMember(workspaceId: string, userId: string): Promise<ApiResponse<void> | ApiError> {
        return apiClient.delete<void>(`/workspaces/${workspaceId}/members/${userId}`);
    },
};
