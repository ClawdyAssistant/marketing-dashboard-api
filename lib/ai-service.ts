import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || 'dev-key-12345';

interface CampaignMetrics {
  campaignName: string;
  platform: string;
  dateRange: {
    start: string;
    end: string;
  };
  metrics: {
    spend: number;
    revenue: number;
    impressions: number;
    clicks: number;
    conversions: number;
    roas: number;
    ctr: number;
    cpc: number;
  };
}

interface AIInsightsRequest {
  campaigns: CampaignMetrics[];
  dateRange: {
    start: string;
    end: string;
  };
}

interface AIInsightsResponse {
  summary: string;
  performance_analysis: {
    best_performers: Array<{
      campaign: string;
      reason: string;
    }>;
    underperformers: Array<{
      campaign: string;
      issues: string[];
    }>;
  };
  optimization_suggestions: Array<{
    campaign: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
    expected_impact: string;
  }>;
  trends: {
    spend_trend: string;
    revenue_trend: string;
    roas_trend: string;
  };
  recommendations: string[];
}

export class AIServiceClient {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = AI_SERVICE_URL;
    this.apiKey = AI_SERVICE_API_KEY;
  }

  /**
   * Get AI-powered insights for campaigns
   */
  async getInsights(data: AIInsightsRequest): Promise<AIInsightsResponse> {
    try {
      const response = await axios.post<AIInsightsResponse>(
        `${this.baseURL}/insights`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          },
          timeout: 30000, // 30 seconds
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('AI Service Error:', error.response?.data || error.message);
        throw new Error(`AI Service Error: ${error.response?.data?.detail || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Health check for AI service
   */
  async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      return response.data;
    } catch (error) {
      console.error('AI Service health check failed:', error);
      throw new Error('AI Service is unavailable');
    }
  }
}

// Singleton instance
export const aiService = new AIServiceClient();
