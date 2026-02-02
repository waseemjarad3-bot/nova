import { Bot, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';
import { useState } from 'react';
import { AssistantConfig, VOICE_TONE_OPTIONS } from '../../config/assistantConfig';

interface AssistantInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    assistantConfig: AssistantConfig;
    handleUpdateAssistantConfig: (field: keyof AssistantConfig, value: string) => void;
}

const AssistantInfoModal: React.FC<AssistantInfoModalProps> = ({
    isOpen,
    onClose,
    assistantConfig,
    handleUpdateAssistantConfig
}) => {
    const { playClick } = useAudio();
    const [isExpanded, setIsExpanded] = useState(true);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-j-void/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
            <div className="w-full max-w-lg max-h-[95vh] bg-j-panel border border-j-magenta/30 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-[0_0_50px_rgba(255,0,128,0.2)] overflow-hidden relative z-10 animate-in zoom-in-95 duration-300 flex flex-col">
                <div className="p-5 sm:p-8 flex flex-col overflow-y-auto no-scrollbar">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-j-magenta/10 rounded-xl">
                                <Bot size={24} className="text-j-magenta" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Assistant Info</h2>
                                <p className="text-[10px] font-mono text-j-text-muted uppercase tracking-widest">AI Configuration File</p>
                            </div>
                        </div>
                        <button onClick={() => { playClick(); onClose(); }} className="p-2 hover:bg-white/5 rounded-full text-j-text-muted hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Expandable Section Header */}
                    <button
                        onClick={() => { playClick(); setIsExpanded(!isExpanded); }}
                        className="flex items-center justify-between w-full p-3 bg-j-surface/50 rounded-xl mb-4 hover:bg-j-surface/70 transition-all border border-white/5"
                    >
                        <span className="text-sm font-medium text-j-text-primary">Configure {assistantConfig.assistantName}</span>
                        {isExpanded ? <ChevronUp size={18} className="text-j-magenta" /> : <ChevronDown size={18} className="text-j-magenta" />}
                    </button>

                    {/* Expandable Content */}
                    <div className={`space-y-6 overflow-hidden transition-all duration-300 ease-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        {/* Assistant Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-j-text-muted uppercase tracking-widest pl-1">Assistant Name</label>
                            <input
                                type="text"
                                value={assistantConfig.assistantName}
                                onChange={(e) => handleUpdateAssistantConfig('assistantName', e.target.value)}
                                placeholder="e.g. Nova, Jarvis, Qadajo"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-j-text-primary focus:outline-none focus:border-j-magenta/50 transition-all shadow-inner"
                            />
                            <p className="text-[9px] text-j-text-muted pl-1">This name will update across the entire UI instantly</p>
                        </div>

                        {/* Wake Word */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-j-text-muted uppercase tracking-widest pl-1">Wake Word</label>
                            <input
                                type="text"
                                value={assistantConfig.wakeWord}
                                onChange={(e) => handleUpdateAssistantConfig('wakeWord', e.target.value.toLowerCase())}
                                placeholder="e.g. nova, jarvis, hey qadajo"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-j-text-primary focus:outline-none focus:border-j-magenta/50 transition-all shadow-inner"
                            />
                            <p className="text-[9px] text-j-text-muted pl-1">Say this word to activate the assistant</p>
                        </div>

                        {/* Voice Tone / Personality */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-j-text-muted uppercase tracking-widest pl-1">Voice Tone / Personality</label>
                            <div className="grid grid-cols-2 gap-2">
                                {VOICE_TONE_OPTIONS.map((tone) => (
                                    <button
                                        key={tone.id}
                                        onClick={() => { playClick(); handleUpdateAssistantConfig('voiceTone', tone.id); }}
                                        className={`p-3 rounded-xl border transition-all text-center ${assistantConfig.voiceTone === tone.id
                                            ? 'bg-j-magenta/20 border-j-magenta/50 text-j-magenta shadow-[0_0_15px_rgba(255,0,128,0.2)]'
                                            : 'bg-black/30 border-white/10 text-j-text-secondary hover:border-white/20 hover:text-j-text-primary'
                                            }`}
                                    >
                                        <div className="text-xs font-medium">{tone.label}</div>
                                        <div className="text-[8px] mt-1 opacity-70">{tone.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer Status */}
                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="text-[10px] font-mono text-j-text-muted uppercase">
                            Active Assistant: <span className="text-j-magenta font-bold">{assistantConfig.assistantName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-j-magenta uppercase">
                            <div className="w-1.5 h-1.5 bg-j-magenta rounded-full animate-pulse shadow-[0_0_5px_#FF0080]"></div>
                            Config Synced
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => { playClick(); onClose(); }}
                            className="px-10 py-3 bg-j-magenta text-white font-bold rounded-2xl hover:bg-j-magenta/80 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(255,0,128,0.3)] flex items-center gap-2"
                        >
                            Apply Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssistantInfoModal;
