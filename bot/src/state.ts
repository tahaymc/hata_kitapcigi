/**
 * In-memory state store for runtime status, recent logs and stats.
 * Bot's admin HTTP server reads from here, and a periodic heartbeat
 * job pushes a slim version of this to the main site.
 */

export type ConnectionStatus = 'starting' | 'connecting' | 'qr_required' | 'connected' | 'disconnected' | 'logged_out';

export interface BotState {
  status: ConnectionStatus;
  startedAt: string;
  connectedAt: string | null;
  disconnectReason: number | null;
  qrDataUrl: string | null;
  jid: string | null;
  lastError: string | null;
  stats: {
    messagesSeen: number;
    imagesProcessed: number;
    matched: number;
    unmatched: number;
    duplicates: number;
    failed: number;
    lastProcessedAt: string | null;
  };
}

const MAX_LOGS = 500;

const state: BotState = {
  status: 'starting',
  startedAt: new Date().toISOString(),
  connectedAt: null,
  disconnectReason: null,
  qrDataUrl: null,
  jid: null,
  lastError: null,
  stats: {
    messagesSeen: 0,
    imagesProcessed: 0,
    matched: 0,
    unmatched: 0,
    duplicates: 0,
    failed: 0,
    lastProcessedAt: null,
  },
};

const recentLogs: string[] = [];

export const getState = (): BotState => state;

export const setStatus = (status: ConnectionStatus) => {
  state.status = status;
  if (status === 'connected') {
    state.connectedAt = new Date().toISOString();
    state.qrDataUrl = null;
    state.disconnectReason = null;
    state.lastError = null;
  }
};

export const setQr = (qrDataUrl: string | null) => {
  state.qrDataUrl = qrDataUrl;
  if (qrDataUrl) state.status = 'qr_required';
};

export const setJid = (jid: string | null) => {
  state.jid = jid;
};

export const setDisconnect = (reason: number | null, error?: string) => {
  state.disconnectReason = reason;
  if (error) state.lastError = error;
};

export const incStat = (key: keyof BotState['stats'], by: number = 1) => {
  if (typeof state.stats[key] === 'number') {
    (state.stats[key] as number) = (state.stats[key] as number) + by;
  }
  state.stats.lastProcessedAt = new Date().toISOString();
};

export const recordLog = (line: string) => {
  recentLogs.push(line);
  if (recentLogs.length > MAX_LOGS) {
    recentLogs.splice(0, recentLogs.length - MAX_LOGS);
  }
};

export const getRecentLogs = (limit: number = 200): string[] => {
  const start = Math.max(0, recentLogs.length - limit);
  return recentLogs.slice(start);
};
