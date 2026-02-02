import React from 'react';
import { Mic, MicOff } from 'lucide-react';

interface MicMuteButtonProps {
    isMicMuted: boolean;
    toggleMicMute: () => void;
}

const MicMuteButton: React.FC<MicMuteButtonProps> = ({ isMicMuted, toggleMicMute }) => {
    return (
        <button
            onClick={toggleMicMute}
            className={`
                p-2 rounded-full border text-[10px] font-mono transition-all uppercase tracking-[0.2em] font-bold shadow-lg
                ${isMicMuted
                    ? 'border-j-crimson/50 text-j-crimson bg-j-crimson/10 hover:bg-j-crimson hover:text-white shadow-j-crimson/20'
                    : 'border-j-steel/30 text-j-text-muted hover:bg-j-steel/50 hover:text-white'
                }
            `}
            title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
            {isMicMuted ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
    );
};

export default MicMuteButton;
