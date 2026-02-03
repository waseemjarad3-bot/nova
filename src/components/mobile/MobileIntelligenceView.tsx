import React from 'react';
import { Clock, Settings, Mic2, Camera, CameraOff } from 'lucide-react';
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

    // Camera
    isCameraOn: boolean;
    isCameraLoading: boolean;
    toggleCamera: () => void;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;

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
    isCameraOn,
    isCameraLoading,
    toggleCamera,
    videoRef,
    canvasRef,
    assistantName = 'M'
}) => {
    const { playClick } = useAudio();
    const isConnected = status === ConnectionStatus.CONNECTED;

    // Helper to prevent event bubbling to global enableAudio
    const wrapHandler = (handler: (e: React.MouseEvent) => void) => (e: React.MouseEvent) => {
        e.stopPropagation();
        handler(e);
    };

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
                    <button
                        onClick={wrapHandler(() => { })}
                        className="p-2 text-j-text-secondary hover:text-j-cyan transition-colors"
                    >
                        <Clock size={18} />
                    </button>
                    <button
                        onClick={wrapHandler(() => { playClick(); setIsSettingsModalOpen(true); })}
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
                            onClick={wrapHandler(() => { playClick(); setActiveTab(tab.toLowerCase()); })}
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
                    {/* Brain Visualization Area */}
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
                            <div className={`absolute inset-[-8px] border border-dashed border-j-cyan/20 rounded-full ${isConnected ? 'animate-spin-slow' : ''
                                }`} />
                        </div>

                        {/* Status Indicator */}
                        <span className={`mt-3 text-[8px] font-mono tracking-[0.2em] uppercase transition-colors duration-500 ${isConnected ? 'text-j-cyan' : status === ConnectionStatus.CONNECTING ? 'text-j-amber' : 'text-j-text-muted'
                            }`}>
                            {isConnected ? 'System Active' : status === ConnectionStatus.CONNECTING ? 'Initializing...' : 'Standby Mode'}
                        </span>

                        {/* INITIALIZE AI / TERMINATE Button */}
                        <button
                            onClick={wrapHandler(() => { playClick(); handleStartStop(); })}
                            className={`mt-4 px-6 py-2 rounded-full border text-[9px] font-mono transition-all uppercase tracking-[0.15em] font-bold shadow-lg ${isConnected
                                ? 'border-j-crimson/50 text-j-crimson hover:bg-j-crimson/20 shadow-j-crimson/20'
                                : 'border-j-cyan/40 text-j-cyan hover:bg-j-cyan/20 shadow-j-cyan/20'
                                }`}
                        >
                            {isConnected ? 'Terminate' : 'Initialize AI'}
                        </button>
                    </div>

                    {/* Sidebar Controls */}
                    <MobileSidebarControls
                        setIsMemoryModalOpen={setIsMemoryModalOpen}
                        setIsHistoryModalOpen={setIsHistoryModalOpen}
                        setIsUserModalOpen={setIsUserModalOpen}
                        setIsAssistantInfoModalOpen={setIsAssistantInfoModalOpen}
                        handleNativeFileSelect={handleNativeFileSelect}
                    />

                    {/* Visual Hub Button Area */}
                    <div className="mt-4">
                        <MobileVisualHub
                            isExpanded={isVisualHubExpanded}
                            onToggleExpand={() => setIsVisualHubExpanded(!isVisualHubExpanded)}
                            generatedImage={generatedImage}
                            generatedDiagram={generatedDiagram}
                            isVisualizing={isVisualizing}
                        />
                    </div>

                    {/* Hidden canvas for frame capture */}
                    <canvas ref={canvasRef} className="hidden" width="320" height="240" />
                </div>

                {/* Right Column - Camera Preview or Chat Panel */}
                <div className="flex-1 flex flex-col p-3 overflow-hidden">
                    {isCameraOn ? (
                        <div className="flex-1 bg-black rounded-xl border border-j-cyan/30 overflow-hidden relative shadow-[0_0_30px_rgba(0,229,255,0.1)]">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover scale-x-[-1]"
                            />
                            {/* Overlay info */}
                            <div className="absolute top-4 left-4 flex items-center gap-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-j-cyan/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-j-cyan animate-pulse" />
                                <span className="text-[9px] font-mono text-j-cyan uppercase tracking-widest">Live Visual Stream</span>
                            </div>
                            <button
                                onClick={wrapHandler(() => toggleCamera())}
                                className="absolute bottom-4 right-4 p-3 bg-j-panel/80 backdrop-blur-md border border-white/10 rounded-full text-j-text-muted hover:text-j-crimson transition-all"
                            >
                                <CameraOff size={20} />
                            </button>
                        </div>
                    ) : (
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
                    )}
                </div>
            </main>

            {/* Bottom Input Bar */}
            <div className="h-16 border-t border-white/[0.05] flex items-center justify-between px-3 bg-j-panel/80 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-2">
                    <button
                        onClick={wrapHandler(() => { playClick(); })}
                        className="p-2 text-j-text-muted hover:text-j-cyan transition-colors"
                    >
                        <Mic2 size={20} />
                    </button>
                    {/* Camera Button in Bottom Bar for visibility */}
                    <button
                        onClick={wrapHandler(() => { playClick(); toggleCamera(); })}
                        disabled={isCameraLoading}
                        className={`p-2.5 rounded-xl border transition-all ${isCameraOn
                            ? 'bg-j-cyan/15 border-j-cyan/40 text-j-cyan shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                            : isCameraLoading
                                ? 'bg-j-amber/20 border-j-amber/40 text-j-amber animate-pulse'
                                : 'bg-j-surface/40 border-white/5 text-j-text-muted hover:text-j-cyan'
                            }`}
                    >
                        {isCameraOn ? <Camera size={20} /> : <CameraOff size={20} />}
                    </button>
                    <div className="hidden lg:block w-px h-6 bg-white/5 ml-2" />
                </div>

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
                    onClick={wrapHandler(() => { playClick(); handleSendChat(); })}
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
