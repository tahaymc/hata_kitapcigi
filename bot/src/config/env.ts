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
  settingsRefreshMs: parseInt(process.env.SETTINGS_REFRESH_MS || '30000', 10),
  heartbeatIntervalMs: parseInt(process.env.HEARTBEAT_INTERVAL_MS || '15000', 10),
};

const required = ['SITE_API_URL', 'BOT_SHARED_TOKEN'];
required.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.warn(`WARNING: Missing environment variable ${envVar}`);
  }
});
