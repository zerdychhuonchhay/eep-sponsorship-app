import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api.ts';
import { Sponsor, PaginatedResponse } from '@/types.ts';
import Modal from '@/components/Modal.tsx';
import { PlusIcon, ArrowUpIcon, ArrowDownIcon } from '@/components/Icons.tsx';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { SkeletonTable } from '@/components/SkeletonLoader.tsx';
import { useTableControls } from '@/hooks/useTableControls.ts';
import Pagination from '@/components/Pagination.tsx';
import PageHeader from '@/components/layout/PageHeader.tsx';
import Button from '@/components/ui/Button.tsx';
import EmptyState from '@/components/EmptyState.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import SponsorForm from '@/components/sponsors/SponsorForm.tsx';
import { useData } from '@/contexts/DataContext.tsx';
import { usePermissions } from '@/contexts/AuthContext.tsx';

const SponsorsPage: React.FC = () => {
    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<Sponsor> | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const { showToast } = useNotification();
    const navigate = useNavigate();
    const { refetchSponsorLookup } = useData();
    const { canCreate } = usePermissions('sponsors');

    const { 
        sortConfig, currentPage, apiQueryString, handleSort, setCurrentPage 
    } = useTableControls<Sponsor>({
        initialSortConfig: { key: 'name', order: 'asc' },
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getSponsors(apiQueryString);
            setPaginatedData(data);
        } catch (error: any) {
            showToast(error.message || 'Failed to load sponsor data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [apiQueryString, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async (sponsor: Omit<Sponsor, 'id' | 'sponsoredStudentCount'>) => {
        setIsSubmitting(true);
        try {
            await api.addSponsor(sponsor);
            showToast('Sponsor added successfully!', 'success');
            setIsAdding(false);
            fetchData();
            refetchSponsorLookup(); // Refresh global sponsor list
        } catch (error: any) {
            showToast(error.message || 'Failed to save sponsor.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const sponsors = paginatedData?.results || [];
    const totalPages = paginatedData ? Math.ceil(paginatedData.count / 15) : 1;

    if (loading && !paginatedData) {
        return (
            <>
                <PageHeader title="Sponsors" />
                <SkeletonTable rows={10} cols={4} />
            </>
        )
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Sponsors">
                {canCreate && (
                    <Button onClick={() => setIsAdding(true)} icon={<PlusIcon className="w-5 h-5" />}>
                        Add Sponsor
                    </Button>
                )}
            </PageHeader>
           
            <Card>
                <CardContent>
                    <div className="overflow-x-auto mt-4">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-2 dark:bg-box-dark-2">
                                    {(['name', 'email', 'sponsorshipStartDate', 'sponsoredStudentCount'] as (keyof Sponsor)[]).map(key => (
                                        <th key={key as string} className="py-4 px-4 font-medium text-black dark:text-white">
                                            <button className="flex items-center gap-1 w-full hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort(key as keyof Sponsor)}>
                                                {String(key).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                {sortConfig?.key === key && (sortConfig.order === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />)}
                                            </button>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sponsors.length > 0 ? sponsors.map((sponsor) => (
                                    <tr 
                                        key={sponsor.id} 
                                        className="hover:bg-gray-2 dark:hover:bg-box-dark-2"
                                    >
                                        <td className="py-5 px-4 text-black dark:text-white border-b border-stroke dark:border-strokedark">
                                            <button onClick={() => navigate(`/sponsors/${sponsor.id}`)} className="font-medium text-primary hover:underline text-left">
                                                {sponsor.name}
                                            </button>
                                        </td>
                                        <td className="py-5 px-4 text-body-color dark:text-gray-300 border-b border-stroke dark:border-strokedark">{sponsor.email}</td>
                                        <td className="py-5 px-4 text-body-color dark:text-gray-300 border-b border-stroke dark:border-strokedark">{new Date(sponsor.sponsorshipStartDate).toLocaleDateString()}</td>
                                        <td className="py-5 px-4 text-body-color dark:text-gray-300 border-b border-stroke dark:border-strokedark">{sponsor.sponsoredStudentCount}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4}>
                                            <EmptyState title="No Sponsors Found" message="Add your first sponsor to get started." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {sponsors.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
                </CardContent>
            </Card>

            <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title={'Add New Sponsor'}>
                <SponsorForm
                    onSave={handleSave} 
                    onCancel={() => setIsAdding(false)} 
                    isSubmitting={isSubmitting}
                />
            </Modal>
        </div>
    );
};

export default SponsorsPage;