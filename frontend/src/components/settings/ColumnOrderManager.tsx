import React, { useState, useRef, DragEvent, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext.tsx';
import { ColumnConfig, ALL_STUDENT_COLUMNS } from '@/config/studentTableConfig.tsx';
import Button from '@/components/ui/Button.tsx';
import { MenuIcon } from '@/components/Icons.tsx';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';

// A type for managing columns in the settings UI
type ManagedColumn = ColumnConfig & { isVisible: boolean };

const ColumnOrderManager: React.FC = () => {
    const { studentTableColumns, setStudentTableColumns, resetStudentTableColumns } = useSettings();
    const { showToast } = useNotification();
    
    // This local state will hold all possible columns, with their visibility and order
    const [managedColumns, setManagedColumns] = useState<ManagedColumn[]>([]);

    // Refs for drag and drop
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    // Initialize or reset the local state when the context changes
    useEffect(() => {
        const visibleColumnIds = new Set(studentTableColumns.map(c => c.id));
        
        // Start with the currently visible columns in their correct order
        const visibleAndOrdered = studentTableColumns.map(c => ({ ...c, isVisible: true }));

        // Add the remaining hidden columns
        const hidden = ALL_STUDENT_COLUMNS
            .filter(c => !visibleColumnIds.has(c.id))
            .map(c => ({ ...c, isVisible: false }));
        
        setManagedColumns([...visibleAndOrdered, ...hidden]);
    }, [studentTableColumns]);

    const handleDragStart = (_: DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
    };

    const handleDragEnter = (_: DragEvent<HTMLDivElement>, index: number) => {
        if (dragItem.current === null || dragItem.current === index) return;
        
        dragOverItem.current = index;
        const newColumns = [...managedColumns];
        const draggedItemContent = newColumns.splice(dragItem.current, 1)[0];
        newColumns.splice(dragOverItem.current, 0, draggedItemContent);
        dragItem.current = dragOverItem.current;
        dragOverItem.current = null;
        setManagedColumns(newColumns);
    };

    const handleDragEnd = () => {
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleVisibilityChange = (id: string, isVisible: boolean) => {
        setManagedColumns(prev => 
            prev.map(col => col.id === id ? { ...col, isVisible } : col)
        );
    };

    const handleSave = () => {
        const visibleColumnIds = managedColumns
            .filter(c => c.isVisible)
            .map(c => c.id as string);
        
        if (visibleColumnIds.length === 0) {
            showToast('Please select at least one column to display.', 'error');
            return;
        }

        setStudentTableColumns(visibleColumnIds);
        showToast('Column settings saved!', 'success');
    };

    const handleReset = () => {
        resetStudentTableColumns();
        showToast('Column settings have been reset to default.', 'info');
    };

    return (
        <Card>
            <CardContent>
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Customize Student Table Columns</h3>
                <p className="text-sm text-body-color dark:text-gray-300 mb-6">
                    Select the columns to display and drag them to reorder.
                </p>
                <div className="space-y-2">
                    {managedColumns.map((col, index) => (
                        <div
                            key={col.id as string}
                            className="flex items-center p-2 bg-gray-2 dark:bg-box-dark-2 rounded-lg"
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <span className="cursor-grab active:cursor-grabbing text-gray-500" aria-label={`Drag to reorder ${col.label}`}>
                                <MenuIcon className="w-5 h-5" />
                            </span>
                             <label htmlFor={`col-${col.id}`} className="ml-2 flex-1 flex cursor-pointer items-center">
                                <div className="relative pt-0.5">
                                    <input 
                                        type="checkbox" 
                                        id={`col-${col.id}`} 
                                        className="sr-only" 
                                        checked={col.isVisible}
                                        onChange={(e) => handleVisibilityChange(col.id as string, e.target.checked)}
                                    />
                                    <div className={`mr-2 flex h-5 w-5 items-center justify-center rounded border ${col.isVisible ? 'border-primary bg-primary' : 'border-gray-400'}`}>
                                        <span className={`h-2.5 w-2.5 rounded-sm ${col.isVisible && 'bg-white'}`}></span>
                                    </div>
                                </div>
                                <span className="text-black dark:text-white">{col.label}</span>
                            </label>
                        </div>
                    ))}
                </div>
                 <div className="flex justify-end gap-2 mt-6">
                    <Button onClick={handleReset} variant="ghost">
                        Reset to Default
                    </Button>
                    <Button onClick={handleSave}>
                        Save Settings
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default ColumnOrderManager;