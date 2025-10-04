

    import React, { useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { api } from '@/services/api.ts';
    import { Sponsor } from '@/types.ts';
    import Modal from '@/components/Modal.tsx';
    import { PlusIcon, ArrowUpIcon, ArrowDownIcon, SponsorIcon, CloudUploadIcon } from '@/components/Icons.tsx';
    import { useNotification } from '@/contexts/NotificationContext.tsx';
    import { SkeletonCard, SkeletonTable, SkeletonListItem } from '@/components/SkeletonLoader.tsx';
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
    import { useSettings } from '@/contexts/SettingsContext.tsx';
    import ViewToggle from '@/components/ui/ViewToggle.tsx';
    import { formatDateForDisplay } from '@/utils/dateUtils.ts';
    import PageActions from '@/components/layout/PageActions.tsx';
    import { usePaginatedData } from '@/hooks/usePaginatedData.ts';
    import DataWrapper from '@/components/DataWrapper.tsx';
    import MobileListItem from '@/components/ui/MobileListItem.tsx';
    import { useOffline } from '@/contexts/OfflineContext.tsx';


    const SponsorsPage: React.FC = () => {
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [isAdding, setIsAdding] = useState(false);
        const { showToast } = useNotification();
        const { refetchSponsorLookup } = useData();
        const { canCreate } = usePermissions('sponsors');
        const isMobile = useMediaQuery('(max-width: 767px)');
        const { sponsorViewMode, setSponsorViewMode } = useSettings();
        const navigate = useNavigate();
        const [sponsors, setSponsors] = useState<Sponsor[]>([]);
        const { isOnline, queueChange } = useOffline();

        const { 
            currentPage, apiQueryString, setCurrentPage, handleSort, sortConfig
        } = useTableControls<Sponsor>({
            initialSortConfig: { key: 'name', order: 'asc' },
        });
        
        const { 
            data: paginatedData, isLoading, isStale, refetch 
        } = usePaginatedData<Sponsor>({
            fetcher: api.getSponsors,
            apiQueryString,
            cacheKeyPrefix: 'sponsors',
        });

        useEffect(() => {
            if (paginatedData?.results) {
                setSponsors(paginatedData.results);
            }
        }, [paginatedData]);
    
        useEffect(() => {
            const handleSync = (event: Event) => {
                const customEvent = event as CustomEvent;
                const createdMap = customEvent.detail?.created;
        
                if (createdMap && Object.keys(createdMap).length > 0) {
                    setSponsors(prevList => {
                        let listChanged = false;
                        const newList = prevList.map(sponsor => {
                            if (String(sponsor.id) in createdMap) {
                                listChanged = true;
                                return createdMap[sponsor.id];
                            }
                            return sponsor;
                        });
                        if (listChanged) {
                            refetchSponsorLookup();
                            return newList;
                        }
                        return prevList;
                    });
                    showToast('Offline sponsor changes synced.', 'success');
                } else {
                    showToast('Sponsors synced from server.', 'info');
                    refetch();
                }
            };
            window.addEventListener('offline-sync-complete', handleSync);
            return () => window.removeEventListener('offline-sync-complete', handleSync);
        }, [refetch, refetchSponsorLookup, showToast]);

        const handleSave = async (sponsorData: Omit<Sponsor, 'id' | 'sponsoredStudentCount'>) => {
            setIsSubmitting(true);
            if (!isOnline) {
                const tempId = `temp-${Date.now()}`;
                const newSponsor: Sponsor = { ...sponsorData, id: tempId, sponsoredStudentCount: 0 };
                
                setSponsors(prev => [newSponsor, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
                
                await queueChange({ type: 'CREATE_SPONSOR', payload: newSponsor, timestamp: Date.now() });
                showToast('Offline: Sponsor will be created upon reconnection.', 'info');
                setIsAdding(false);
                setIsSubmitting(false);
                return;
            }
    
            try {
                await api.addSponsor(sponsorData);
                showToast('Sponsor added successfully!', 'success');
                setIsAdding(false);
                refetch();
                refetchSponsorLookup();
            } catch (error: any) {
                showToast(error.message || 'Failed to save sponsor.', 'error');
            } finally {
                setIsSubmitting(false);
            }
        };
        
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
        
        const isInitialLoadAndEmpty = !isLoading && sponsors.length === 0;

        return (
            <div className="space-y-6">
                <PageHeader title="Sponsors">
                    {canCreate && (
                        <PageActions>
                            <Button 
                                onClick={() => setIsAdding(true)} 
                                icon={<PlusIcon className="w-5 h-5" />}
                                aria-label="Add Sponsor"
                            />
                        </PageActions>
                    )}
                </PageHeader>
            
                {isMobile ? (
                    <div className="space-y-3">
                        {isLoading && sponsors.length === 0 ? (
                             <div className="space-y-4">{Array.from({ length: 8 }).map((_, i) => <SkeletonListItem key={i} />)}</div>
                        ) : (
                             <DataWrapper isStale={isStale}>
                                {isInitialLoadAndEmpty ? (
                                    <EmptyState title="No Sponsors Found" message="Add your first sponsor to get started." />
                                ) : (
                                    <>
                                        {sponsors.map(sponsor => {
                                            const isPending = String(sponsor.id).startsWith('temp-');
                                            return (
                                                <MobileListItem
                                                    key={sponsor.id}
                                                    icon={<SponsorIcon className="w-5 h-5 text-primary" />}
                                                    title={
                                                        <div className="flex items-center gap-2">
                                                            {sponsor.name}
                                                            {isPending && <CloudUploadIcon className="w-4 h-4 text-secondary" title="Pending sync" />}
                                                        </div>
                                                    }
                                                    subtitle={`Sponsored Students: ${sponsor.sponsoredStudentCount}`}
                                                    onClick={() => !isPending && navigate(`/sponsors/${sponsor.id}`)}
                                                />
                                            );
                                        })}
                                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                                    </>
                                )}
                            </DataWrapper>
                        )}
                    </div>
                ) : (
                    <Card>
                        <CardContent>
                            <div className="flex justify-end p-4">
                                <ViewToggle view={sponsorViewMode} onChange={setSponsorViewMode} />
                            </div>
                            {isLoading && sponsors.length === 0 ? renderDesktopSkeletons() : (
                                <DataWrapper isStale={isStale}>
                                    {isInitialLoadAndEmpty ? (
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
                                                    {sponsors.map(sponsor => {
                                                        const isPending = String(sponsor.id).startsWith('temp-');
                                                        return (
                                                            <tr key={sponsor.id} className={!isPending ? "cursor-pointer" : ""} onClick={() => !isPending && navigate(`/sponsors/${sponsor.id}`)}>
                                                                <td className="font-medium">
                                                                    <div className="flex items-center gap-2">
                                                                        {sponsor.name}
                                                                        {isPending && <CloudUploadIcon className="w-4 h-4 text-secondary" title="Pending sync" />}
                                                                    </div>
                                                                </td>
                                                                <td className="text-body-color">{sponsor.email}</td>
                                                                <td className="text-body-color">{formatDateForDisplay(sponsor.sponsorshipStartDate)}</td>
                                                                <td className="text-body-color">{sponsor.sponsoredStudentCount}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    {!isInitialLoadAndEmpty && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
                                </DataWrapper>
                            )}
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