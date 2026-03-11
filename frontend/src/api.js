const API_URL = 'http://127.0.0.1:8001';

// --- TODOS ---
export const getTodosByDate = async (dateStr) => {
    try {
        const res = await fetch(`${API_URL}/todos/${dateStr}`);
        return res.ok ? await res.json() : [];
    } catch (e) { console.error(e); return []; }
};

export const createTodo = async (todoData) => {
    try {
        const res = await fetch(`${API_URL}/todos/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(todoData)
        });
        return res.ok ? await res.json() : null;
    } catch (e) { console.error(e); return null; }
};

export const toggleTodo = async (todoId) => {
    try {
        const res = await fetch(`${API_URL}/todos/${todoId}/toggle`, { method: 'PUT' });
        return res.ok ? await res.json() : null;
    } catch (e) { console.error(e); return null; }
};

export const deleteTodo = async (todoId) => {
    try {
        const res = await fetch(`${API_URL}/todos/${todoId}`, { method: 'DELETE' });
        return res.ok;
    } catch (e) { console.error(e); return false; }
};

// --- NOTES ---
export const getRecentNotes = async (limit = 10) => {
    try {
        const res = await fetch(`${API_URL}/notes/recent/?limit=${limit}`);
        return res.ok ? await res.json() : [];
    } catch (e) { console.error(e); return []; }
};

export const getNotesByDate = async (dateStr) => {
    try {
        const res = await fetch(`${API_URL}/notes/${dateStr}`);
        return res.ok ? await res.json() : [];
    } catch (e) { console.error(e); return []; }
};

export const saveNote = async (noteData) => {
    try {
        const res = await fetch(`${API_URL}/notes/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(noteData)
        });
        return res.ok ? await res.json() : null;
    } catch (e) { console.error(e); return null; }
};

export const updateNote = async (noteId, noteData) => {
    try {
        const res = await fetch(`${API_URL}/notes/${noteId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(noteData)
        });
        return res.ok ? await res.json() : null;
    } catch (e) { console.error(e); return null; }
};

export const moveNoteToFolder = async (noteId, folderId) => {
    try {
        const res = await fetch(`${API_URL}/notes/${noteId}/move/${folderId}`, { method: 'PUT' });
        return res.ok ? await res.json() : null;
    } catch (e) { console.error(e); return null; }
};

export const deleteNote = async (noteId) => {
    try {
        const res = await fetch(`${API_URL}/notes/${noteId}`, { method: 'DELETE' });
        return res.ok;
    } catch (e) { console.error(e); return false; }
};

// --- FOLDERS ---
export const getFolders = async () => {
    try {
        const res = await fetch(`${API_URL}/folders/`);
        return res.ok ? await res.json() : [];
    } catch (e) { console.error(e); return []; }
};

export const createFolder = async (folderData) => {
    try {
        const res = await fetch(`${API_URL}/folders/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(folderData)
        });
        return res.ok ? await res.json() : null;
    } catch (e) { console.error(e); return null; }
};

export const updateFolder = async (folderId, folderData) => {
    try {
        const res = await fetch(`${API_URL}/folders/${folderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(folderData)
        });
        return res.ok ? await res.json() : null;
    } catch (e) { console.error(e); return null; }
};

export const getNotesByFolder = async (folderId) => {
    try {
        const res = await fetch(`${API_URL}/notes/folder/${folderId}`);
        return res.ok ? await res.json() : [];
    } catch (e) { console.error(e); return []; }
};

export const deleteFolder = async (folderId) => {
    try {
        const res = await fetch(`${API_URL}/folders/${folderId}`, { method: 'DELETE' });
        return res.ok;
    } catch (e) { console.error(e); return false; }
};

// --- TEMPLATES ---
export const getTemplates = async () => {
    try {
        const res = await fetch(`${API_URL}/templates/`);
        return res.ok ? await res.json() : [];
    } catch (e) { console.error(e); return []; }
};