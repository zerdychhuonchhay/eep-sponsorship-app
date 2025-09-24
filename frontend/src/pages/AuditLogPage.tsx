import React, { useState } from 'react';
import { api } from '@/services/api.ts';
import { AuditLog, AuditAction } from '@/types.ts';
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
import { usePaginatedData } from '@/hooks/usePaginatedData.ts';
import DataWrapper from '@/components/DataWrapper.tsx';

const AuditLogPage: React.FC = () => {
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const { showToast } = useNotification();

    const {
        sortConfig, currentPage, filters, apiQueryString,
        handleSort, setCurrentPage, handleFilterChange, applyFilters, clearFilters
    } = useTableControls<AuditLog>({
        initialSortConfig: { key: 'timestamp', order: 'desc' },
        initialFilters: { action: '', object_type: '' }
    });

     const { 
        data: paginatedData, isLoading, isStale 
    } = usePaginatedData<AuditLog>({
        fetcher: api.getAuditLogs,
        apiQueryString,
        currentPage,
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
    
    const logs = paginatedData?.results || [];
    const totalPages = paginatedData ? Math.ceil(paginatedData.count / 15) : 1;
    
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
                <CardContent>
                     <div className="p-4 mb-4 rounded-lg bg-gray-2 dark:bg-box-dark-2 border border-stroke dark:border-strokedark">
                        <div className="flex justify-end">
                            <AdvancedFilter
                                filterOptions={filterOptions}
                                currentFilters={filters}
                                onApply={applyFilters}
                                onClear={clearFilters}
                            />
                        </div>
                        <ActiveFiltersDisplay activeFilters={filters} onRemoveFilter={(key) => handleFilterChange(key, '')} />
                    </div>
                    {isLoading ? (
                        <SkeletonTable rows={15} cols={5} />
                    ) : (
                        <DataWrapper isStale={isStale}>
                            {logs.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="ui-table">
                                            <thead>
                                                <tr>
                                                    {(['timestamp', 'userIdentifier', 'action', 'objectRepr', 'changes'] as const).map(key => (
                                                        <th key={key}>
                                                            <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort(key === 'objectRepr' ? 'object_repr' : key)}>
                                                                {String(key).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                                {sortConfig?.key === key && (sortConfig.order === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />)}
                                                            </button>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {logs.map((log) => (
                                                    <tr key={log.id}>
                                                        <td className="text-body-color">{new Date(log.timestamp).toLocaleString()}</td>
                                                        <td className="text-body-color">{log.userIdentifier}</td>
                                                        <td><Badge type={log.action} /></td>
                                                        <td>
                                                            <div>
                                                                {log.action === 'UPDATE' && log.changes ? (
                                                                    <button onClick={() => setSelectedLog(log)} className="font-medium text-primary hover:underline text-left">
                                                                        {log.objectRepr}
                                                                    </button>
                                                                ) : (
                                                                    <p className="font-medium">{log.objectRepr}</p>
                                                                )}
                                                                <p className="text-sm text-body-color capitalize">{log.contentType.replace('report', ' report')}</p>
                                                            </div>
                                                        </td>
                                                        <td className="text-body-color text-sm italic">{renderChangesSummary(log)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                                </>
                            ) : (
                                <EmptyState title="No Audit Logs Found" />
                            )}
                        </DataWrapper>
                    )}
                </CardContent>
            </Card>
            
            <AuditLogDetailModal logEntry={selectedLog} onClose={() => setSelectedLog(null)} />
        </div>
    );
};
export default AuditLogPage;
