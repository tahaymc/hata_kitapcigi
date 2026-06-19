import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface Config {
  port: number;
  adminPort: number;
  nodeEnv: string;
  site: {
    apiUrl: string;
    publicUrl: string;
    sharedToken: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    tls?: Record<string, never>;
  };
  whatsapp: {
    sessionDir: string;
  };
  ocr: {
    provider: string;
    googleApiKey: string;
    localUrl: string;
    googleMonthlyLimit: number;
  };
  settingsRefreshMs: number;
  heartbeatIntervalMs: number;
}

const parseRedisUrl = (url?: string) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: parseInt(u.port, 10) || 6379,
      password: u.password ? decodeURIComponent(u.password) : undefined,
      tls: u.protocol === 'rediss:' ? ({} as Record<string, never>) : undefined,
    };
  } catch {
    return null;
  }
};

const fromUrl = parseRedisUrl(process.env.REDIS_URL);

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  adminPort: parseInt(process.env.ADMIN_PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  site: {
    apiUrl: (process.env.SITE_API_URL || 'http://localhost:3001').replace(/\/$/, ''),
    publicUrl: (process.env.SITE_PUBLIC_URL || process.env.SITE_API_URL || 'http://localhost:3001').replace(/\/$/, ''),
    sharedToken: process.env.BOT_SHARED_TOKEN || '',
  },
  redis: {
    host: fromUrl?.host || process.env.REDIS_HOST || 'localhost',
    port: fromUrl?.port || parseInt(process.env.REDIS_PORT || '6379', 10),
    password: fromUrl?.password || process.env.REDIS_PASSWORD || undefined,
    tls: fromUrl?.tls || (process.env.REDIS_TLS === 'true' ? ({} as Record<string, never>) : undefined),
  },
  whatsapp: {
    sessionDir: process.env.SESSION_DIR || './auth_info_baileys',
  },
  ocr: {
    // Saglayici secimi (OCR_PROVIDER ile zorlanabilir): Google Vision anahtari
    // varsa 'google', yerel EasyOCR servisi (OCR_LOCAL_URL) tanimliysa 'easyocr',
    // aksi halde yerel Tesseract. Hangisi olursa olsun hata durumunda Tesseract'a
    // dusulur (botu calisir tutmak icin).
    provider:
      process.env.OCR_PROVIDER ||
      (process.env.GOOGLE_VISION_API_KEY
        ? 'google'
        : process.env.OCR_LOCAL_URL
          ? 'easyocr'
          : 'tesseract'),
    googleApiKey: process.env.GOOGLE_VISION_API_KEY || '',
    localUrl: (process.env.OCR_LOCAL_URL || '').replace(/\/$/, ''),
    // Google Vision aylik ucretsiz kotasi (1000 birim/ay). Bot bu sayiya gelince
    // Google'i hic cagirmadan otomatik olarak EasyOCR'a duser; boylece ucret
    // yazmaz. Guvenli tampon icin biraz dusuk verilebilir (or. 950).
    googleMonthlyLimit: parseInt(process.env.OCR_GOOGLE_MONTHLY_LIMIT || '1000', 10),
  },
  settingsRefreshMs: parseInt(process.env.SETTINGS_REFRESH_MS || '30000', 10),
  heartbeatIntervalMs: parseInt(process.env.HEARTBEAT_INTERVAL_MS || '15000', 10),
};

const required = ['SITE_API_URL', 'BOT_SHARED_TOKEN'];
required.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.warn(`WARNING: Missing environment variable ${envVar}`);
  }
});
