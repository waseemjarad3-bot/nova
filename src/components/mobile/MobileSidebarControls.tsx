import React from 'react';
import { Plus, FolderPlus, Brain, History, User, Bot } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';

interface MobileSidebarControlsProps {
    setIsMemoryModalOpen: (open: boolean) => void;
    setIsHistoryModalOpen: (open: boolean) => void;
    setIsUserModalOpen: (open: boolean) => void;
    setIsAssistantInfoModalOpen: (open: boolean) => void;
    handleNativeFileSelect: () => void;
}

const MobileSidebarControls: React.FC<MobileSidebarControlsProps> = ({
    setIsMemoryModalOpen,
    setIsHistoryModalOpen,
    setIsUserModalOpen,
    setIsAssistantInfoModalOpen,
    handleNativeFileSelect
}) => {
    const { playClick } = useAudio();

    const menuItems = [
        { icon: FolderPlus, label: 'ADD FILES', subtitle: 'System Access', onClick: handleNativeFileSelect },
        { icon: Brain, label: 'MEMORY', subtitle: 'System Access', onClick: () => setIsMemoryModalOpen(true) },
        { icon: History, label: 'HISTORY', subtitle: 'System Access', onClick: () => setIsHistoryModalOpen(true) },
        { icon: User, label: 'USER', subtitle: 'System Access', onClick: () => setIsUserModalOpen(true) },
        { icon: Bot, label: 'ASSISTANT', subtitle: 'System Access', onClick: () => setIsAssistantInfoModalOpen(true) },
    ];

    return (
        <div className="flex flex-col gap-1">
            {/* Import Header */}
            <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-j-cyan/20 flex items-center justify-center border border-j-cyan/30">
                    <Plus size={14} className="text-j-cyan" />
                </div>
                <span className="text-[10px] font-mono text-j-cyan uppercase tracking-widest">IMPORT</span>
            </div>

            {/* Menu Items */}
            {menuItems.map((item, index) => (
                <button
                    key={index}
                    onClick={() => { playClick(); item.onClick(); }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all group"
                >
                    <item.icon size={18} className="text-j-cyan/70 group-hover:text-j-cyan transition-colors" />
                    <div className="flex flex-col items-start">
                        <span className="text-[11px] font-mono text-j-text-primary uppercase tracking-wide">{item.label}</span>
                        <span className="text-[9px] font-mono text-j-text-muted">{item.subtitle}</span>
                    </div>
                </button>
            ))}
        </div>
    );
};

export default MobileSidebarControls;
