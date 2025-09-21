import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api.ts';
import { Sponsor, PaginatedResponse } from '@/types.ts';
import Modal from '@/components/Modal.tsx';
import { PlusIcon, ArrowUpIcon, ArrowDownIcon } from '@/components/Icons.tsx';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { SkeletonCard, SkeletonTable } from '@/components/SkeletonLoader.tsx';
import { useTableControls } from '@/hooks/useTableControls.ts';
import Pagination from '@/components/Pagination.tsx';
import PageHeader from '@/components/layout/PageHeader.tsx';
import Button from '@/components/ui/Button.tsx';
import EmptyState from '@/components/EmptyState.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import SponsorForm from '@/components/sponsors/SponsorForm.tsx';
import { useData } from '@/contexts/DataContext.tsx';
import { usePermissions } from '@/contexts/AuthContext.tsx';
import SponsorCard from '@/components/sponsors/SponsorCard.tsx';
import useMediaQuery from '@/hooks/useMediaQuery.ts';
import SponsorSwipeView from '@/components/sponsors/SponsorSwipeView.tsx';
import { useSettings } from '@/contexts/SettingsContext.tsx';
import ViewToggle from '@/components/ui/ViewToggle.tsx';
import { formatDateForDisplay } from '@/utils/dateUtils.ts';

const SponsorsPage: React.FC = () => {
    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<Sponsor> | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const { showToast } = useNotification();
    const { refetchSponsorLookup } = useData();
    const { canCreate } = usePermissions('sponsors');
    const isMobile = useMediaQuery('(max-width: 767px)');
    const [allFetchedSponsors, setAllFetchedSponsors] = useState<Sponsor[]>([]);
    const { sponsorViewMode, setSponsorViewMode } = useSettings();
    const navigate = useNavigate();

    const { 
        currentPage, apiQueryString, setCurrentPage, handleSort, sortConfig
    } = useTableControls<Sponsor>({
        initialSortConfig: { key: 'name', order: 'asc' },
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getSponsors(apiQueryString);
            setPaginatedData(data);
            if (isMobile) {
                if (currentPage === 1) {
                    setAllFetchedSponsors(data.results);
                } else {
                    setAllFetchedSponsors(prev => {
                        const existingIds = new Set(prev.map(s => s.id));
                        const newSponsors = data.results.filter(s => !existingIds.has(s.id));
                        return [...prev, ...newSponsors];
                    });
                }
            }
        } catch (error: any) {
            showToast(error.message || 'Failed to load sponsor data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [apiQueryString, showToast, isMobile, currentPage]);

    useEffect(() => {
        if (currentPage === 1) {
            setAllFetchedSponsors([]);
        }
    }, [apiQueryString]);

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
            refetchSponsorLookup();
        } catch (error: any) {
            showToast(error.message || 'Failed to save sponsor.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const sponsors = paginatedData?.results || [];
    const totalPages = paginatedData ? Math.ceil(paginatedData.count / 15) : 1;

    const renderDesktopSkeletons = () => {
        if (sponsorViewMode === 'card') {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            );
        }
        return <SkeletonTable rows={10} cols={4} />;
    };
    
    const isInitialLoadAndEmpty = !loading && sponsors.length === 0;

    return (
        <div className="space-y-6">
            <PageHeader title="Sponsors">
                {canCreate && (
                    <Button 
                        onClick={() => setIsAdding(true)} 
                        icon={<PlusIcon className="w-5 h-5" />}
                        aria-label="Add Sponsor"
                    >
                        <span className="hidden sm:inline">Add Sponsor</span>
                    </Button>
                )}
            </PageHeader>
           
            {isMobile ? (
                <SponsorSwipeView
                    sponsors={allFetchedSponsors}
                    isLoading={loading && allFetchedSponsors.length === 0}
                    loadMore={() => {
                        if (!loading && currentPage < totalPages) {
                            setCurrentPage(prev => prev + 1);
                        }
                    }}
                    hasMore={currentPage < totalPages}
                />
            ) : (
                <Card>
                    <CardContent>
                        <div className="flex justify-end p-4">
                            <ViewToggle view={sponsorViewMode} onChange={setSponsorViewMode} />
                        </div>
                        {loading ? renderDesktopSkeletons() : isInitialLoadAndEmpty ? (
                            <EmptyState title="No Sponsors Found" message="Add your first sponsor to get started." />
                        ) : sponsorViewMode === 'card' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {sponsors.map((sponsor) => (
                                    <SponsorCard key={sponsor.id} sponsor={sponsor} />
                                ))}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="ui-table">
                                    <thead>
                                        <tr>
                                            {(['name', 'email', 'sponsorshipStartDate', 'sponsoredStudentCount'] as const).map(key => (
                                                <th key={key}>
                                                    <button className="flex items-center gap-1 hover:text-primary" onClick={() => handleSort(key)}>
                                                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                        {sortConfig?.key === key && (sortConfig.order === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />)}
                                                    </button>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sponsors.map(sponsor => (
                                            <tr key={sponsor.id} className="cursor-pointer" onClick={() => navigate(`/sponsors/${sponsor.id}`)}>
                                                <td className="font-medium">{sponsor.name}</td>
                                                <td className="text-body-color">{sponsor.email}</td>
                                                <td className="text-body-color">{formatDateForDisplay(sponsor.sponsorshipStartDate)}</td>
                                                <td className="text-body-color">{sponsor.sponsoredStudentCount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {!loading && sponsors.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
                    </CardContent>
                </Card>
            )}

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