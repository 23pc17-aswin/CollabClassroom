/**
 * useCollaboration — binds a Yjs document to a room via y-websocket.
 * Enables real-time collaborative editing in the Monaco workspace.
 * @module hooks/useCollaboration
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useEffect, useState } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export function useCollaboration(roomId) {
    // 🔥 FIXED: Store Y.Doc safely in state so it isn't recreated every render
    const [ydoc] = useState(() => new Y.Doc());
    const [provider, setProvider] = useState(null);
    const [awareness, setAwareness] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!roomId) return;

        const wsProvider = new WebsocketProvider(
            `${WS_URL}/collaboration`,
            roomId,
            ydoc
        );

        wsProvider.on('status', ({ status }) => {
            setIsConnected(status === 'connected');
        });

        setProvider(wsProvider);
        setAwareness(wsProvider.awareness);

        return () => {
            wsProvider.destroy();
            setProvider(null);
            setAwareness(null);
            setIsConnected(false);
        };
    }, [roomId, ydoc]);

    return { ydoc, provider, awareness, isConnected };
}

export default useCollaboration;