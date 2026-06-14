import { WebSocketServer } from 'ws';
import { createRequire } from 'module';
import logger from '../utils/logger.js';

const require = createRequire(import.meta.url);
const { setupWSConnection } = require('y-websocket/bin/utils');

/**
 * Initializes a headless Yjs WebSocket server.
 * Bypasses MongoDB entirely for CRDT real-time sync.
 */
export function initCollaborationServer() {
  // 🔥 CRITICAL: noServer MUST be true. We do not bind to a port or HTTP server here.
  const wss = new WebSocketServer({ noServer: true });
  
  wss.on('connection', (ws, req) => {
    setupWSConnection(ws, req);
  });
  
  logger.info('✅ Yjs collaboration server initialized (headless)');
  
  // Return the instance so the traffic cop in server.js can route to it
  return wss;
}