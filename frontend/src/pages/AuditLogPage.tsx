import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api.ts';
import { AuditLog, PaginatedResponse, AuditAction } from '@/types.ts';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { SkeletonTable } from '@/components/SkeletonLoader.tsx';
import { useTableControls } from '@/hooks/useTableControls.ts';
import Pagination from '@/components/Pagination.tsx';
import PageHeader from '@/components/layout/PageHeader.tsx';
import Badge from '@/components/ui/Badge.tsx';
import EmptyState from '@/components/EmptyState.tsx';
import AdvancedFilter, { FilterOption } from '@/components/AdvancedFilter.tsx';
import ActiveFiltersDisplay from '@/components/ActiveFiltersDisplay.tsx';
import AuditLogDetailModal from '@/components/AuditLogDetailModal.tsx';
import { ArrowUpIcon, ArrowDownIcon } from '@/components/Icons.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';

const AuditLogPage: React.FC = () => {
    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<AuditLog> | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const { showToast } = useNotification();

    const {
        sortConfig, currentPage, filters, apiQueryString,
        handleSort, setCurrentPage, handleFilterChange, applyFilters, clearFilters
    } = useTableControls<AuditLog>({
        initialSortConfig: { key: 'timestamp', order: 'desc' },
        initialFilters: { action: '', object_type: '' }
    });
    
    // In a real app, this list would come from the backend or a shared config
    const objectTypeOptions = [
        { value: 'student', label: 'Student' },
        { value: 'transaction', label: 'Transaction' },
        { value: 'academicreport', label: 'Academic Report' },
        { value: 'followuprecord', label: 'Follow-Up Record' },
        { value: 'governmentfiling', label: 'Filing' },
        { value: 'task', label: 'Task' },
    ];

    const filterOptions: FilterOption[] = [
        { id: 'action', label: 'Action', options: Object.values(AuditAction).map(a => ({ value: a, label: a })) },
        { id: 'object_type', label: 'Object Type', options: objectTypeOptions }
    ];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getAuditLogs(apiQueryString);
            setPaginatedData(data);
        } catch (error: any) {
            showToast(error.message || 'Failed to load audit logs.', 'error');
        } finally {
            setLoading(false);
        }
    }, [apiQueryString, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const logs = paginatedData?.results || [];
    const totalPages = paginatedData ? Math.ceil(paginatedData.count / 15) : 1;

    if (loading && !paginatedData) {
        return (
            <>
                <PageHeader title="Audit Log" />
                <SkeletonTable rows={15} cols={5} />
            </>
        );
    }
    
    const renderChangesSummary = (log: AuditLog) => {
        if (log.action === 'CREATE') return 'Record created.';
        if (log.action === 'DELETE') return 'Record deleted.';
        if (log.action === 'UPDATE' && log.changes) {
            const changedKeys = Object.keys(log.changes);
            if (changedKeys.length === 0) return 'No changes detected.';
            const summary = `Updated ${changedKeys.slice(0, 2).join(', ')}`;
            return changedKeys.length > 2 ? `${summary}, and ${changedKeys.length - 2} more...` : summary;
        }
        return 'N/A';
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Audit Log" />
            <Card>
                <CardContent className="flex flex-col sm:flex-row justify-start items-center gap-4">
                    <AdvancedFilter
                        filterOptions={filterOptions}
                        currentFilters={filters}
                        onApply={applyFilters}
                        onClear={clearFilters}
                    />
                </CardContent>
            </Card>
            
            <Card>
                <CardContent>
                    <ActiveFiltersDisplay activeFilters={filters} onRemoveFilter={(key) => handleFilterChange(key, '')} />
                    <div className="overflow-x-auto mt-4">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-2 dark:bg-box-dark-2">
                                    {(['timestamp', 'userIdentifier', 'action', 'objectRepr', 'changes'] as const).map(key => (
                                        <th key={key} className="py-4 px-4 font-medium text-black dark:text-white">
                                            <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort(key === 'objectRepr' ? 'object_repr' : key)}>
                                                {String(key).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                {sortConfig?.key === key && (sortConfig.order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />)}
                                            </button>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                             <tbody>
                                {logs.length > 0 ? logs.map((log) => (
                                    <tr 
                                        key={log.id} 
                                        className="hover:bg-gray-2 dark:hover:bg-box-dark-2"
                                    >
                                        <td className="py-5 px-4 text-body-color dark:text-gray-300 border-b border-stroke dark:border-strokedark">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="py-5 px-4 text-body-color dark:text-gray-300 border-b border-stroke dark:border-strokedark">{log.userIdentifier}</td>
                                        <td className="py-5 px-4 border-b border-stroke dark:border-strokedark"><Badge type={log.action} /></td>
                                        <td className="py-5 px-4 text-black dark:text-white border-b border-stroke dark:border-strokedark">
                                            <div>
                                                {log.action === 'UPDATE' && log.changes ? (
                                                     <button onClick={() => setSelectedLog(log)} className="font-medium text-primary hover:underline text-left">
                                                        {log.objectRepr}
                                                    </button>
                                                ) : (
                                                    <p className="font-medium">{log.objectRepr}</p>
                                                )}
                                                <p className="text-sm text-body-color dark:text-gray-400 capitalize">{log.contentType.replace('report', ' report')}</p>
                                            </div>
                                        </td>
                                        <td className="py-5 px-4 text-body-color dark:text-gray-300 border-b border-stroke dark:border-strokedark text-sm italic">{renderChangesSummary(log)}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5}>
                                            <EmptyState title="No Audit Logs Found" />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {logs.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
                </CardContent>
            </Card>
            
            <AuditLogDetailModal logEntry={selectedLog} onClose={() => setSelectedLog(null)} />
        </div>
    );
};
export default AuditLogPage;