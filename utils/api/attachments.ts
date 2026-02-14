import { apiClient, ApiResponse, ApiError } from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Attachment {
    id: string;
    original_filename: string;
    file_size: number;
    file_type: string;
    uploaded_by: string;
    uploaded_at: string;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const attachmentApi = {
    async getByTask(taskId: string): Promise<ApiResponse<Attachment[]> | ApiError> {
        return apiClient.get<Attachment[]>(`/attachments/task/${taskId}`);
    },

    async upload(taskId: string, formData: FormData): Promise<ApiResponse<Attachment> | ApiError> {
        return apiClient.uploadFile<Attachment>(`/attachments/task/${taskId}`, formData);
    },

    async delete(id: string): Promise<ApiResponse<void> | ApiError> {
        return apiClient.delete<void>(`/attachments/${id}`);
    },

    async download(id: string): Promise<void> {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const response = await fetch(`${API_URL}/attachments/${id}/download`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            const contentDisposition = response.headers.get('content-disposition');
            let filename = 'download';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download attachment:', error);
            throw error;
        }
    },
};
