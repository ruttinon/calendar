import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Search, Folder as FolderIcon, ChevronRight, Settings, Bell, Plus } from 'lucide-react';
import * as api from '../api';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
    useDroppable, DragOverlay
} from '@dnd-kit/core';
import {
    SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import InputModal from '../components/InputModal';
import './Notes.css';

const SortableFolder = ({ id, name, onRename, onClick, isSelected }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const { isOver, setNodeRef: setDropRef } = useDroppable({ id: `folder-${id}`, data: { type: 'folder', id } });
    
    const style = { 
        transform: CSS.Transform.toString(transform), 
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div 
            ref={(node) => { setNodeRef(node); setDropRef(node); }} 
            style={style} 
            className={`folder-item ${isSelected ? 'selected' : ''} ${isOver ? 'drop-over' : ''}`}
            onClick={() => onClick(id, name)}
        >
            <div className="folder-left" {...attributes} {...listeners}>
                <div className="folder-icon-wrap"><FolderIcon size={17} /></div>
                <span className="folder-name">{name}</span>
            </div>
            <div className="folder-right">
                <button className="folder-settings-btn" onClick={e => { e.stopPropagation(); onRename(id, name); }}>
                    <Settings size={14} color="var(--color-text-tertiary)" />
                </button>
                <ChevronRight size={15} />
            </div>
        </div>
    );
};

const DraggableNote = ({ note, onClick }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ 
        id: `note-${note.id}`,
        data: { type: 'note', note }
    });
    const style = { 
        transform: CSS.Transform.toString(transform), 
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab'
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className="recent-note-card draggable" 
            onClick={() => !isDragging && onClick()}
            {...attributes}
            {...listeners}
        >
            <div className="note-card-left">
                <div className="note-emoji-icon">📝</div>
                <div className="note-card-info">
                    <span className="note-card-title">{note.title}</span>
                    <span className="note-card-date">{note.date_str}</span>
                </div>
            </div>
            <ChevronRight size={15} color="var(--color-text-tertiary)" />
        </div>
    );
};

const Notes = () => {
    const navigate = useNavigate();
    const [folders, setFolders] = useState([]);
    const [recentNotes, setRecentNotes] = useState([]);
    const [folderNotes, setFolderNotes] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(null); // { id, name }
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [modal, setModal] = useState({ open: false, mode: null, folderId: null, folderName: '' });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const loadData = async () => {
        const [notes, foldersData] = await Promise.all([
            api.getRecentNotes(5),
            api.getFolders()
        ]);
        setRecentNotes(notes);
        setFolders(foldersData);
    };

    useEffect(() => { loadData(); }, []);

    const fetchFolderNotes = async (id, name) => {
        setSelectedFolder({ id, name });
        const notes = await api.getNotesByFolder(id);
        setFolderNotes(notes);
    };

    // Open modal for Add
    const openAddModal = () => setModal({ open: true, mode: 'add', folderId: null, folderName: '' });

    // Open modal for Rename
    const openRenameModal = (id, name) => setModal({ open: true, mode: 'rename', folderId: id, folderName: name });

    const handleModalConfirm = async (value) => {
        setModal(m => ({ ...m, open: false }));
        if (modal.mode === 'add') {
            await api.createFolder({ name: value, order_index: folders.length });
        } else if (modal.mode === 'rename') {
            await api.updateFolder(modal.folderId, { name: value });
        }
        loadData();
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over) return;

        // Case 1: Reordering Folder
        if (active.data.current?.sortable?.index !== undefined && over.data.current?.sortable?.index !== undefined) {
             if (active.id === over.id) return;
             // Verify they are both folders (using folders' id list)
             const activeIsFolder = folders.find(f => f.id === active.id);
             const overIsFolder = folders.find(f => f.id === over.id);

             if (activeIsFolder && overIsFolder) {
                 const oldIdx = folders.findIndex(f => f.id === active.id);
                 const newIdx = folders.findIndex(f => f.id === over.id);
                 const reordered = arrayMove(folders, oldIdx, newIdx);
                 setFolders(reordered);
                 await Promise.all(
                     reordered.map((folder, index) =>
                         api.updateFolder(folder.id, { order_index: index })
                     )
                 );
                 loadData();
                 return;
             }
        }

        // Case 2: Moving Note to Folder
        const activeData = active.data.current;
        const overData = over.data.current;

        if (activeData?.type === 'note' && overData?.type === 'folder') {
            const noteId = activeData.note.id;
            const folderId = overData.id;
            await api.moveNoteToFolder(noteId, folderId);
            loadData();
            if (selectedFolder) fetchFolderNotes(selectedFolder.id, selectedFolder.name);
        }
    };

    const addQuickNote = async () => {
        const dateStr = format(new Date(), 'yyyy-MM-dd');
        const newNote = await api.saveNote({
            title: `Notes for ${dateStr}`,
            content: "",
            date_str: dateStr,
            folder_id: selectedFolder ? selectedFolder.id : null,
            owner_id: 1
        });
        if (newNote) {
            navigate(`/workspace/${newNote.date_str}`);
        }
    };

    const filteredRecent = recentNotes.filter(n =>
        !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredFolderNotes = folderNotes.filter(n =>
        !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            {/* Custom Modal */}
            <InputModal
                isOpen={modal.open}
                title={modal.mode === 'add' ? 'New Folder' : 'Rename Folder'}
                subtitle={modal.mode === 'add' ? 'Give your folder a name' : 'Enter a new name'}
                placeholder="Folder name..."
                defaultValue={modal.mode === 'rename' ? modal.folderName : ''}
                confirmLabel={modal.mode === 'add' ? 'Create' : 'Save'}
                icon={<FolderIcon size={22} />}
                onConfirm={handleModalConfirm}
                onCancel={() => setModal(m => ({ ...m, open: false }))}
            />

            <div className="notes-container">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <header className="notes-header">
                        <h1>Notes</h1>
                        <div className="notes-header-actions">
                            <button className="icon-btn"><Bell size={20} strokeWidth={1.5} /></button>
                        </div>
                    </header>

                    <div className="notes-body-grid">
                        {/* LEFT PANEL — search + folders */}
                        <div className="notes-left-panel">
                            <div className="search-bar">
                                <Search size={15} className="search-icon" />
                                <input type="text" placeholder="Search notes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>

                            <div className="notes-section-label">
                                <span>Folders</span>
                                <button className="add-folder-btn" onClick={openAddModal}>
                                    <Plus size={15} />
                                </button>
                            </div>
                            <div className="folder-list">
                                <SortableContext items={folders.map(f => f.id)} strategy={verticalListSortingStrategy}>
                                    {folders.map(folder => (
                                        <SortableFolder 
                                            key={folder.id} 
                                            id={folder.id} 
                                            name={folder.name} 
                                            onRename={openRenameModal}
                                            onClick={fetchFolderNotes}
                                            isSelected={selectedFolder?.id === folder.id}
                                        />
                                    ))}
                                </SortableContext>
                                {folders.length === 0 && <div className="empty-state">No folders yet. Tap + to create one.</div>}
                            </div>
                        </div>

                        {/* RIGHT PANEL — recent or folder notes */}
                        <div className="notes-right-panel">
                            <div className="notes-section-label" style={{ padding: '0 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{selectedFolder ? `Folder: ${selectedFolder.name}` : 'Recent'}</span>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    {selectedFolder && (
                                        <button onClick={() => setSelectedFolder(null)} style={{ fontSize: 11, color: 'var(--color-accent)', fontWeight: 700 }}>Back to Recent</button>
                                    )}
                                    <button className="add-note-inline-btn" onClick={addQuickNote}>
                                        <Plus size={14} /> New Note
                                    </button>
                                </div>
                            </div>

                            <div className="recent-list">
                                <SortableContext 
                                    items={(selectedFolder ? filteredFolderNotes : filteredRecent).map(n => `note-${n.id}`)} 
                                    strategy={verticalListSortingStrategy}
                                >
                                    {(selectedFolder ? filteredFolderNotes : filteredRecent).length === 0 && (
                                        <div className="empty-state">No notes found.</div>
                                    )}
                                    {(selectedFolder ? filteredFolderNotes : filteredRecent).map(note => (
                                        <DraggableNote 
                                            key={note.id} 
                                            note={note} 
                                            onClick={() => navigate(`/workspace/${note.date_str}`)} 
                                        />
                                    ))}
                                </SortableContext>
                            </div>
                        </div>
                    </div>
                </DndContext>
            </div>
        </>
    );
};

export default Notes;
