import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { env } from './env';
import logger from '../utils/logger';

// Initialize Google Generative AI client
class GeminiClient {
  private static instance: GoogleGenerativeAI | null = null;
  private static model: GenerativeModel | null = null;

  private constructor() {}

  public static getInstance(): GoogleGenerativeAI {
    if (!GeminiClient.instance) {
      try {
        GeminiClient.instance = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        logger.info('✅ Gemini AI client initialized');
      } catch (error) {
        logger.error('❌ Failed to initialize Gemini AI client:', error);
        throw error;
      }
    }
    return GeminiClient.instance;
  }

  public static getModel(modelName?: string): GenerativeModel {
    const client = GeminiClient.getInstance();
    const model = modelName || env.GEMINI_MODEL;

    if (!GeminiClient.model || GeminiClient.model.model !== model) {
      GeminiClient.model = client.getGenerativeModel({ model });
      logger.info(`📦 Gemini model loaded: ${model}`);
    }

    return GeminiClient.model;
  }

  public static async testConnection(): Promise<boolean> {
    try {
      const model = GeminiClient.getModel();
      const result = await model.generateContent('Hello');
      const response = await result.response;
      const text = response.text();

      if (text && text.length > 0) {
        logger.info('✅ Gemini AI connection test successful');
        return true;
      }
      return false;
    } catch (error) {
      logger.error('❌ Gemini AI connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const geminiClient = GeminiClient.getInstance();

// Export utility functions
export const getGeminiModel = GeminiClient.getModel;
export const testGeminiConnection = GeminiClient.testConnection;

// Gemini Generation Configuration Presets
export const generationConfig = {
  // For text correction (balanced)
  textCorrection: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  },

  // For definitions (precise)
  definition: {
    temperature: 0.3,
    topK: 20,
    topP: 0.8,
    maxOutputTokens: 1024,
  },

  // For suggestions (creative)
  suggestions: {
    temperature: 0.9,
    topK: 50,
    topP: 0.98,
    maxOutputTokens: 1024,
  },

  // For analysis (balanced)
  analysis: {
    temperature: 0.5,
    topK: 30,
    topP: 0.9,
    maxOutputTokens: 2048,
  },
};

// Safety settings
export const safetySettings = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
];

export default geminiClient;
