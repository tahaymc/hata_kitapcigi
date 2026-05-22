import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  WAMessage,
  WASocket,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { EventEmitter } from 'events';
import { logger } from '../logger';
import { config } from '../config/env';
import pino from 'pino';
import qrcode from 'qrcode';
import path from 'path';
import fs from 'fs/promises';
import { setStatus, setQr, setJid, setDisconnect, incStat } from '../state';
import { getCachedSettings } from '../services/settingsClient';

export const whatsappEvents = new EventEmitter();
const baileysLogger = pino({ level: 'silent' });

let sock: WASocket | null = null;

const getMessageImage = (msg: WAMessage) => {
  const message = msg.message;
  if (!message) return null;

  if (message.imageMessage) return message.imageMessage;
  if (message.viewOnceMessageV2?.message?.imageMessage) return message.viewOnceMessageV2.message.imageMessage;
  if (message.documentMessage?.mimetype?.startsWith('image/')) return message.documentMessage;

  return null;
};

export const connectToWhatsApp = async (): Promise<WASocket> => {
  logger.info('Initializing WhatsApp connection...');
  setStatus('connecting');

  const { state, saveCreds } = await useMultiFileAuthState(config.whatsapp.sessionDir);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  logger.info(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

  sock = makeWASocket({
    version,
    logger: baileysLogger as any,
    printQRInTerminal: false,
    auth: state,
    generateHighQualityLinkPreview: true,
    markOnlineOnConnect: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      const qrPath = path.join(process.cwd(), 'qr.png');
      try {
        await qrcode.toFile(qrPath, qr);
        const dataUrl = await qrcode.toDataURL(qr);
        setQr(dataUrl);
        logger.info(`QR Code saved at ${qrPath} and exposed via /qr`);
      } catch (err) {
        logger.error('Failed to render QR Code', err);
      }
      whatsappEvents.emit('qr', qr);
    }

    if (connection === 'close') {
      const error = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = error !== DisconnectReason.loggedOut;
      logger.error(`Connection closed due to error: ${error}, reconnecting: ${shouldReconnect}`);
      setDisconnect(error || null, lastDisconnect?.error?.message);

      if (shouldReconnect) {
        setStatus('disconnected');
        connectToWhatsApp();
      } else {
        setStatus('logged_out');
        logger.error('Logged out from WhatsApp. Delete the session folder and re-scan QR.');
      }
      whatsappEvents.emit('disconnected', { reason: error, shouldReconnect });
    } else if (connection === 'open') {
      logger.info('Successfully connected to WhatsApp!');
      setStatus('connected');
      setJid(sock?.user?.id || null);
      whatsappEvents.emit('connected');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    const settings = getCachedSettings();

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const remoteJid = msg.key.remoteJid;
      if (!remoteJid) continue;

      const isGroup = remoteJid.endsWith('@g.us') || remoteJid === 'status@broadcast';
      if (isGroup && !settings.listen_groups) continue;

      incStat('messagesSeen');
      logger.info(`Received message from ${remoteJid}`);

      const imageMessage = getMessageImage(msg);
      if (imageMessage) {
        logger.info(`Detected Image message from ${remoteJid}`);
        whatsappEvents.emit('image-received', { msg, remoteJid, imageMessage });
      } else {
        whatsappEvents.emit('text-received', { msg, remoteJid });
      }
    }
  });

  return sock;
};

export const getSocket = () => sock;

export const logoutAndReset = async (): Promise<void> => {
  try {
    if (sock) {
      try {
        await sock.logout();
      } catch (e) {
        logger.warn('Logout request failed, continuing with session wipe.');
      }
    }
  } finally {
    sock = null;
    try {
      await fs.rm(config.whatsapp.sessionDir, { recursive: true, force: true });
      logger.info('Session directory wiped.');
    } catch (e) {
      logger.error('Failed to wipe session directory', e);
    }
    setStatus('logged_out');
    setJid(null);
    setQr(null);
  }
};

export const restartSocket = async (): Promise<void> => {
  if (sock) {
    try {
      sock.end(undefined);
    } catch {
      /* ignore */
    }
  }
  sock = null;
  setStatus('connecting');
  await connectToWhatsApp();
};
