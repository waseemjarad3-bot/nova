import React from 'react';
import { Layers } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';

interface MobileVisualHubProps {
    isExpanded: boolean;
    onToggleExpand: () => void;
    generatedImage: string | null;
    generatedDiagram: string | null;
    isVisualizing: boolean;
}

const MobileVisualHub: React.FC<MobileVisualHubProps> = ({
    isExpanded,
    onToggleExpand,
    generatedImage,
    generatedDiagram,
    isVisualizing
}) => {
    const { playClick } = useAudio();
    const hasContent = generatedImage || generatedDiagram;

    return (
        <div className={`bg-j-panel/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden transition-all duration-500 ${isExpanded ? 'fixed inset-4 z-50' : ''
            }`}>
            {/* Header Button */}
            {!isExpanded && (
                <button
                    onClick={() => { playClick(); onToggleExpand(); }}
                    className="w-full flex items-center gap-2 p-3 hover:bg-white/5 transition-all"
                >
                    <span className="text-[9px] font-mono text-j-cyan uppercase tracking-wider">VISUAL HUB</span>
                    <span className="text-[8px] font-mono text-j-text-muted px-2 py-0.5 bg-j-surface/60 rounded border border-white/[0.08]">
                        {hasContent ? 'VIEW' : 'INIT'}
                    </span>
                </button>
            )}

            {/* Expanded Content */}
            <div className={`flex flex-col items-center justify-center p-6 ${isExpanded ? 'h-full' : 'pb-8'}`}>
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl bg-j-surface/60 border border-white/[0.08] flex items-center justify-center mb-4">
                    <Layers size={20} className="text-j-text-muted" />
                </div>

                {/* Title */}
                <h3 className="text-sm font-mono text-j-text-primary uppercase tracking-[0.2em] mb-2">
                    VISUAL INTELLIGENCE HUB
                </h3>

                {/* Description */}
                <p className="text-[10px] font-mono text-j-text-muted text-center mb-4 max-w-xs">
                    Images, Flowcharts, and Mindmaps will materialize here.
                </p>

                {/* Status */}
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isVisualizing ? 'bg-j-amber animate-pulse' : hasContent ? 'bg-j-hologram' : 'bg-j-cyan'
                        }`} />
                    <span className={`text-[9px] font-mono uppercase tracking-wider ${isVisualizing ? 'text-j-amber' : hasContent ? 'text-j-hologram' : 'text-j-cyan'
                        }`}>
                        {isVisualizing ? 'GENERATING...' : hasContent ? 'CONTENT READY' : 'SYSTEM READY - AWAITING DATA INPUT'}
                    </span>
                </div>

                {/* Content Display */}
                {hasContent && isExpanded && (
                    <div className="mt-6 w-full flex-1 overflow-auto">
                        {generatedImage && (
                            <img
                                src={generatedImage}
                                alt="Generated"
                                className="w-full h-auto rounded-lg border border-white/[0.08]"
                            />
                        )}
                        {generatedDiagram && (
                            <div
                                className="w-full h-full bg-white rounded-lg"
                                dangerouslySetInnerHTML={{ __html: generatedDiagram }}
                            />
                        )}
                    </div>
                )}

                {/* Close Button when expanded */}
                {isExpanded && (
                    <button
                        onClick={() => { playClick(); onToggleExpand(); }}
                        className="mt-4 px-6 py-2 rounded-full border border-j-cyan/30 text-j-cyan text-[10px] font-mono uppercase tracking-wider hover:bg-j-cyan/10 transition-all"
                    >
                        Close Hub
                    </button>
                )}
            </div>
        </div>
    );
};

export default MobileVisualHub;
