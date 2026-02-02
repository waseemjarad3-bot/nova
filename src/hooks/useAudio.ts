import { useCallback } from 'react';
import { useAudioGate } from '../contexts/AudioGateContext';

export const useAudio = () => {
  const { hasUserInteracted } = useAudioGate();

  const playSound = useCallback((path: string, volume: number = 0.5) => {
    // Gate: Only play audio if user has interacted
    if (!hasUserInteracted) {
      return; // Silent skip - no error logging for autoplay restrictions
    }
    try {
      const audio = new Audio(path);
      audio.volume = volume;
      audio.play().catch(() => {
        // Silent fail - user interaction may still be pending
      });
    } catch (err) {
      // Silent fail
    }
  }, [hasUserInteracted]);

  const playClick = useCallback(() => {
    playSound('audio/button.wav', 0.4);
  }, [playSound]);


  return { playSound, playClick, isMuted: false, toggleMute: () => { } };
};
