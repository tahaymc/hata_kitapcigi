import { apiClient } from './apiClient';
import { config } from '../config/env';
import { logger } from '../logger';

export interface BotSettings {
  enabled: boolean;
  listen_groups: boolean;
  ocr_languages: string;
  confidence_threshold: number;
  match_score_threshold: number;
  reply_with_steps: boolean;
  reply_with_images: boolean;
  reply_with_video: boolean;
  fallback_message: string;
  error_message: string;
  disabled_message: string;
  allowlist: string[];
  blocklist: string[];
}

const defaults: BotSettings = {
  enabled: true,
  listen_groups: false,
  ocr_languages: 'eng+tur',
  confidence_threshold: 40,
  match_score_threshold: 30,
  reply_with_steps: true,
  reply_with_images: true,
  reply_with_video: true,
  fallback_message:
    '❓ Gönderdiğiniz ekran görüntüsündeki hatayı veritabanımda bulamadım.\n\nDaha net bir fotoğraf göndermeyi deneyin veya ilgili departmana başvurun.',
  error_message: '⚠️ Görselinizi işlerken teknik bir sorun oluştu. Lütfen daha sonra tekrar deneyin.',
  disabled_message: '🤖 Bot şu anda devre dışı.',
  allowlist: [],
  blocklist: [],
};

let cached: BotSettings = { ...defaults };
let lastFetch = 0;

const normalize = (raw: any): BotSettings => {
  if (!raw || typeof raw !== 'object') return { ...defaults };
  return {
    enabled: raw.enabled !== false,
    listen_groups: !!raw.listen_groups,
    ocr_languages: typeof raw.ocr_languages === 'string' && raw.ocr_languages.length > 0 ? raw.ocr_languages : defaults.ocr_languages,
    confidence_threshold: Number.isFinite(Number(raw.confidence_threshold)) ? Number(raw.confidence_threshold) : defaults.confidence_threshold,
    match_score_threshold: Number.isFinite(Number(raw.match_score_threshold)) ? Number(raw.match_score_threshold) : defaults.match_score_threshold,
    reply_with_steps: raw.reply_with_steps !== false,
    reply_with_images: raw.reply_with_images !== false,
    reply_with_video: raw.reply_with_video !== false,
    fallback_message: typeof raw.fallback_message === 'string' && raw.fallback_message ? raw.fallback_message : defaults.fallback_message,
    error_message: typeof raw.error_message === 'string' && raw.error_message ? raw.error_message : defaults.error_message,
    disabled_message: typeof raw.disabled_message === 'string' && raw.disabled_message ? raw.disabled_message : defaults.disabled_message,
    allowlist: Array.isArray(raw.allowlist) ? raw.allowlist.map((s: any) => String(s)) : [],
    blocklist: Array.isArray(raw.blocklist) ? raw.blocklist.map((s: any) => String(s)) : [],
  };
};

export const getSettings = async (force = false): Promise<BotSettings> => {
  const now = Date.now();
  if (!force && now - lastFetch < config.settingsRefreshMs) {
    return cached;
  }
  try {
    const { data } = await apiClient.rawClient().get('/api/bot/settings');
    cached = normalize(data);
    lastFetch = now;
  } catch (err: any) {
    logger.warn(`Failed to fetch bot settings, using cached defaults: ${err.message || err}`);
  }
  return cached;
};

export const getCachedSettings = (): BotSettings => cached;
