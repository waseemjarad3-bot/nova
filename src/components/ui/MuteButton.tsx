import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';

const MuteButton: React.FC = () => {
    const { isMuted, toggleMute, playClick } = useAudio();

    const handleClick = () => {
        playClick();
        toggleMute();
    };

    return (
        <button
            onClick={handleClick}
            className={`
                absolute bottom-6 right-6 p-3 rounded-full transition-all duration-300
                ${isMuted
                    ? 'bg-j-crimson/80 text-white shadow-[0_0_15px_rgba(220,20,60,0.5)] hover:bg-j-crimson'
                    : 'bg-j-green/80 text-white shadow-[0_0_15px_rgba(45,212,191,0.5)] hover:bg-j-green'
                }
            `}
            title={isMuted ? "Unmute system audio" : "Mute system audio"}
        >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
    );
};

export default MuteButton;
