import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus.ts';
import * as db from '@/utils/db.ts';
import { api } from '@/services/api.ts';
import { useNotification } from './NotificationContext.tsx';
import { Task, Sponsor, Student } from '@/types.ts';

interface QueuedChange {
    id: number;
    type: string;
    payload: any;
    timestamp: number;
}

interface OfflineContextType {
    isOnline: boolean;
    pendingChangesCount: number;
    isSyncing: boolean;
    queueChange: (change: Omit<QueuedChange, 'id'>) => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const isOnline = useOnlineStatus();
    const [pendingChanges, setPendingChanges] = useState<QueuedChange[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const { showToast } = useNotification();

    const loadPendingChanges = useCallback(async () => {
        try {
            const changes = await db.getChanges();
            setPendingChanges(changes);
        } catch (error) {
            console.error("Failed to load pending changes from DB", error);
        }
    }, []);

    useEffect(() => {
        loadPendingChanges();
    }, [loadPendingChanges]);

    const queueChange = async (change: Omit<QueuedChange, 'id'>) => {
        await db.addChange(change);
        await loadPendingChanges();
    };
    
    const processQueue = useCallback(async () => {
        if (isSyncing || pendingChanges.length === 0) return;

        setIsSyncing(true);
        showToast(`Syncing ${pendingChanges.length} offline change(s)...`, 'info');

        const changesToProcess = [...pendingChanges];
        const results = [];
        const createdMappings: Record<string, any> = {};

        for (const change of changesToProcess) {
            try {
                let apiResponse;
                switch(change.type) {
                    case 'DELETE_STUDENT':
                        await api.deleteStudent(change.payload.studentId);
                        break;
                    case 'CREATE_STUDENT': {
                        const { studentId: tempId, ...createPayload } = change.payload;
                        apiResponse = await api.addStudent(createPayload);
                        createdMappings[tempId] = apiResponse;
                        break;
                    }
                    case 'UPDATE_STUDENT':
                        await api.updateStudent(change.payload as Partial<Student> & { studentId: string });
                        break;
                    case 'CREATE_TASK': {
                        const { id: tempId, ...createPayload } = change.payload;
                        apiResponse = await api.addTask(createPayload);
                        createdMappings[tempId] = apiResponse;
                        break;
                    }
                    case 'UPDATE_TASK':
                        await api.updateTask(change.payload as Task);
                        break;
                    case 'DELETE_TASK':
                        await api.deleteTask(change.payload.id);
                        break;
                    case 'CREATE_SPONSOR': {
                        const { id: tempId, ...createPayload } = change.payload;
                        apiResponse = await api.addSponsor(createPayload);
                        createdMappings[tempId] = apiResponse;
                        break;
                    }
                    case 'UPDATE_SPONSOR':
                        await api.updateSponsor(change.payload as Sponsor);
                        break;
                    case 'DELETE_SPONSOR':
                        await api.deleteSponsor(change.payload.id);
                        break;
                }
                await db.deleteChange(change.id);
                results.push({ ...change, status: 'success' });
            } catch (error) {
                console.error('Failed to sync change:', change, error);
                results.push({ ...change, status: 'failed', error });
            }
        }
        
        await loadPendingChanges(); // Reload from DB to confirm what's left
        setIsSyncing(false);
        
        const successes = results.filter(r => r.status === 'success').length;
        const failures = results.filter(r => r.status === 'failed').length;

        if (successes > 0) {
            showToast(`${successes} change(s) synced successfully.`, 'success');
            // Dispatch a global event for components to refetch or perform smart updates
            window.dispatchEvent(new CustomEvent('offline-sync-complete', {
                detail: { created: createdMappings }
            }));
        }
        if (failures > 0) {
            showToast(`${failures} change(s) failed to sync. They remain queued.`, 'error');
        }

    }, [isSyncing, pendingChanges, showToast, loadPendingChanges]);

    useEffect(() => {
        if (isOnline && pendingChanges.length > 0 && !isSyncing) {
            processQueue();
        }
    }, [isOnline, pendingChanges, processQueue, isSyncing]);

    const value = {
        isOnline,
        pendingChangesCount: pendingChanges.length,
        isSyncing,
        queueChange,
    };

    return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
};

export const useOffline = (): OfflineContextType => {
    const context = useContext(OfflineContext);
    if (!context) {
        throw new Error('useOffline must be used within an OfflineProvider');
    }
    return context;
};