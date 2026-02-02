/**
 * API Client Utility
 * Handles abstraction between Electron IPC and Web Storage (localStorage)
 * to ensure the app works in both environments.
 */

const isElectron = !!(window as any).electronAPI;
const electronAPI = (window as any).electronAPI;

// Helper to simulate delay like IPC
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fallback Web Storage API
const webAPI = {
    invoke: async (channel: string, data?: any) => {
        console.log(`[WebAPI] Invoking: ${channel}`, data);

        switch (channel) {
            case 'load-memories':
                return JSON.parse(localStorage.getItem('nova_memories') || '[]');
            case 'save-memories':
                localStorage.setItem('nova_memories', JSON.stringify(data));
                return { success: true };

            case 'load-notes':
                return JSON.parse(localStorage.getItem('nova_notes') || '[]');
            case 'save-notes':
                localStorage.setItem('nova_notes', JSON.stringify(data));
                return { success: true };

            case 'load-tasks':
                return JSON.parse(localStorage.getItem('nova_tasks') || '[]');
            case 'save-tasks':
                localStorage.setItem('nova_tasks', JSON.stringify(data));
                return { success: true };

            case 'load-user-profile':
                return JSON.parse(localStorage.getItem('nova_user_profile') || '{}');
            case 'save-user-profile':
                localStorage.setItem('nova_user_profile', JSON.stringify(data));
                return { success: true };

            case 'load-dashboard-settings':
                return JSON.parse(localStorage.getItem('nova_dashboard_settings') || '{"interests": ["Tech", "Global Economy"], "refreshInterval": 3600}');
            case 'save-dashboard-settings':
                localStorage.setItem('nova_dashboard_settings', JSON.stringify(data));
                return { success: true };

            case 'load-history':
                return JSON.parse(localStorage.getItem('nova_history') || '[]');
            case 'save-history':
                localStorage.setItem('nova_history', JSON.stringify(data));
                return { success: true };

            case 'get-gemini-token':
                return localStorage.getItem('nova_gemini_token') || '';
            case 'save-gemini-token':
                localStorage.setItem('nova_gemini_token', data);
                return { success: true };

            case 'load-voice-config':
                return JSON.parse(localStorage.getItem('nova_voice_config') || '{"voiceName": "Charon", "volume": 0.8}');
            case 'save-voice-config':
                localStorage.setItem('nova_voice_config', JSON.stringify(data));
                return { success: true };

            case 'load-assistant-config':
                return JSON.parse(localStorage.getItem('nova_assistant_config') || '{"assistantName": "Nova", "voiceTone": "Friendly"}');
            case 'save-assistant-config':
                localStorage.setItem('nova_assistant_config', JSON.stringify(data));
                return { success: true };

            // Desktop-only features returning harmless fallbacks on Web
            case 'initialize-vault':
                return { vaultBase: 'Web Storage' };
            case 'load-imported-folders':
                return [];
            case 'stop-wake-word':
            case 'start-wake-word':
                return { status: 'unsupported' };

            default:
                console.warn(`[WebAPI] Unhandled channel: ${channel}`);
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
    invoke: async (channel: string, data?: any) => {
        if (isElectron) {
            return await electronAPI.invoke(channel, data);
        } else {
            await delay(50); // Simulate network/ipc delay
            return await webAPI.invoke(channel, data);
        }
    },
    on: (channel: string, callback: Function) => {
        if (isElectron) {
            return electronAPI.on(channel, callback);
        } else {
            return webAPI.on(channel, callback);
        }
    }
};
