/**
 * API Client Utility
 * Handles abstraction between Electron IPC and Web Storage (localStorage)
 * to ensure the app works in both environments.
 */

const isElectron =
    typeof window !== 'undefined' &&
    !!(window as any).electronAPI;

const isBrowser = !isElectron;

const electronAPI =
    typeof window !== 'undefined'
        ? (window as any).electronAPI
        : null;

// Helper to simulate delay like IPC
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fallback Web Storage API
const webAPI = {
    invoke: async (channel: string, data?: any) => {
        console.log(`[WebAPI] Invoking: ${channel}`, data);

        const safeGet = (key: string) => {
            try { return localStorage.getItem(key); } catch (e) { return null; }
        };
        const safeSet = (key: string, val: any) => {
            try { localStorage.setItem(key, val); } catch (e) { }
        };

        try {
            switch (channel) {
                case 'load-memories':
                    return JSON.parse(safeGet('nova_memories') || '[]');
                case 'save-memories':
                    safeSet('nova_memories', JSON.stringify(data));
                    return { success: true };

                case 'load-notes':
                    return JSON.parse(safeGet('nova_notes') || '[]');
                case 'save-notes':
                    safeSet('nova_notes', JSON.stringify(data));
                    return { success: true };

                case 'load-tasks':
                    return JSON.parse(safeGet('nova_tasks') || '[]');
                case 'save-tasks':
                    safeSet('nova_tasks', JSON.stringify(data));
                    return { success: true };

                case 'load-user-profile':
                    return JSON.parse(safeGet('nova_user_profile') || '{}');
                case 'save-user-profile':
                    safeSet('nova_user_profile', JSON.stringify(data));
                    return { success: true };

                case 'load-dashboard-settings':
                    return JSON.parse(safeGet('nova_dashboard_settings') || '{"interests": ["Tech", "Global Economy"], "refreshInterval": 3600}');
                case 'save-dashboard-settings':
                    safeSet('nova_dashboard_settings', JSON.stringify(data));
                    return { success: true };

                case 'load-history':
                    return JSON.parse(safeGet('nova_history') || '[]');
                case 'save-history':
                    safeSet('nova_history', JSON.stringify(data));
                    return { success: true };

                case 'load-history-settings':
                    return JSON.parse(safeGet('nova_history_settings') || '{"maxContextMessages": 20, "storeHistory": true}');
                case 'save-history-settings':
                    safeSet('nova_history_settings', JSON.stringify(data));
                    return { success: true };

                case 'get-gemini-token':
                    return safeGet('nova_gemini_token') || '';
                case 'save-gemini-token':
                    safeSet('nova_gemini_token', data);
                    return { success: true };

                case 'load-voice-config':
                    return JSON.parse(safeGet('nova_voice_config') || '{"voiceName": "Charon", "volume": 0.8}');
                case 'save-voice-config':
                    safeSet('nova_voice_config', JSON.stringify(data));
                    return { success: true };

                case 'load-assistant-config':
                    return JSON.parse(safeGet('nova_assistant_config') || '{"assistantName": "Nova", "voiceTone": "Friendly"}');
                case 'save-assistant-config':
                    safeSet('nova_assistant_config', JSON.stringify(data));
                    return { success: true };

                case 'load-imported-folders':
                    return [];
                case 'initialize-vault':
                    return { vaultBase: 'Web Storage' };
                case 'pick-folder':
                case 'pick-and-read-files':
                case 'system-open':
                case 'stop-wake-word':
                case 'start-wake-word':
                case 'get-app-version':
                    return null;

                default:
                    console.warn(`[WebAPI] Unhandled channel: ${channel}`);
                    return null;
            }
        } catch (err) {
            console.error(`[WebAPI] Critical Error in ${channel}:`, err);
            return null;
        }
    },

    on: (channel: string, callback: Function) => {
        console.log(`[WebAPI] Subscribing to: ${channel} (Web dummy)`);
        return () => { }; // No-op cleanup
    }
};

export const apiClient = {
    isElectron,
    isBrowser,
    invoke: async (channel: string, data?: any) => {
        if (isElectron && electronAPI) {
            return await electronAPI.invoke(channel, data);
        } else {
            await delay(50); // Simulate network/ipc delay
            return await webAPI.invoke(channel, data);
        }
    },
    on: (channel: string, callback: Function) => {
        if (isElectron && electronAPI) {
            return electronAPI.on(channel, callback);
        } else {
            return webAPI.on(channel, callback);
        }
    }
};
