/**
 * ParticipantList — shows real-time participants from Yjs awareness state.
 * @module components/collaboration/ParticipantList
 */

import { useState, useEffect } from 'react';
import Badge from '../ui/Badge';

/**
 * @param {{ awareness: import('y-protocols/awareness').Awareness | null }} props
 */
export default function ParticipantList({ awareness }) {
    const [participants, setParticipants] = useState([]);

    useEffect(() => {
        if (!awareness) return;

        const update = () => {
            const states = Array.from(awareness.getStates().entries()).map(([clientId, state]) => ({
                clientId,
                ...state.user,
            }));
            setParticipants(states);
        };

        awareness.on('change', update);
        update();

        return () => awareness.off('change', update);
    }, [awareness]);

    if (participants.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-chalk-400 text-sm text-center px-4">
                    Waiting for participants to join...
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {participants.map((p) => (
                <div
                    key={p.clientId}
                    className="flex items-center gap-3 bg-navy-700/50 rounded-lg px-3 py-2 border border-white/5"
                >
                    {/* Online indicator */}
                    <div className="relative flex-shrink-0">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2"
                            style={{ backgroundColor: `${p.color}20`, borderColor: p.color || '#F59E0B', color: p.color || '#F59E0B' }}
                        >
                            {(p.name || 'U').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-navy-800" />
                    </div>

                    {/* Name + role */}
                    <div className="min-w-0 flex-1">
                        <p className="text-chalk-200 text-sm font-medium truncate">{p.name || 'Unknown'}</p>
                        {p.role && <Badge role={p.role} className="mt-0.5" />}
                    </div>
                </div>
            ))}
        </div>
    );
}
