const configuredApiUrl = import.meta.env.VITE_API_URL?.trim() ?? '';
const API_URL = (configuredApiUrl || (import.meta.env.DEV ? 'http://127.0.0.1:8001' : '')).replace(/\/$/, '');
const STORAGE_KEY = 'calendar-note-demo-db';
const DEFAULT_OWNER_ID = 1;
let hasWarnedAboutFallback = false;

export const isDemoMode = import.meta.env.PROD && !configuredApiUrl;

const DEFAULT_FOLDERS = ['Work', 'Study', 'Personal'];
const DEFAULT_TEMPLATES = [
    { title: 'Student Planner', category: 'Study', price: 3.0, rating: 4.8, content: '{}' },
    { title: 'Meeting Notes', category: 'Work', price: 0.0, rating: 4.5, content: '{}' },
    { title: 'Personal Journal', category: 'Personal', price: 0.0, rating: 4.7, content: '{}' }
];

const sortFolders = (folders) =>
    [...folders].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0) || a.id - b.id);

const createDefaultStore = () => ({
    meta: {
        nextTodoId: 1,
        nextNoteId: 1,
        nextFolderId: DEFAULT_FOLDERS.length + 1,
        nextTemplateId: DEFAULT_TEMPLATES.length + 1,
    },
    todos: [],
    notes: [],
    folders: DEFAULT_FOLDERS.map((name, index) => ({
        id: index + 1,
        name,
        order_index: index,
        owner_id: DEFAULT_OWNER_ID,
    })),
    templates: DEFAULT_TEMPLATES.map((template, index) => ({
        id: index + 1,
        ...template,
    })),
});

const normalizeStore = (store = {}) => {
    const fallback = createDefaultStore();
    const todos = Array.isArray(store.todos)
        ? store.todos.map((todo) => ({
            completed: false,
            time_str: null,
            owner_id: DEFAULT_OWNER_ID,
            ...todo,
        }))
        : [];
    const notes = Array.isArray(store.notes)
        ? store.notes.map((note) => ({
            content: '',
            folder_id: null,
            owner_id: DEFAULT_OWNER_ID,
            created_at: new Date().toISOString(),
            ...note,
        }))
        : [];
    const folders = Array.isArray(store.folders) && store.folders.length > 0
        ? sortFolders(store.folders.map((folder, index) => ({
            owner_id: DEFAULT_OWNER_ID,
            order_index: index,
            ...folder,
        })))
        : fallback.folders;
    const templates = Array.isArray(store.templates) && store.templates.length > 0
        ? store.templates
        : fallback.templates;

    return {
        meta: {
            nextTodoId: Math.max(0, ...todos.map((todo) => Number(todo.id) || 0)) + 1,
            nextNoteId: Math.max(0, ...notes.map((note) => Number(note.id) || 0)) + 1,
            nextFolderId: Math.max(0, ...folders.map((folder) => Number(folder.id) || 0)) + 1,
            nextTemplateId: Math.max(0, ...templates.map((template) => Number(template.id) || 0)) + 1,
        },
        todos,
        notes,
        folders,
        templates,
    };
};

const readStore = () => {
    if (typeof window === 'undefined') {
        return createDefaultStore();
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            const freshStore = createDefaultStore();
            writeStore(freshStore);
            return freshStore;
        }

        const normalized = normalizeStore(JSON.parse(raw));
        writeStore(normalized);
        return normalized;
    } catch (error) {
        console.error('Failed to read local demo data. Resetting store.', error);
        const freshStore = createDefaultStore();
        writeStore(freshStore);
        return freshStore;
    }
};

const writeStore = (store) => {
    if (typeof window === 'undefined') {
        return store;
    }

    const normalized = normalizeStore(store);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
};

const warnAboutFallback = (error) => {
    if (hasWarnedAboutFallback) {
        return;
    }

    console.warn('Remote API unavailable. Falling back to browser storage.', error);
    hasWarnedAboutFallback = true;
};

const fetchRemote = async (path, options) => {
    if (!API_URL) {
        return null;
    }

    try {
        return await fetch(`${API_URL}${path}`, options);
    } catch (error) {
        warnAboutFallback(error);
        return null;
    }
};

const getTodosByDateLocal = async (dateStr) => {
    const store = readStore();
    return store.todos.filter((todo) => todo.date_str === dateStr);
};

const createTodoLocal = async (todoData) => {
    const store = readStore();
    const todo = {
        id: store.meta.nextTodoId,
        owner_id: DEFAULT_OWNER_ID,
        completed: false,
        time_str: null,
        ...todoData,
    };
    store.meta.nextTodoId += 1;
    store.todos.push(todo);
    writeStore(store);
    return todo;
};

const toggleTodoLocal = async (todoId) => {
    const store = readStore();
    const todo = store.todos.find((item) => item.id === todoId);
    if (!todo) {
        return null;
    }

    todo.completed = !todo.completed;
    writeStore(store);
    return todo;
};

const deleteTodoLocal = async (todoId) => {
    const store = readStore();
    const before = store.todos.length;
    store.todos = store.todos.filter((todo) => todo.id !== todoId);
    writeStore(store);
    return before !== store.todos.length;
};

const getRecentNotesLocal = async (limit = 10) => {
    const store = readStore();
    return [...store.notes]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
};

const getNotesByDateLocal = async (dateStr) => {
    const store = readStore();
    return store.notes.filter((note) => note.date_str === dateStr);
};

const saveNoteLocal = async (noteData) => {
    const store = readStore();
    const note = {
        id: store.meta.nextNoteId,
        owner_id: DEFAULT_OWNER_ID,
        folder_id: null,
        content: '',
        created_at: new Date().toISOString(),
        ...noteData,
    };
    store.meta.nextNoteId += 1;
    store.notes.push(note);
    writeStore(store);
    return note;
};

const updateNoteLocal = async (noteId, noteData) => {
    const store = readStore();
    const note = store.notes.find((item) => item.id === noteId);
    if (!note) {
        return null;
    }

    Object.assign(note, noteData);
    writeStore(store);
    return note;
};

const moveNoteToFolderLocal = async (noteId, folderId) => {
    const store = readStore();
    const note = store.notes.find((item) => item.id === noteId);
    if (!note) {
        return null;
    }

    note.folder_id = folderId > 0 ? folderId : null;
    writeStore(store);
    return note;
};

const deleteNoteLocal = async (noteId) => {
    const store = readStore();
    const before = store.notes.length;
    store.notes = store.notes.filter((note) => note.id !== noteId);
    writeStore(store);
    return before !== store.notes.length;
};

const getFoldersLocal = async () => {
    const store = readStore();
    return sortFolders(store.folders);
};

const createFolderLocal = async (folderData) => {
    const store = readStore();
    const folder = {
        id: store.meta.nextFolderId,
        owner_id: DEFAULT_OWNER_ID,
        order_index: store.folders.length,
        ...folderData,
    };
    store.meta.nextFolderId += 1;
    store.folders.push(folder);
    writeStore(store);
    return folder;
};

const updateFolderLocal = async (folderId, folderData) => {
    const store = readStore();
    const folder = store.folders.find((item) => item.id === folderId);
    if (!folder) {
        return null;
    }

    Object.assign(folder, folderData);
    store.folders = sortFolders(store.folders);
    writeStore(store);
    return folder;
};

const getNotesByFolderLocal = async (folderId) => {
    const store = readStore();
    return store.notes.filter((note) => note.folder_id === folderId);
};

const deleteFolderLocal = async (folderId) => {
    const store = readStore();
    const before = store.folders.length;
    store.folders = store.folders.filter((folder) => folder.id !== folderId);
    store.notes = store.notes.map((note) => (
        note.folder_id === folderId ? { ...note, folder_id: null } : note
    ));
    writeStore(store);
    return before !== store.folders.length;
};

const getTemplatesLocal = async () => {
    const store = readStore();
    return store.templates;
};

// --- TODOS ---
export const getTodosByDate = async (dateStr) => {
    const res = await fetchRemote(`/todos/${dateStr}`);
    if (res) {
        return res.ok ? await res.json() : [];
    }

    return getTodosByDateLocal(dateStr);
};

export const createTodo = async (todoData) => {
    const res = await fetchRemote('/todos/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todoData),
    });
    if (res) {
        return res.ok ? await res.json() : null;
    }

    return createTodoLocal(todoData);
};

export const toggleTodo = async (todoId) => {
    const res = await fetchRemote(`/todos/${todoId}/toggle`, { method: 'PUT' });
    if (res) {
        return res.ok ? await res.json() : null;
    }

    return toggleTodoLocal(todoId);
};

export const deleteTodo = async (todoId) => {
    const res = await fetchRemote(`/todos/${todoId}`, { method: 'DELETE' });
    if (res) {
        return res.ok;
    }

    return deleteTodoLocal(todoId);
};

// --- NOTES ---
export const getRecentNotes = async (limit = 10) => {
    const res = await fetchRemote(`/notes/recent/?limit=${limit}`);
    if (res) {
        return res.ok ? await res.json() : [];
    }

    return getRecentNotesLocal(limit);
};

export const getNotesByDate = async (dateStr) => {
    const res = await fetchRemote(`/notes/${dateStr}`);
    if (res) {
        return res.ok ? await res.json() : [];
    }

    return getNotesByDateLocal(dateStr);
};

export const saveNote = async (noteData) => {
    const res = await fetchRemote('/notes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
    });
    if (res) {
        return res.ok ? await res.json() : null;
    }

    return saveNoteLocal(noteData);
};

export const updateNote = async (noteId, noteData) => {
    const res = await fetchRemote(`/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
    });
    if (res) {
        return res.ok ? await res.json() : null;
    }

    return updateNoteLocal(noteId, noteData);
};

export const moveNoteToFolder = async (noteId, folderId) => {
    const res = await fetchRemote(`/notes/${noteId}/move/${folderId}`, { method: 'PUT' });
    if (res) {
        return res.ok ? await res.json() : null;
    }

    return moveNoteToFolderLocal(noteId, folderId);
};

export const deleteNote = async (noteId) => {
    const res = await fetchRemote(`/notes/${noteId}`, { method: 'DELETE' });
    if (res) {
        return res.ok;
    }

    return deleteNoteLocal(noteId);
};

// --- FOLDERS ---
export const getFolders = async () => {
    const res = await fetchRemote('/folders/');
    if (res) {
        return res.ok ? await res.json() : [];
    }

    return getFoldersLocal();
};

export const createFolder = async (folderData) => {
    const res = await fetchRemote('/folders/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderData),
    });
    if (res) {
        return res.ok ? await res.json() : null;
    }

    return createFolderLocal(folderData);
};

export const updateFolder = async (folderId, folderData) => {
    const res = await fetchRemote(`/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderData),
    });
    if (res) {
        return res.ok ? await res.json() : null;
    }

    return updateFolderLocal(folderId, folderData);
};

export const getNotesByFolder = async (folderId) => {
    const res = await fetchRemote(`/notes/folder/${folderId}`);
    if (res) {
        return res.ok ? await res.json() : [];
    }

    return getNotesByFolderLocal(folderId);
};

export const deleteFolder = async (folderId) => {
    const res = await fetchRemote(`/folders/${folderId}`, { method: 'DELETE' });
    if (res) {
        return res.ok;
    }

    return deleteFolderLocal(folderId);
};

// --- TEMPLATES ---
export const getTemplates = async () => {
    const res = await fetchRemote('/templates/');
    if (res) {
        return res.ok ? await res.json() : [];
    }

    return getTemplatesLocal();
};
