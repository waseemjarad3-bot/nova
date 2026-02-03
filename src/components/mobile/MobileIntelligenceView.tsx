import React from 'react';
import { Clock, Settings, Mic2 } from 'lucide-react';
import DotGlobe from '../DotGlobe';
import { ConnectionStatus } from '../../types';
import { useAudio } from '../../hooks/useAudio';
import MobileSidebarControls from './MobileSidebarControls';
import MobileChatPanel from './MobileChatPanel';
import MobileVisualHub from './MobileVisualHub';

interface MobileIntelligenceViewProps {
    // Connection & AI State
    status: ConnectionStatus;
    isAISpeaking: boolean;
    analyser: any;
    micAnalyser: any;
    handleStartStop: () => void;

    // Tab State
    activeTab: string;
    setActiveTab: (tab: string) => void;

    // Modal Openers
    setIsMemoryModalOpen: (open: boolean) => void;
    setIsHistoryModalOpen: (open: boolean) => void;
    setIsUserModalOpen: (open: boolean) => void;
    setIsAssistantInfoModalOpen: (open: boolean) => void;
    setIsVoiceModalOpen: (open: boolean) => void;
    setIsSettingsModalOpen: (open: boolean) => void;

    // Chat State
    messages: any[];
    chatInput: string;
    setChatInput: (input: string) => void;
    handleSendChat: () => void;
    handleNativeFileSelect: () => void;
    attachedFiles: any[];
    removeFile: (idx: number) => void;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;

    // Thinking Mode
    thinkingEnabled?: boolean;
    setThinkingEnabled?: (enabled: boolean) => void;
    currentOutput?: string;

    // Visual Hub
    isVisualHubExpanded: boolean;
    setIsVisualHubExpanded: (expanded: boolean) => void;
    generatedImage: string | null;
    generatedDiagram: string | null;
    isVisualizing: boolean;

    // Config
    assistantName?: string;
}

const MobileIntelligenceView: React.FC<MobileIntelligenceViewProps> = ({
    status,
    isAISpeaking,
    analyser,
    micAnalyser,
    handleStartStop,
    activeTab,
    setActiveTab,
    setIsMemoryModalOpen,
    setIsHistoryModalOpen,
    setIsUserModalOpen,
    setIsAssistantInfoModalOpen,
    setIsVoiceModalOpen,
    setIsSettingsModalOpen,
    messages,
    chatInput,
    setChatInput,
    handleSendChat,
    handleNativeFileSelect,
    attachedFiles,
    removeFile,
    messagesEndRef,
    thinkingEnabled,
    setThinkingEnabled,
    currentOutput,
    isVisualHubExpanded,
    setIsVisualHubExpanded,
    generatedImage,
    generatedDiagram,
    isVisualizing,
    assistantName = 'M'
}) => {
    const { playClick } = useAudio();
    const isConnected = status === ConnectionStatus.CONNECTED;

    return (
        <div className="flex flex-col h-screen w-screen bg-j-void overflow-hidden">
            {/* Header */}
            <header className="h-14 border-b border-white/[0.05] flex items-center justify-between px-3 shrink-0 bg-j-panel/80 backdrop-blur-xl">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden">
                        <img src="logo.jpg" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex items-center">
                        <span className="text-sm font-bold text-white tracking-wide">MJ</span>
                        <span className="text-[10px] text-j-cyan font-medium ml-2 tracking-wide">Your Second Brain</span>
                        <span className="text-sm ml-1">🧠</span>
                        <span className="text-[10px] text-j-cyan font-bold ml-1">W2J</span>
                    </div>
                </div>

                {/* Right Icons */}
                <div className="flex items-center gap-2">
                    <button className="p-2 text-j-text-secondary hover:text-j-cyan transition-colors">
                        <Clock size={18} />
                    </button>
                    <button
                        onClick={() => { playClick(); setIsSettingsModalOpen(true); }}
                        className="p-2 text-j-text-secondary hover:text-j-cyan transition-colors"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex justify-center py-2 bg-j-void/80 border-b border-white/[0.03]">
                <div className="flex bg-j-surface/50 rounded-lg overflow-hidden border border-white/[0.08]">
                    {['Intelligence', 'Notes', 'Tasks'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { playClick(); setActiveTab(tab.toLowerCase()); }}
                            className={`px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-all ${activeTab === tab.toLowerCase()
                                ? 'bg-j-cyan/15 text-j-cyan shadow-[inset_0_0_10px_rgba(0,229,255,0.1)]'
                                : 'text-j-text-muted hover:text-j-text-secondary'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content - Two Columns */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left Column - Brain + Controls */}
                <div className="w-[45%] flex flex-col p-3 border-r border-white/[0.03] overflow-y-auto no-scrollbar">
                    {/* Brain Visualization */}
                    <div className="flex-shrink-0 flex flex-col items-center mb-4">
                        <div className="relative">
                            <DotGlobe
                                isSpeaking={isAISpeaking}
                                isConnected={isConnected}
                                isConnecting={status === ConnectionStatus.CONNECTING}
                                analyser={analyser}
                                micAnalyser={micAnalyser}
                                size={140}
                            />
                            {/* Decorative ring */}
                            <div className={`absolute inset-[-8px] border border-dashed border-j-cyan/20 rounded-full ${isConnected ? 'animate-spin-slow' : ''
                                }`} />
                        </div>
                    </div>

                    {/* Sidebar Controls */}
                    <MobileSidebarControls
                        setIsMemoryModalOpen={setIsMemoryModalOpen}
                        setIsHistoryModalOpen={setIsHistoryModalOpen}
                        setIsUserModalOpen={setIsUserModalOpen}
                        setIsAssistantInfoModalOpen={setIsAssistantInfoModalOpen}
                        handleNativeFileSelect={handleNativeFileSelect}
                    />

                    {/* Visual Hub Button */}
                    <div className="mt-4">
                        <MobileVisualHub
                            isExpanded={isVisualHubExpanded}
                            onToggleExpand={() => setIsVisualHubExpanded(!isVisualHubExpanded)}
                            generatedImage={generatedImage}
                            generatedDiagram={generatedDiagram}
                            isVisualizing={isVisualizing}
                        />
                    </div>
                </div>

                {/* Right Column - Chat Panel */}
                <div className="flex-1 flex flex-col p-3 overflow-hidden">
                    <MobileChatPanel
                        messages={messages}
                        status={status}
                        chatInput={chatInput}
                        setChatInput={setChatInput}
                        handleSendChat={handleSendChat}
                        handleNativeFileSelect={handleNativeFileSelect}
                        messagesEndRef={messagesEndRef}
                        thinkingEnabled={thinkingEnabled}
                        setThinkingEnabled={setThinkingEnabled}
                        currentOutput={currentOutput}
                        assistantName={assistantName}
                    />
                </div>
            </main>

            {/* Bottom Input Bar */}
            <div className="h-16 border-t border-white/[0.05] flex items-center justify-between px-3 bg-j-panel/80 backdrop-blur-xl">
                <button
                    onClick={() => { playClick(); }}
                    className="p-2 text-j-text-muted hover:text-j-cyan transition-colors"
                >
                    <Mic2 size={20} />
                </button>

                <div className="flex-1 flex items-center mx-3 bg-j-surface/60 rounded-full border border-white/[0.08] px-4 py-2">
                    <span className="text-[10px] font-mono text-j-text-muted/60">⌘</span>
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                        placeholder="TYPE_COMMAND_HERE..."
                        className="flex-1 ml-2 bg-transparent text-[11px] font-mono text-j-text-secondary placeholder:text-j-text-muted/50 focus:outline-none"
                    />
                </div>

                <button
                    onClick={() => { playClick(); handleSendChat(); }}
                    disabled={!isConnected}
                    className={`p-3 rounded-full transition-all ${isConnected
                        ? 'bg-j-cyan/20 text-j-cyan border border-j-cyan/30'
                        : 'bg-j-surface text-j-text-muted border border-white/10'
                        }`}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default MobileIntelligenceView;
