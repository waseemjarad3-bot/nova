import React from 'react';
import { Send, Paperclip, RotateCcw } from 'lucide-react';
import { ConnectionStatus } from '../../types';
import { useAudio } from '../../hooks/useAudio';

interface MobileChatPanelProps {
    messages: any[];
    status: ConnectionStatus;
    chatInput: string;
    setChatInput: (input: string) => void;
    handleSendChat: () => void;
    handleNativeFileSelect: () => void;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    thinkingEnabled?: boolean;
    setThinkingEnabled?: (enabled: boolean) => void;
    currentOutput?: string;
    assistantName?: string;
}

const MobileChatPanel: React.FC<MobileChatPanelProps> = ({
    messages,
    status,
    chatInput,
    setChatInput,
    handleSendChat,
    handleNativeFileSelect,
    messagesEndRef,
    thinkingEnabled,
    setThinkingEnabled,
    currentOutput,
    assistantName = 'M'
}) => {
    const { playClick } = useAudio();
    const isConnected = status === ConnectionStatus.CONNECTED;

    return (
        <div className="flex flex-col h-full bg-j-panel/60 rounded-xl border border-white/[0.06] overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-j-cyan uppercase tracking-[0.2em]">SYSTEM_TRANSCRIPTION</span>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[9px] font-mono">
                        <span className="text-j-text-muted">■</span>
                        <span className="text-j-text-secondary">CHAT</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-mono">
                        <span className="text-j-text-muted">LOGS</span>
                    </div>
                    <div className="px-2 py-0.5 bg-j-cyan/20 rounded text-[8px] font-mono text-j-cyan border border-j-cyan/30">
                        LOGS
                    </div>
                </div>

                {/* Deep Researching Toggle */}
                <div className="flex items-center justify-between mt-3 p-2 bg-j-surface/40 rounded-lg border border-white/[0.04]">
                    <span className="text-[9px] font-mono text-j-text-secondary uppercase tracking-wide">■ DEEP_RESEARCHING</span>
                    <button
                        onClick={() => { playClick(); setThinkingEnabled?.(!thinkingEnabled); }}
                        className={`w-10 h-5 rounded-full relative transition-all ${thinkingEnabled ? 'bg-j-cyan/30 border border-j-cyan/50' : 'bg-j-surface border border-white/10'
                            }`}
                    >
                        <div className={`w-4 h-4 rounded-full absolute top-0.5 transition-all ${thinkingEnabled ? 'right-0.5 bg-j-cyan shadow-[0_0_10px_rgba(0,229,255,0.5)]' : 'left-0.5 bg-j-text-muted'
                            }`} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
                {messages.length === 0 && (
                    <div className="text-center text-j-text-muted text-[10px] font-mono py-4">
                        AWAITING INPUT...
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] font-mono text-j-cyan uppercase">
                                ■ {msg.role === 'user' ? 'USER_COMD' : `${assistantName}_RESPONSE`}
                            </span>
                        </div>
                        <div className={`p-3 rounded-lg text-[11px] font-mono leading-relaxed ${msg.role === 'user'
                            ? 'bg-j-surface/60 text-j-text-secondary border-l-2 border-j-text-muted/30'
                            : 'bg-j-surface/40 text-j-text-primary border-l-2 border-j-cyan/30'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {currentOutput && (
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] font-mono text-j-amber uppercase animate-pulse">
                                ■ {assistantName}_RESPONSE
                            </span>
                        </div>
                        <div className="p-3 rounded-lg text-[11px] font-mono leading-relaxed bg-j-surface/40 text-j-text-primary border-l-2 border-j-amber/30">
                            {currentOutput}
                            <span className="inline-block w-2 h-3 bg-j-cyan ml-1 animate-pulse" />
                        </div>
                    </div>
                )}

                {/* Status */}
                {messages.length > 0 && !currentOutput && (
                    <div className="pt-2">
                        <span className="text-[8px] font-mono text-j-text-muted uppercase tracking-wide">
                            MESSAGING COMPLETE
                        </span>
                        <p className="text-[9px] font-mono text-j-text-muted/70 mt-1 leading-relaxed">
                            *Processing initial request.* I've just processed the initial system request and I'm ready to assist with deeper inquiries...
                        </p>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Command */}
            <div className="p-3 border-t border-white/[0.06] mt-auto">
                <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-j-surface/60 rounded-full border border-white/[0.08] px-3 py-2">
                        <Paperclip
                            size={14}
                            className="text-j-text-muted cursor-pointer hover:text-j-cyan transition-colors"
                            onClick={() => { playClick(); handleNativeFileSelect(); }}
                        />
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                            placeholder="TYPE_COMMAND_HERE..."
                            className="flex-1 bg-transparent text-[10px] font-mono text-j-text-secondary placeholder:text-j-text-muted/50 focus:outline-none"
                        />
                    </div>
                    <button
                        onClick={() => { playClick(); handleSendChat(); }}
                        disabled={!isConnected}
                        className={`p-2 rounded-full transition-all ${isConnected
                            ? 'bg-j-cyan/20 text-j-cyan border border-j-cyan/30 hover:bg-j-cyan/30'
                            : 'bg-j-surface text-j-text-muted border border-white/10'
                            }`}
                    >
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileChatPanel;
