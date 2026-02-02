import React, { useState, useEffect, useRef } from 'react';

interface LoadingScreenProps {
    onFinished?: () => void;
    assistantName?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinished, assistantName = 'NOVA' }) => {
    const [progress, setProgress] = useState(0);
    const [activeStatus, setActiveStatus] = useState("INITIALIZING KERNEL...");
    const audioLoadingRef = useRef<HTMLAudioElement>(null);
    const audioFinishedRef = useRef<HTMLAudioElement>(null);

    // Tech-heavy statuses
    const systems = [
        "BIOS_CHECK :: OK",
        "LOADING_NEURAL_NETWORKS...",
        "DECRYPTING_USER_VAULT...",
        "ESTABLISHING_SECURE_LINK...",
        "OPTIMIZING_MEMORY_SHARDS...",
        "LOADING_CORE_MODULES...",
        "SYSTEM_READY"
    ];

    useEffect(() => {
        // Attempt audio play
        if (audioLoadingRef.current) {
            audioLoadingRef.current.volume = 0.7;
            audioLoadingRef.current.play().catch(console.error);
        }


        let currentProgress = 0;
        const interval = setInterval(() => {
            // "Heavy" loading simulation: simpler logic but feels weighty
            // Random increment between 0.5 and 2.5
            // Doubled speed: random increment between 1.0 and 5.0
            const increment = Math.random() * 4 + 1.0;
            currentProgress += increment;

            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(interval);
                handleCompletion();
            }

            setProgress(currentProgress);

            // Update status text based on progress chunks
            const statusIndex = Math.floor((currentProgress / 100) * (systems.length - 1));
            setActiveStatus(systems[statusIndex]);

        }, 100);

        return () => clearInterval(interval);
    }, []);

    const handleCompletion = () => {
        if (audioLoadingRef.current) {
            // Fade out loading sound
            const fadeOut = setInterval(() => {
                if (audioLoadingRef.current && audioLoadingRef.current.volume > 0.05) {
                    audioLoadingRef.current.volume -= 0.05;
                } else {
                    clearInterval(fadeOut);
                    audioLoadingRef.current?.pause();
                }
            }, 100);
        }

        if (audioFinishedRef.current) {
            audioFinishedRef.current.volume = 0.8;
            audioFinishedRef.current.play().catch(console.error);
        }

        setTimeout(() => {
            if (onFinished) onFinished();
        }, 750); // Reduced delay to 0.75s for faster entry
    };

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020406] text-white overflow-hidden font-mono select-none cursor-wait">

            {/* Ambient Audio */}
            <audio ref={audioLoadingRef} loop>
                <source src="audio/loading.wav" type="audio/wav" />
            </audio>
            <audio ref={audioFinishedRef}>
                <source src="audio/access_granted.wav" type="audio/wav" />
            </audio>


            {/* Background Texture (Scanlines & Vignette) */}
            <div className="absolute inset-0 bg-scan-line opacity-20 pointer-events-none"></div>
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#000000] opacity-80 pointer-events-none"></div>

            {/* Main Content Container */}
            <div className="relative z-10 flex flex-col items-center w-[400px]">

                {/* Header / Logo Text */}
                <div className="mb-12 flex flex-col items-center group">
                    <img
                        src="logo.jpg"
                        alt={`${assistantName} Logo`}
                        className="w-48 h-48 mb-6 object-contain rounded-2xl opacity-100 group-hover:scale-105 transition-all duration-700"
                    />
                    <h1 className="text-4xl font-bold tracking-[0.3em] text-white animate-glitch" data-text={assistantName.toUpperCase()}>
                        {assistantName.toUpperCase()}
                    </h1>
                    <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent mt-4 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full mb-2">
                    <div className="flex justify-between text-[10px] text-[#00E5FF]/60 mb-1 tracking-widest">
                        <span>SYS.LOAD</span>
                        <span>{progress.toFixed(1)}%</span>
                    </div>

                    {/* The Bar */}
                    <div className="w-full h-[2px] bg-[#111] relative overflow-hidden">
                        <div
                            className="absolute top-0 left-0 h-full bg-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.6)] transition-all duration-100 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Status Text (Typing/Flicker Effect) */}
                <div className="w-full flex justify-start h-6">
                    <span className="text-[10px] text-[#00E5FF]/80 font-mono tracking-widest uppercase animate-pulse">
                        {'>'} {activeStatus}
                    </span>
                </div>

            </div>

            {/* Footer / System Info */}
            <div className="absolute bottom-10 w-full px-12 flex justify-between items-end opacity-40 text-[9px] text-[#00E5FF]/50 tracking-[0.2em] font-mono">
                <div className="flex flex-col gap-1">
                    <span>HOST: LOCALHOST</span>
                    <span>PORT: SECURE:443</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span>ID: 8X-992-AZ</span>
                    <span>VER: 2.4.0-NIGHTLY</span>
                </div>
            </div>

        </div>
    );
};

export default LoadingScreen;
