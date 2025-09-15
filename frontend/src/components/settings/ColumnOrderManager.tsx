import React, { useState, useRef, DragEvent, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext.tsx';
import { ColumnConfig } from '@/config/studentTableConfig.tsx';
import Button from '@/components/ui/Button.tsx';
import { MenuIcon } from '@/components/Icons.tsx';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';

const ColumnOrderManager: React.FC = () => {
    const { studentTableColumns, setStudentTableColumns, resetStudentTableColumns } = useSettings();
    const [columns, setColumns] = useState<ColumnConfig[]>(studentTableColumns);
    const { showToast } = useNotification();
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragStart = (_: DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
    };

    const handleDragEnter = (_: DragEvent<HTMLDivElement>, index: number) => {
        if (dragItem.current === null || dragItem.current === index) return;
        
        dragOverItem.current = index;
        const newColumns = [...columns];
        const draggedItemContent = newColumns.splice(dragItem.current!, 1)[0];
        newColumns.splice(dragOverItem.current!, 0, draggedItemContent);
        dragItem.current = dragOverItem.current;
        dragOverItem.current = null;
        setColumns(newColumns);
    };

    const handleDragEnd = () => {
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleSave = () => {
        const columnIds = columns.map(c => c.id);
        setStudentTableColumns(columnIds);
        showToast('Column order saved!', 'success');
    };

    const handleReset = () => {
        resetStudentTableColumns();
        showToast('Column order has been reset to default.', 'info');
    };
    
    useEffect(() => {
        setColumns(studentTableColumns);
    }, [studentTableColumns]);

    return (
        <Card>
            <CardContent>
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Customize Student Table Columns</h3>
                <p className="text-sm text-body-color dark:text-gray-300 mb-6">
                    Drag and drop to reorder the columns as they appear on the Students page.
                </p>
                <div className="space-y-2">
                    {columns.map((col, index) => (
                        <div
                            key={col.id}
                            className="flex items-center p-3 bg-gray-2 dark:bg-box-dark-2 rounded-lg cursor-grab active:cursor-grabbing"
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <MenuIcon className="w-5 h-5 mr-3 text-gray-500" />
                            <span className="text-black dark:text-white">{col.label}</span>
                        </div>
                    ))}
                </div>
                 <div className="flex justify-end gap-2 mt-6">
                    <Button onClick={handleReset} variant="ghost">
                        Reset to Default
                    </Button>
                    <Button onClick={handleSave}>
                        Save Order
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default ColumnOrderManager;
