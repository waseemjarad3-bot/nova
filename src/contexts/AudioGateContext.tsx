import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AudioGateContextType {
    hasUserInteracted: boolean;
    enableAudio: () => void;
}

const AudioGateContext = createContext<AudioGateContextType>({
    hasUserInteracted: false,
    enableAudio: () => { },
});

export const useAudioGate = () => useContext(AudioGateContext);

interface AudioGateProviderProps {
    children: ReactNode;
}

export const AudioGateProvider: React.FC<AudioGateProviderProps> = ({ children }) => {
    const [hasUserInteracted, setHasUserInteracted] = useState(false);

    const enableAudio = useCallback(() => {
        if (!hasUserInteracted) {
            setHasUserInteracted(true);
            console.log('[AUDIO-GATE] User interaction detected, audio enabled.');
        }
    }, [hasUserInteracted]);

    return (
        <AudioGateContext.Provider value={{ hasUserInteracted, enableAudio }}>
            {children}
        </AudioGateContext.Provider>
    );
};
