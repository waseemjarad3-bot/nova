import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Save, X, Search } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';



interface Note {
    id: string;
    title: string;
    content: string;
    timestamp: number;
    color?: string;
}

interface NotesSectionProps {
    notes: Note[];
    onSaveNote: (note: Note) => void;
    onDeleteNote: (id: string) => void;
}

const NotesSection: React.FC<NotesSectionProps> = ({ notes, onSaveNote, onDeleteNote }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentNote, setCurrentNote] = useState<Note | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { playClick } = useAudio();
    const colors = ['bg-j-cyan/5', 'bg-purple-500/5', 'bg-amber-500/5', 'bg-emerald-500/5', 'bg-rose-500/5'];

    const handleCreateNew = () => {
        playClick();
        const newNote: Note = {
            id: Date.now().toString(),
            title: '',
            content: '',
            timestamp: Date.now(),
            color: colors[Math.floor(Math.random() * colors.length)]
        };
        setCurrentNote(newNote);
        setIsEditing(true);
    };

    const handleEdit = (note: Note) => {
        playClick();
        setCurrentNote(note);
        setIsEditing(true);
    };

    const handleSave = () => {
        if (currentNote) {
            onSaveNote(currentNote);
        }
    };

    const handleBack = () => {
        playClick();
        handleSave(); // Auto-save on back
        setIsEditing(false);
        setCurrentNote(null);
    };

    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- FULL SCREEN EDITOR VIEW ---
    if (isEditing && currentNote) {
        return (
            <div className="absolute inset-0 z-50 bg-[#0c1219] flex flex-col animate-fadeIn">
                {/* Minimal Header */}
                <div className="h-16 border-b border-white/[0.05] flex items-center justify-between px-8 bg-black/20 backdrop-blur-xl shrink-0">
                    <button 
                        onClick={handleBack}
                        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
                    >
                        <div className="p-2 rounded-full group-hover:bg-white/5 transition-all">
                            <X size={20} />
                        </div>
                        <span className="text-sm tracking-widest uppercase font-medium hidden sm:block">Back to Notes</span>
                    </button>
                    
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-white/20 font-mono tracking-widest uppercase">
                            {currentNote.content.length} chars
                        </span>
                        <div className="h-4 w-[1px] bg-white/10"></div>
                        <button 
                            onClick={() => { playClick(); handleSave(); }}
                            className="p-2 text-j-cyan hover:bg-j-cyan/10 rounded-full transition-all"
                            title="Save"
                        >
                            <Save size={20} />
                        </button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar flex justify-center">
                    <div className="w-full max-w-4xl py-12 px-8 sm:px-12 flex flex-col gap-6">
                        {/* Title Input */}
                        <input
                            type="text"
                            value={currentNote.title}
                            onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                            placeholder="Untitled Note"
                            className="w-full bg-transparent text-4xl sm:text-5xl font-bold text-white/90 placeholder:text-white/10 border-none outline-none focus:ring-0 px-0"
                        />
                        
                        {/* Meta Data */}
                        <div className="flex items-center gap-3 text-white/20 text-sm font-mono border-b border-white/[0.05] pb-6 mb-2">
                            <span>{new Date(currentNote.timestamp).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{new Date(currentNote.timestamp).toLocaleTimeString()}</span>
                        </div>

                        {/* Main Content */}
                        <textarea
                            value={currentNote.content}
                            onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                            placeholder="Type something..."
                            className="w-full flex-1 bg-transparent text-lg sm:text-xl leading-relaxed text-white/80 placeholder:text-white/10 border-none outline-none focus:ring-0 resize-none h-[60vh] px-0"
                            autoFocus
                        />
                    </div>
                </div>
            </div>
        );
    }

    // --- LIST VIEW ---
    return (
        <div className="flex-1 flex flex-col h-full animate-appFadeIn relative">
            <div className="flex justify-between items-end mb-8 px-2">
                <div>
                    <h2 className="text-3xl font-light text-white tracking-tight">Notes</h2>
                    <p className="text-white/30 text-sm mt-1 font-light">Capture your thoughts and ideas</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="group flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full hover:bg-j-cyan hover:text-black transition-all duration-300 shadow-xl shadow-white/5"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                    <span className="font-medium tracking-wide text-sm">Create Note</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-8 px-2">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                <input
                    type="text"
                    placeholder="Search your notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl py-4 pl-14 pr-6 text-base text-white focus:outline-none focus:bg-white/[0.06] focus:border-white/[0.1] transition-all placeholder:text-white/20"
                />
            </div>

            {/* Grid of Notes */}
            <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredNotes.length > 0 ? filteredNotes.map((note) => (
                        <div
                            key={note.id}
                            className={`group relative p-6 rounded-[2rem] bg-[#12181f] border border-white/[0.03] hover:border-white/[0.1] hover:bg-[#161d25] transition-all duration-300 cursor-pointer flex flex-col h-[280px] shadow-lg shadow-black/20`}
                            onClick={() => handleEdit(note)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className={`font-medium text-xl text-white/90 truncate pr-4 ${!note.title && 'text-white/30 italic'}`}>
                                    {note.title || 'Untitled'}
                                </h3>
                                <button
                                    onClick={(e) => { e.stopPropagation(); playClick(); onDeleteNote(note.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-rose-500/10 text-rose-500/50 hover:text-rose-500 rounded-full transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            
                            <p className="text-white/50 text-base leading-relaxed line-clamp-6 flex-1 font-light">
                                {note.content || <span className="text-white/10 italic">No content...</span>}
                            </p>

                            <div className="mt-4 pt-4 border-t border-white/[0.03] flex justify-between items-center text-xs text-white/20 font-medium tracking-wider uppercase">
                                <span>{new Date(note.timestamp).toLocaleDateString()}</span>
                                <div className="w-2 h-2 rounded-full bg-j-cyan/50 opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(0,229,255,0.5)]"></div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center text-white/20">
                            <div className="w-24 h-24 rounded-full bg-white/[0.02] flex items-center justify-center mb-6">
                                <Edit3 size={32} className="opacity-50" />
                            </div>
                            <p className="text-xl font-light">Your canvas is empty</p>
                            <button onClick={handleCreateNew} className="mt-4 text-j-cyan hover:underline underline-offset-4 text-sm">Start writing</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotesSection;
