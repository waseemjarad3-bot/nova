import React, { useState } from 'react';
import { X, Mic2, User, UserCheck, Play, Save, CheckCircle2 } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';

interface VoiceSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedVoice: string;
    onVoiceSelect: (voiceName: string) => void;
    volume: number;
    onVolumeChange: (volume: number) => void;
}

const VOICES = {
    male: [
        { id: 'Charon', name: 'Charon', desc: 'Informative & Deep' },
        { id: 'Fenrir', name: 'Fenrir', desc: 'Excitable & Bold' },
        { id: 'Puck', name: 'Puck', desc: 'Upbeat & Friendly' },
        { id: 'Iapetus', name: 'Iapetus', desc: 'Clear & Natural' }
    ],
    female: [
        { id: 'Aoede', name: 'Aoede', desc: 'Breezy & Natural' },
        { id: 'Kore', name: 'Kore', desc: 'Firm & Professional' },
        { id: 'Leda', name: 'Leda', desc: 'Youthful & Bright' },
        { id: 'Zephyr', name: 'Zephyr', desc: 'Bright & Clear' }
    ]
};

const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({ isOpen, onClose, selectedVoice, onVoiceSelect, volume, onVolumeChange }) => {
    const { playClick } = useAudio();
    const [tempSelected, setTempSelected] = useState(selectedVoice);
    const [tempVolume, setTempVolume] = useState(volume);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        playClick();
        setIsSaving(true);
        onVoiceSelect(tempSelected);
        onVolumeChange(tempVolume);

        // Simulate persistence feedback
        setTimeout(() => {
            setIsSaving(false);
            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                onClose();
            }, 1000);
        }, 500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="w-full max-w-2xl bg-j-panel border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-j-cyan/10 rounded-lg">
                            <Mic2 size={20} className="text-j-cyan" />
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-wide">Voice Synthesizer</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-j-text-secondary">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10">

                    {/* Volume Control */}
                    <section className="space-y-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Mic2 size={18} className="text-j-cyan opacity-80" />
                                <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Output Volume</h3>
                            </div>
                            <span className="text-j-cyan font-mono text-xs">{Math.round(tempVolume * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={tempVolume}
                            onChange={(e) => setTempVolume(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-j-cyan"
                        />
                        <div className="flex justify-between text-[10px] text-j-text-secondary uppercase tracking-tighter">
                            <span>Muted</span>
                            <span>Optimal</span>
                            <span>Max Output</span>
                        </div>
                    </section>

                    {/* Male Voices */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <User size={18} className="text-j-cyan opacity-80" />
                            <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Male Archetypes</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {VOICES.male.map(voice => (
                                <button
                                    key={voice.id}
                                    onClick={() => { playClick(); setTempSelected(voice.id); }}
                                    className={`p-4 rounded-xl border transition-all text-left flex items-center justify-between group ${tempSelected === voice.id
                                        ? 'bg-j-cyan/10 border-j-cyan/50 shadow-[0_0_20px_rgba(0,229,255,0.1)]'
                                        : 'bg-j-surface/30 border-white/5 hover:border-white/20'
                                        }`}
                                >
                                    <div>
                                        <p className={`font-bold ${tempSelected === voice.id ? 'text-j-cyan' : 'text-white'}`}>{voice.name}</p>
                                        <p className="text-[10px] text-j-text-secondary">{voice.desc}</p>
                                    </div>
                                    {tempSelected === voice.id ? <UserCheck size={18} className="text-j-cyan" /> : <Play size={16} className="text-j-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Female Voices */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <User size={18} className="text-j-magenta opacity-80" />
                            <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Female Archetypes</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {VOICES.female.map(voice => (
                                <button
                                    key={voice.id}
                                    onClick={() => { playClick(); setTempSelected(voice.id); }}
                                    className={`p-4 rounded-xl border transition-all text-left flex items-center justify-between group ${tempSelected === voice.id
                                        ? 'bg-j-magenta/10 border-j-magenta/50 shadow-[0_0_20px_rgba(255,0,255,0.1)]'
                                        : 'bg-j-surface/30 border-white/5 hover:border-white/20'
                                        }`}
                                >
                                    <div>
                                        <p className={`font-bold ${tempSelected === voice.id ? 'text-j-magenta' : 'text-white'}`}>{voice.name}</p>
                                        <p className="text-[10px] text-j-text-secondary">{voice.desc}</p>
                                    </div>
                                    {tempSelected === voice.id ? <UserCheck size={18} className="text-j-magenta" /> : <Play size={16} className="text-j-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white/[0.02] border-t border-white/10 flex items-center justify-between">
                    <p className="text-[10px] text-j-text-secondary italic">Selected voice will be applied instantly to Nova's neural core.</p>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || saved}
                        className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${saved
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-j-cyan text-j-void hover:bg-j-cyan/90 disabled:opacity-50'
                            }`}
                    >
                        {isSaving ? <Save size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                        <span>{saved ? 'Applied' : 'Apply Voice'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoiceSettingsModal;
