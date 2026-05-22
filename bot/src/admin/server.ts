import express from 'express';
import { config } from '../config/env';
import { logger } from '../logger';
import { requireSharedToken } from './auth';
import { getRecentLogs, getState } from '../state';
import { logoutAndReset, restartSocket } from '../whatsapp/connection';
import { getSettings } from '../services/settingsClient';
import { apiClient } from '../services/apiClient';

export const startAdminServer = () => {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // Everything below requires the shared token (used by the main site's API proxy)
  app.use(requireSharedToken);

  app.get('/status', (_req, res) => {
    const state = getState();
    res.json({
      status: state.status,
      startedAt: state.startedAt,
      connectedAt: state.connectedAt,
      jid: state.jid,
      disconnectReason: state.disconnectReason,
      lastError: state.lastError,
      qrAvailable: !!state.qrDataUrl,
      stats: state.stats,
    });
  });

  app.get('/qr', (_req, res) => {
    const state = getState();
    if (!state.qrDataUrl) {
      return res.status(404).json({ error: 'No QR available right now' });
    }
    res.json({ dataUrl: state.qrDataUrl });
  });

  app.get('/logs', (req, res) => {
    const limit = Math.min(parseInt((req.query.limit as string) || '200', 10) || 200, 500);
    res.json({ logs: getRecentLogs(limit) });
  });

  app.post('/restart', async (_req, res) => {
    try {
      await restartSocket();
      res.json({ ok: true });
    } catch (e: any) {
      logger.error('Restart failed', e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/logout', async (_req, res) => {
    try {
      await logoutAndReset();
      // Re-init to surface a fresh QR
      restartSocket().catch((e) => logger.error('Restart after logout failed', e));
      res.json({ ok: true });
    } catch (e: any) {
      logger.error('Logout failed', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Settings refresh — main site PUT'es into its DB, then asks the bot to reload
  app.post('/settings/reload', async (_req, res) => {
    try {
      const s = await getSettings(true);
      apiClient.invalidateCache();
      res.json({ ok: true, settings: s });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.listen(config.adminPort, () => {
    logger.info(`Bot admin HTTP listening on :${config.adminPort}`);
  });
};
