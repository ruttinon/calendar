import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, PenTool, Type, Eraser, Trash2, Edit2, Check, Plus, Search, Info, LayoutTemplate, Save } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import * as api from '../api';
import './DailyWorkspace.css';

const DailyWorkspace = () => {
    const { dateStr } = useParams();
    const navigate = useNavigate();
    const date = dateStr ? parseISO(dateStr) : new Date();
    const sigCanvas = useRef({});
    const dStr = format(date, 'yyyy-MM-dd');

    const [goals, setGoals] = useState([]);
    const [note, setNote] = useState(null);
    const [noteContent, setNoteContent] = useState('');
    const [noteMode, setNoteMode] = useState('text');
    const [newTaskText, setNewTaskText] = useState('');
    const [editingGoalId, setEditingGoalId] = useState(null);
    const [editGoalText, setEditGoalText] = useState('');
    const [selectedColor, setSelectedColor] = useState('#1A1E2E');
    const [isSaving, setIsSaving] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);

    const loadData = async () => {
        const [todos, notes] = await Promise.all([
            api.getTodosByDate(dStr),
            api.getNotesByDate(dStr)
        ]);
        setGoals(todos);
        if (notes.length > 0) {
            setNote(notes[0]);
            const c = notes[0].content || '';
            if (c.startsWith('data:image')) {
                setNoteContent('');
                setNoteMode('draw');
                setTimeout(() => { if (sigCanvas.current?.fromDataURL) sigCanvas.current.fromDataURL(c); }, 100);
            } else {
                setNoteContent(c);
                setNoteMode('text');
            }
        } else {
            setNote(null); setNoteContent(''); setNoteMode('text');
        }
    };

    useEffect(() => { loadData(); }, [dateStr]);

    const toggleGoal = async (id) => {
        await api.toggleTodo(id);
        loadData();
    };

    const handleAddGoal = async (e) => {
        if (e.key === 'Enter' && newTaskText.trim()) {
            await api.createTodo({ text: newTaskText, date_str: dStr, owner_id: 1 });
            setNewTaskText('');
            loadData();
        }
    };

    const saveNoteContent = async () => {
        setIsSaving(true);
        let content = noteContent;
        if (noteMode === 'draw' && sigCanvas.current) {
            content = sigCanvas.current.isEmpty() ? '' : sigCanvas.current.toDataURL('image/png');
        }
        try {
            if (note) {
                await api.updateNote(note.id, { title: `Notes for ${dStr}`, content });
            } else {
                const newNote = await api.saveNote({ title: `Notes for ${dStr}`, content, date_str: dStr, owner_id: 1 });
                if (newNote) setNote(newNote);
            }
        } finally {
            setTimeout(() => setIsSaving(false), 500);
        }
    };

    const applyTemplate = (content) => {
        setNoteContent(content);
        setNoteMode('text');
        setShowTemplates(false);
    };

    const TEMPLATES = [
        { name: 'Daily Meeting', content: '# Meeting Notes\n\n**Date:** ' + dStr + '\n**Attendees:** \n\n## Agenda\n- \n\n## Action Items\n- ' },
        { name: 'Study Session', content: '# Study Notes\n\n**Subject:** \n**Topic:** \n\n## Key Concepts\n- \n\n## Summary\n' },
        { name: 'Project Planning', content: '# Project: \n\n## Objectives\n1. \n\n## Phases\n- Design\n- Implementation\n- Testing' }
    ];

    const COLORS = ['#1A1E2E', '#2B6DEF', '#22C55E', '#F59E0B', '#EF4444'];

    return (
        <div className="workspace-container full-page">
            <header className="workspace-header sticky">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ChevronLeft size={20} />
                    </button>
                    <div className="workspace-info">
                        <span className="info-day">{format(date, 'EEEE')}</span>
                        <h1 className="info-date">{format(date, 'd MMMM yyyy')}</h1>
                    </div>
                </div>
                <div className="header-actions">
                    <button className={`save-indicator ${isSaving ? 'saving' : ''}`} onClick={saveNoteContent}>
                        {isSaving ? 'Saving...' : <><Save size={18} /> Save</>}
                    </button>
                    <button className="icon-btn theme-toggle"><LayoutTemplate size={20} onClick={() => setShowTemplates(!showTemplates)} /></button>
                </div>
            </header>

            <div className="workspace-main-layout">
                {/* Side Panel: Goals */}
                <aside className="workspace-sidebar">
                    <div className="sidebar-section">
                        <div className="section-header">
                            <h2 className="section-title">Daily Goals</h2>
                        </div>
                        <div className="goals-container mobile-scroll">
                            {goals.map(goal => (
                                <div key={goal.id} className="goal-item-wide">
                                    <button className={`check-circle ${goal.completed ? 'filled' : ''}`} onClick={() => toggleGoal(goal.id)}>
                                        {goal.completed && <Check size={12} color="#fff" strokeWidth={4} />}
                                    </button>
                                    <span className={`goal-text-wide ${goal.completed ? 'completed' : ''}`}>{goal.text}</span>
                                </div>
                            ))}
                            <div className="inline-add-task">
                                <Plus size={16} color="var(--color-text-tertiary)" />
                                <input 
                                    placeholder="Add task..." 
                                    value={newTaskText} 
                                    onChange={e => setNewTaskText(e.target.value)}
                                    onKeyDown={handleAddGoal}
                                />
                            </div>
                        </div>
                    </div>

                    {showTemplates && (
                        <div className="templates-dropdown">
                            <h3 className="dropdown-title">Choose Template</h3>
                            {TEMPLATES.map(t => (
                                <button key={t.name} className="template-option" onClick={() => applyTemplate(t.content)}>
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    )}
                </aside>

                {/* Main Content: Full-page Editor */}
                <main className="editor-container-full">
                    <div className="editor-floating-toolbar">
                        <div className="mode-toggle">
                            <button className={noteMode === 'text' ? 'active' : ''} onClick={() => setNoteMode('text')}><Type size={18} /></button>
                            <button className={noteMode === 'draw' ? 'active' : ''} onClick={() => setNoteMode('draw')}><PenTool size={18} /></button>
                        </div>
                        <div className="color-picker-row">
                            {COLORS.map(c => (
                                <div 
                                    key={c} 
                                    className={`color-pill ${selectedColor === c ? 'active' : ''}`} 
                                    style={{ backgroundColor: c }}
                                    onClick={() => setSelectedColor(c)}
                                />
                            ))}
                        </div>
                        {noteMode === 'draw' && (
                            <button className="clear-btn" onClick={() => sigCanvas.current?.clear()}><Eraser size={18} /></button>
                        )}
                    </div>

                    <div className="editor-sheet">
                        {noteMode === 'text' ? (
                            <textarea 
                                className="full-sheet-textarea" 
                                placeholder="Start writing something extraordinary..."
                                value={noteContent}
                                onChange={e => setNoteContent(e.target.value)}
                                onBlur={saveNoteContent}
                                autoFocus
                            />
                        ) : (
                            <div className="full-sheet-canvas-wrapper" onMouseUp={saveNoteContent} onTouchEnd={saveNoteContent}>
                                <SignatureCanvas 
                                    ref={sigCanvas} 
                                    penColor={selectedColor}
                                    canvasProps={{ className: 'workspace-sigCanvas' }} 
                                    clearOnResize={false} 
                                />
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DailyWorkspace;