/**
 * Unified Zustand application store.
 * Manages user profile, classrooms, and UI state.
 * @module store/useAppStore
 */

import { create } from 'zustand';

const useAppStore = create((set) => ({
    // ── User ────────────────────────────────────────────────────
    /** @type {{ id: string, name: string, email: string, role: string, userId: string } | null} */
    userProfile: null,
    /** @param {object} profile */
    setUserProfile: (profile) => set({ userProfile: profile }),

    // ── Classrooms ───────────────────────────────────────────────
    /** @type {Array} */
    classrooms: [],
    /** @param {Array} classrooms */
    setClassrooms: (classrooms) => set({ classrooms }),

    /** @type {object | null} */
    activeClassroom: null,
    /** @param {object} classroom */
    setActiveClassroom: (classroom) => set({ activeClassroom: classroom }),

    // ── UI State ─────────────────────────────────────────────────
    isSidebarOpen: true,
    toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),

    /** @type {Array<{ id: string, type: string, message: string }>} */
    notifications: [],

    /**
     * Adds a notification to the queue.
     * @param {{ id?: string, type?: string, message: string }} notification
     */
    addNotification: (n) =>
        set((s) => ({
            notifications: [
                ...s.notifications,
                { id: Date.now().toString(), type: 'info', ...n },
            ],
        })),

    /**
     * Removes a notification by id.
     * @param {string} id
     */
    removeNotification: (id) =>
        set((s) => ({
            notifications: s.notifications.filter((n) => n.id !== id),
        })),
}));

export default useAppStore;
