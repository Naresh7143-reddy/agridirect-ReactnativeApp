import client from './client';
import type { ApiResponse } from '../types/api';
import type {
  ChatMessage,
  ChatResponse,
  DiseaseDetectionResult,
  CropAdviceRequest,
  CropAdviceResponse,
  PriceForecastRequest,
  PriceForecastResponse,
} from '../types/ai';

export const aiApi = {
  /**
   * Conversational AI assistant for farmers.
   * Supports multilingual queries (Hindi, Kannada, Telugu, English, etc.)
   */
  chat: (
    message: string,
    language: string,
    history?: ChatMessage[],
  ): Promise<ApiResponse<ChatResponse>> =>
    client.post('/api/farmer/ai/chat', { message, language, history }),

  /**
   * Detect crop diseases from an uploaded photo.
   * FormData key: "image" (JPEG / PNG, max 10 MB).
   * Returns disease name, confidence score, severity and treatment plan.
   */
  detectDisease: (
    file: FormData,
  ): Promise<ApiResponse<DiseaseDetectionResult>> =>
    client.post('/api/farmer/ai/disease', file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /**
   * Get personalised crop growing advice based on
   * soil type, location, season and crop variety.
   */
  getCropAdvice: (
    data: CropAdviceRequest,
  ): Promise<ApiResponse<CropAdviceResponse>> =>
    client.post('/api/farmer/ai/advice', data),

  /**
   * AI-powered price forecast for a crop.
   * Uses historical mandi prices + seasonal trends.
   */
  getPriceForecast: (
    data: PriceForecastRequest,
  ): Promise<ApiResponse<PriceForecastResponse>> =>
    client.post('/api/farmer/ai/price-forecast', data),
};
