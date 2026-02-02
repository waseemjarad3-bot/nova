import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, AlertCircle, Clock, Tag } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';



interface Task {
    id: string;
    text: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    category: string;
    timestamp: number;
}

interface TasksSectionProps {
    tasks: Task[];
    onSaveTasks: (tasks: Task[]) => void;
}

const TasksSection: React.FC<TasksSectionProps> = ({ tasks, onSaveTasks }) => {
    const [newTaskText, setNewTaskText] = useState('');
    const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [selectedCategory, setSelectedCategory] = useState('Personal');

    const { playClick } = useAudio();


    const priorities = {
        low: { color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        medium: { color: 'text-amber-400', bg: 'bg-amber-400/10' },
        high: { color: 'text-rose-400', bg: 'bg-rose-400/10' }
    };

    const handleAddTask = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        playClick();
        if (!newTaskText.trim()) return;


        const newTask: Task = {
            id: Date.now().toString(),
            text: newTaskText.trim(),
            completed: false,
            priority: selectedPriority,
            category: selectedCategory,
            timestamp: Date.now()
        };

        onSaveTasks([newTask, ...tasks]);
        setNewTaskText('');
    };

    const toggleTask = (id: string) => {
        playClick();
        const updated = tasks.map(t =>

            t.id === id ? { ...t, completed: !t.completed } : t
        );
        onSaveTasks(updated);
    };

    const deleteTask = (id: string) => {
        playClick();
        const updated = tasks.filter(t => t.id !== id);

        onSaveTasks(updated);
    };

    const categories = ['Work', 'Personal', 'Meeting', 'Finance'];

    return (
        <div className="flex-1 flex flex-col h-full animate-appFadeIn">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Control Center</h2>
                    <p className="text-j-text-muted text-xs uppercase tracking-widest">Daily Operations & Goals</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl flex items-center gap-3">
                        <div className="text-j-cyan flex items-center gap-2">
                            <CheckCircle2 size={16} />
                            <span className="font-mono text-sm">{tasks.filter(t => t.completed).length}/{tasks.length}</span>
                        </div>
                        <div className="w-[1px] h-4 bg-white/10"></div>
                        <span className="text-[10px] text-j-text-muted uppercase tracking-tighter">Efficiency</span>
                    </div>
                </div>
            </div>

            {/* Quick Add Bar */}
            <form onSubmit={handleAddTask} className="relative group mb-8">
                <div className="absolute inset-0 bg-j-cyan/5 rounded-[32px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center bg-white/[0.03] border border-white/[0.1] rounded-[32px] p-2 pr-6 focus-within:border-j-cyan/40 transition-all">
                    <div className="flex-1 px-6">
                        <input
                            type="text"
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            placeholder="Assign new objective..."
                            className="w-full bg-transparent border-none focus:outline-none text-white text-lg placeholder:opacity-20"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedPriority}
                            onChange={(e: any) => setSelectedPriority(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-j-text-muted focus:outline-none hover:bg-white/10 cursor-pointer"
                        >
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                        </select>
                        <button
                            type="submit"
                            className="bg-j-cyan text-j-void p-2.5 rounded-full hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)]"
                        >
                            <Plus size={20} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </form>

            {/* Task Filters / Categories */}
            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
                {['All', ...categories].map(cat => (
                    <button
                        key={cat}
                        onClick={() => { playClick(); setSelectedCategory(cat); }}
                        className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${selectedCategory === cat

                            ? 'bg-j-cyan/10 border-j-cyan/30 text-j-cyan shadow-lg shadow-j-cyan/5'
                            : 'bg-white/[0.03] border-white/5 text-j-text-muted hover:border-white/10'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Tasks List */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {tasks.length > 0 ? tasks.map((task) => (
                    <div
                        key={task.id}
                        className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all ${task.completed
                            ? 'bg-white/[0.01] border-white/[0.02] opacity-50'
                            : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.05]'
                            }`}
                    >
                        <button
                            onClick={() => toggleTask(task.id)}
                            className={`shrink-0 transition-colors ${task.completed ? 'text-j-cyan' : 'text-j-text-muted group-hover:text-white/40'}`}
                        >
                            {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                        </button>

                        <div className="flex-1 min-w-0">
                            <span className={`block text-base leading-tight truncate ${task.completed ? 'line-through text-j-text-muted' : 'text-white/90'}`}>
                                {task.text}
                            </span>
                            <div className="flex items-center gap-4 mt-1">
                                <span className={`text-[10px] flex items-center gap-1 font-bold uppercase tracking-widest ${priorities[task.priority].color}`}>
                                    <AlertCircle size={10} />
                                    {task.priority}
                                </span>
                                <span className="text-[10px] text-j-text-muted flex items-center gap-1">
                                    <Tag size={10} />
                                    {task.category}
                                </span>
                                <span className="text-[10px] text-j-text-muted flex items-center gap-1">
                                    <Clock size={10} />
                                    {new Date(task.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => deleteTask(task.id)}
                            className="p-2 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )) : (
                    <div className="py-20 flex flex-col items-center justify-center text-j-text-muted opacity-40">
                        <AlertCircle size={48} className="mb-4" />
                        <p className="text-lg">No objectives in queue. Ready for deployment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TasksSection;
