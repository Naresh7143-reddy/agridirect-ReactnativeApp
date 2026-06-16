// ─── Chat ─────────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  reply: string;
  language: string;
  suggestions?: string[];   // Quick-reply suggestions
  relatedTopics?: string[];
}

// ─── Disease detection ────────────────────────────────────────────────────────

export interface TreatmentStep {
  step: number;
  description: string;
  products?: string[];       // recommended pesticides / bio-agents
}

export interface DiseaseDetectionResult {
  diseaseName: string;
  scientificName?: string;
  confidence: number;        // 0–1
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedCrops: string[];
  symptoms: string[];
  causes: string[];
  treatment: TreatmentStep[];
  preventionTips: string[];
  imageAnalyzed: string;     // URL of uploaded image
  detectedAt: string;
}

// ─── Crop advice ──────────────────────────────────────────────────────────────

export interface CropAdviceRequest {
  cropName: string;
  soilType?: string;
  location?: {
    state: string;
    district?: string;
  };
  season?: 'kharif' | 'rabi' | 'zaid';
  currentIssue?: string;
  language?: string;
}

export interface CropAdviceResponse {
  cropName: string;
  advice: string;
  sowingTips?: string[];
  fertilizerSchedule?: Array<{
    stage: string;
    fertilizer: string;
    quantity: string;
    timing: string;
  }>;
  irrigationTips?: string[];
  pestManagement?: string[];
  harvestingTips?: string[];
  expectedYield?: string;
  marketTips?: string;
}

// ─── Price forecast ───────────────────────────────────────────────────────────

export interface PriceForecastRequest {
  cropName: string;
  state: string;
  district?: string;
  forecastDays?: number;     // default 30
}

export interface PricePoint {
  date: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  market?: string;
}

export interface PriceForecastResponse {
  cropName: string;
  currentPrice: number;
  unit: string;
  trend: 'rising' | 'falling' | 'stable';
  trendPercentage: number;   // % change expected
  forecast: PricePoint[];
  bestSellingWindow?: {
    from: string;
    to: string;
    reason: string;
  };
  historicalData?: PricePoint[];
  advice?: string;
}
