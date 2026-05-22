import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';
import { logger } from '../logger';

export interface ErrorRecord {
  id: any;
  title: string | null;
  code: string | null;
  category: string | null;
  summary: string | null;
  solution: string | null;
  solutionType: string | null;
  solutionSteps: any;
  date: string | null;
  viewCount: number | null;
  imageUrl: string | null;
  imageUrls: string[] | null;
  videoUrl: string | null;
  video_url?: string | null;
  department_id: string | null;
}

class ApiClient {
  private http: AxiosInstance;
  private cache: { data: ErrorRecord[]; ts: number } | null = null;
  private readonly CACHE_TTL_MS = 60_000;

  constructor() {
    this.http = axios.create({
      baseURL: config.site.apiUrl,
      timeout: 15_000,
      headers: {
        'x-bot-token': config.site.sharedToken,
      },
    });
  }

  /**
   * Fetches all errors from the main site API.
   * Caches in memory for CACHE_TTL_MS to avoid hammering the API on each match.
   */
  async getAllErrors(force = false): Promise<ErrorRecord[]> {
    if (!force && this.cache && Date.now() - this.cache.ts < this.CACHE_TTL_MS) {
      return this.cache.data;
    }

    try {
      const { data } = await this.http.get<ErrorRecord[]>('/api/errors');
      this.cache = { data: data || [], ts: Date.now() };
      logger.debug(`Fetched ${data?.length || 0} errors from site API`);
      return this.cache.data;
    } catch (err: any) {
      logger.error('Failed to fetch errors from site API:', err.message || err);
      if (this.cache) return this.cache.data;
      throw err;
    }
  }

  /**
   * Bumps the view counter on the site so the admin sees that the bot used this entry.
   */
  async incrementViewCount(id: number | string): Promise<void> {
    try {
      await this.http.post(`/api/errors/${id}/view`, {});
    } catch (err: any) {
      logger.warn(`incrementViewCount failed for ${id}: ${err.message || err}`);
    }
  }

  invalidateCache() {
    this.cache = null;
  }

  rawClient(): AxiosInstance {
    return this.http;
  }
}

export const apiClient = new ApiClient();
