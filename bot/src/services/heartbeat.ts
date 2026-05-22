import { config } from '../config/env';
import { apiClient } from './apiClient';
import { getSettings } from './settingsClient';
import { getState } from '../state';
import { logger } from '../logger';

/**
 * Posts a slim status snapshot to the main site every N ms.
 * The site stores this in `bot_heartbeats` (or just last-known-state) so the
 * admin panel can show "online" / "last seen" without proxying through to the
 * bot every time.
 */
export const startHeartbeat = () => {
  const tick = async () => {
    try {
      const state = getState();
      await apiClient.rawClient().post('/api/bot/heartbeat', {
        status: state.status,
        startedAt: state.startedAt,
        connectedAt: state.connectedAt,
        jid: state.jid,
        disconnectReason: state.disconnectReason,
        lastError: state.lastError,
        stats: state.stats,
      });
    } catch (err: any) {
      // Only log warning; bot keeps running even if site is offline
      logger.debug(`Heartbeat failed: ${err.message || err}`);
    }
  };

  setInterval(tick, config.heartbeatIntervalMs);
  tick();

  // Periodic settings refresh
  setInterval(() => {
    getSettings(true).catch(() => {});
  }, config.settingsRefreshMs);
};
