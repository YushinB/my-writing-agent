import apiClient, { ApiResponse } from './api';
import { User, ProfileUpdateData } from '../types';

export interface ProfileResponse extends User {
  createdAt: Date;
  updatedAt: Date;
}

class ProfileService {
  /**
   * Get current user's profile
   */
  async getProfile(): Promise<ProfileResponse> {
    const response = await apiClient.get<ApiResponse<ProfileResponse>>('/profile');
    return response.data.data;
  }

  /**
   * Update current user's profile
   */
  async updateProfile(data: ProfileUpdateData): Promise<ProfileResponse> {
    const response = await apiClient.put<ApiResponse<ProfileResponse>>('/profile', data);
    return response.data.data;
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(file: File): Promise<ProfileResponse> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post<ApiResponse<ProfileResponse>>(
      '/profile/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  }

  /**
   * Delete avatar
   */
  async deleteAvatar(): Promise<ProfileResponse> {
    const response = await apiClient.delete<ApiResponse<ProfileResponse>>('/profile/avatar');
    return response.data.data;
  }
}

export const profileService = new ProfileService();
export default profileService;
