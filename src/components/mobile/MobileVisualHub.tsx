import React, { useRef, useEffect, useState } from 'react';
import { Layers, ZoomIn, ZoomOut, RotateCcw, Move, X } from 'lucide-react';
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
    const diagramRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const hasContent = generatedImage || generatedDiagram;

    // Mermaid rendering logic (same as desktop VisualHub)
    useEffect(() => {
        if (generatedDiagram) {
            const renderDiagram = async () => {
                try {
                    if (diagramRef.current) diagramRef.current.innerHTML = '';
                    // @ts-ignore
                    const { svg } = await window.mermaid.render('mermaid-svg-mobile-' + Date.now(), generatedDiagram);
                    if (diagramRef.current) {
                        diagramRef.current.innerHTML = svg;
                    }
                } catch (err: any) {
                    console.error("Mobile Mermaid rendering failed:", err);
                    if (diagramRef.current) {
                        diagramRef.current.innerHTML = `<div class="p-4 border border-j-crimson/30 bg-j-crimson/5 rounded-xl text-j-crimson text-[10px] font-mono text-left overflow-auto">
                            <p class="font-bold mb-1 uppercase tracking-widest opacity-70 border-b border-j-crimson/20 pb-1">Rendering Error</p>
                            <pre class="whitespace-pre-wrap mt-2">${err.message || 'Syntax Error'}</pre>
                        </div>`;
                    }
                }
            };
            const timer = setTimeout(renderDiagram, 500);
            return () => clearTimeout(timer);
        }
    }, [generatedDiagram]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (hasContent && !isVisualizing) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const resetView = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    return (
        <div className={`bg-j-panel/90 backdrop-blur-2xl border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ${isExpanded ? 'fixed inset-4 z-[100] flex flex-col' : ''
            }`}>
            {/* Header / Non-Expanded Click Area */}
            {!isExpanded ? (
                <button
                    onClick={(e) => { e.stopPropagation(); playClick(); onToggleExpand(); }}
                    className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-all group"
                >
                    <div className="flex items-center gap-2">
                        <Layers size={14} className="text-j-cyan opacity-70 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[9px] font-mono text-j-cyan uppercase tracking-widest font-bold">Visual Intelligence Hub</span>
                    </div>
                    <span className={`text-[8px] font-mono px-2 py-0.5 rounded border ${hasContent ? 'bg-j-cyan/10 border-j-cyan/30 text-j-cyan animate-pulse' : 'bg-j-surface/60 border-white/10 text-j-text-muted'}`}>
                        {hasContent ? 'LIVE_DATA' : 'READY'}
                    </span>
                </button>
            ) : (
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20">
                    <div className="flex items-center gap-2">
                        <Layers size={16} className="text-j-cyan" />
                        <span className="text-[10px] font-mono text-j-text-primary uppercase tracking-[0.2em] font-bold">Neural_Visualization_Core</span>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); playClick(); onToggleExpand(); }}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-j-text-muted transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            )}

            {/* Content Area */}
            <div
                className={`flex-1 relative overflow-hidden flex flex-col items-center justify-center ${isExpanded ? '' : 'p-6 h-32'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Background Grid for Expanded View */}
                {isExpanded && <div className="absolute inset-0 sci-fi-grid opacity-10 pointer-events-none" />}

                {isVisualizing ? (
                    <div className="flex flex-col items-center gap-4 animate-pulse">
                        <div className="w-12 h-12 border-t-2 border-j-cyan rounded-full animate-spin" />
                        <span className="text-[9px] font-mono text-j-cyan uppercase tracking-widest">Processing_Data...</span>
                    </div>
                ) : hasContent ? (
                    <div
                        className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transformOrigin: 'center center',
                            cursor: isDragging ? 'grabbing' : hasContent ? 'grab' : 'default'
                        }}
                    >
                        {generatedImage ? (
                            <img
                                src={generatedImage}
                                alt="Result"
                                className="max-w-[95%] max-h-[85%] object-contain rounded-lg shadow-2xl pointer-events-none"
                            />
                        ) : (
                            <div ref={diagramRef} className="w-full p-6 text-center mermaid-viewer text-white pointer-events-none" />
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-xl bg-j-surface/40 border border-white/5 flex items-center justify-center mb-3">
                            <Layers size={20} className="text-j-text-muted opacity-40" />
                        </div>
                        <p className="text-[9px] font-mono text-j-text-muted uppercase tracking-widest leading-relaxed max-w-[160px]">
                            System Ready. Neural output will be projected here.
                        </p>
                    </div>
                )}

                {/* Expanded Controls Overlay */}
                {isExpanded && hasContent && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl z-[110] shadow-2xl">
                        <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(z * 1.2, 5)); }} className="p-1.5 hover:text-j-cyan transition-colors">
                            <ZoomIn size={18} />
                        </button>
                        <div className="w-[1px] h-4 bg-white/10" />
                        <span className="text-[9px] font-mono text-j-cyan w-8 text-center">{Math.round(zoom * 100)}%</span>
                        <div className="w-[1px] h-4 bg-white/10" />
                        <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(z / 1.2, 0.1)); }} className="p-1.5 hover:text-j-cyan transition-colors">
                            <ZoomOut size={18} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); resetView(); }} className="ml-2 p-1.5 hover:text-j-amber transition-colors">
                            <RotateCcw size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MobileVisualHub;
