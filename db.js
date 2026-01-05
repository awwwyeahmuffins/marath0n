// IndexedDB wrapper for marathon tracker

const DB_NAME = 'marathonTracker';
const DB_VERSION = 1;
const META_STORE = 'meta';
const ACTIVITIES_STORE = 'activities';

let db = null;

// Initialize database
async function initDB() {
    if (db) return db;
    
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create meta store (key-value pairs)
            if (!db.objectStoreNames.contains(META_STORE)) {
                db.createObjectStore(META_STORE);
            }
            
            // Create activities store
            if (!db.objectStoreNames.contains(ACTIVITIES_STORE)) {
                const activitiesStore = db.createObjectStore(ACTIVITIES_STORE, { keyPath: 'id' });
                activitiesStore.createIndex('date', 'date', { unique: false });
                activitiesStore.createIndex('kind', 'kind', { unique: false });
                activitiesStore.createIndex('dateKind', ['date', 'kind'], { unique: false });
            }
        };
    });
}

// Get meta value
async function getMeta(key) {
    await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([META_STORE], 'readonly');
        const store = transaction.objectStore(META_STORE);
        const request = store.get(key);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

// Set meta value
async function setMeta(key, value) {
    await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([META_STORE], 'readwrite');
        const store = transaction.objectStore(META_STORE);
        const request = store.put(value, key);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

// Generate UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Save activity
async function saveActivity(activity) {
    await initDB();
    
    if (!activity.id) {
        activity.id = generateUUID();
    }
    if (!activity.createdAt) {
        activity.createdAt = new Date().toISOString();
    }
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([ACTIVITIES_STORE], 'readwrite');
        const store = transaction.objectStore(ACTIVITIES_STORE);
        const request = store.put(activity);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(activity.id);
    });
}

// Get activities with filters
async function getActivities(filters = {}) {
    await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([ACTIVITIES_STORE], 'readonly');
        const store = transaction.objectStore(ACTIVITIES_STORE);
        let request;
        
        if (filters.date) {
            // Query by date
            const index = store.index('date');
            request = index.getAll(filters.date);
        } else if (filters.kind) {
            // Query by kind
            const index = store.index('kind');
            request = index.getAll(filters.kind);
        } else if (filters.dateRange) {
            // Query by date range
            const index = store.index('date');
            const range = IDBKeyRange.bound(
                filters.dateRange.start,
                filters.dateRange.end,
                false,
                false
            );
            request = index.getAll(range);
        } else {
            // Get all
            request = store.getAll();
        }
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            let results = request.result;
            
            // Additional filtering
            if (filters.kind && !filters.date) {
                results = results.filter(a => a.kind === filters.kind);
            }
            
            // Sort by date descending, then by createdAt
            results.sort((a, b) => {
                if (a.date !== b.date) {
                    return b.date.localeCompare(a.date);
                }
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            
            resolve(results);
        };
    });
}

// Export all data as JSON
async function exportData() {
    await initDB();
    
    const meta = {};
    const activities = await getActivities();
    
    // Get all meta keys
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([META_STORE], 'readonly');
        const store = transaction.objectStore(META_STORE);
        const request = store.openCursor();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                meta[cursor.key] = cursor.value;
                cursor.continue();
            } else {
                resolve({
                    version: 1,
                    exportedAt: new Date().toISOString(),
                    meta,
                    activities
                });
            }
        };
    });
}

// Import data from JSON
async function importData(json) {
    await initDB();
    
    if (!json.meta || !json.activities) {
        throw new Error('Invalid data format');
    }
    
    // Clear existing data
    await clearAll();
    
    // Import meta
    for (const [key, value] of Object.entries(json.meta)) {
        await setMeta(key, value);
    }
    
    // Import activities
    const transaction = db.transaction([ACTIVITIES_STORE], 'readwrite');
    const store = transaction.objectStore(ACTIVITIES_STORE);
    
    for (const activity of json.activities) {
        await new Promise((resolve, reject) => {
            const request = store.put(activity);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    
    return transaction.complete;
}

// Clear all data
async function clearAll() {
    await initDB();
    
    // Clear activities
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([ACTIVITIES_STORE, META_STORE], 'readwrite');
        
        transaction.objectStore(ACTIVITIES_STORE).clear();
        transaction.objectStore(META_STORE).clear();
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

