import React from 'react';
import Modal from './Modal.tsx';
import { AuditLog } from '@/types.ts';

interface AuditLogDetailModalProps {
    logEntry: AuditLog | null;
    onClose: () => void;
}

const formatValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) return <i className="text-gray-400">empty</i>;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    // Check if it's a date string
    if (typeof value === 'string' && !isNaN(Date.parse(value)) && (value.includes('T') || value.match(/^\d{4}-\d{2}-\d{2}$/))) {
        return new Date(value).toLocaleString();
    }
    return String(value);
};

const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({ logEntry, onClose }) => {
    if (!logEntry || logEntry.action !== 'UPDATE' || !logEntry.changes) {
        return null;
    }

    return (
        <Modal isOpen={!!logEntry} onClose={onClose} title={`Changes for ${logEntry.objectRepr}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-2 dark:bg-box-dark-2">
                        <tr>
                            <th className="p-2 font-medium text-black dark:text-white">Field</th>
                            <th className="p-2 font-medium text-black dark:text-white">Old Value</th>
                            <th className="p-2 font-medium text-black dark:text-white">New Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(logEntry.changes).map(([field, values]) => (
                            <tr key={field} className="border-b border-stroke dark:border-strokedark">
                                <td className="p-2 capitalize font-medium text-black dark:text-white">{field.replace(/([A-Z])/g, ' $1')}</td>
                                <td className="p-2 text-body-color dark:text-gray-300">{formatValue((values as { old: any; new: any }).old)}</td>
                                <td className="p-2 text-black dark:text-white">{formatValue((values as { old: any; new: any }).new)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Modal>
    );
};

export default AuditLogDetailModal;
