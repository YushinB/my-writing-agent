import apiClient, { ApiResponse } from './api';
import { AppSettings, AppFont, AIModel } from '../types';

// Settings types matching backend API
export interface UserSettings {
  userId: string;
  llmModel: string;
  preferredLanguage: string;
  theme: 'light' | 'dark';
  emailNotifications: boolean;
  fontFamily?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsRequest {
  llmModel?: string;
  preferredLanguage?: string;
  theme?: 'light' | 'dark';
  emailNotifications?: boolean;
  fontFamily?: string;
}

class SettingsService {
  /**
   * Get user settings
   */
  async getSettings(): Promise<UserSettings> {
    const response = await apiClient.get<ApiResponse<UserSettings>>('/settings');
    return response.data.data;
  }

  /**
   * Update user settings
   */
  async updateSettings(data: UpdateSettingsRequest): Promise<UserSettings> {
    const response = await apiClient.patch<ApiResponse<UserSettings>>('/settings', data);
    return response.data.data;
  }

  /**
   * Reset settings to default
   */
  async resetSettings(): Promise<UserSettings> {
    const response = await apiClient.post<ApiResponse<UserSettings>>('/settings/reset');
    return response.data.data;
  }

  /**
   * Convert UserSettings to AppSettings for Redux store compatibility
   */
  toAppSettings(settings: UserSettings): AppSettings {
    return {
      fontFamily: (settings.fontFamily as AppFont) || 'inter',
      aiModel: (settings.llmModel as AIModel) || 'gemini-2.5-flash',
      theme: settings.theme || 'light',
    };
  }

  /**
   * Convert AppSettings to UpdateSettingsRequest
   */
  toUpdateRequest(appSettings: Partial<AppSettings>): UpdateSettingsRequest {
    const request: UpdateSettingsRequest = {};
    
    if (appSettings.fontFamily) {
      request.fontFamily = appSettings.fontFamily;
    }
    if (appSettings.aiModel) {
      request.llmModel = appSettings.aiModel;
    }
    if (appSettings.theme) {
      request.theme = appSettings.theme;
    }
    
    return request;
  }
}

const settingsService = new SettingsService();
export default settingsService;
