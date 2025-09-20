import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api.ts';
import { Sponsor, Student, PaginatedResponse } from '@/types.ts';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { useData } from '@/contexts/DataContext.tsx';
import { SkeletonTable } from '@/components/SkeletonLoader.tsx';
import PageHeader from '@/components/layout/PageHeader.tsx';
import Button from '@/components/ui/Button.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import Modal from '@/components/Modal.tsx';
import SponsorForm from '@/components/sponsors/SponsorForm.tsx';
import { EditIcon, TrashIcon, UserIcon } from '@/components/Icons.tsx';
import { formatDateForDisplay, calculateAge } from '@/utils/dateUtils.ts';
import EmptyState from '@/components/EmptyState.tsx';
import Badge from '@/components/ui/Badge.tsx';
import Pagination from '@/components/Pagination.tsx';
import { useTableControls } from '@/hooks/useTableControls.ts';
import { usePermissions } from '@/contexts/AuthContext.tsx';
import PageActions from '@/components/layout/PageActions.tsx';

const SponsorDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useNotification();
    const { refetchSponsorLookup } = useData();
    const { canUpdate, canDelete } = usePermissions('sponsors');
    
    const [sponsor, setSponsor] = useState<Sponsor | null>(null);
    const [sponsoredStudents, setSponsoredStudents] = useState<PaginatedResponse<Student> | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { currentPage, apiQueryString, setCurrentPage } = useTableControls<Student>({
        initialSortConfig: { key: 'firstName', order: 'asc' },
        initialFilters: { sponsor: id! } // Filter students by the current sponsor ID
    });

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [sponsorData, studentsData] = await Promise.all([
                api.getSponsorById(id),
                api.getStudents(apiQueryString)
            ]);
            setSponsor(sponsorData);
            setSponsoredStudents(studentsData);
        } catch (error: any) {
            showToast(error.message || 'Failed to load sponsor details.', 'error');
            navigate('/sponsors');
        } finally {
            setLoading(false);
        }
    }, [id, apiQueryString, showToast, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdateSponsor = async (sponsorData: Omit<Sponsor, 'sponsoredStudentCount'>) => {
        if (!id) return;
        setIsSubmitting(true);
        try {
            const updatedSponsor = await api.updateSponsor(sponsorData);
            setSponsor(updatedSponsor);
            showToast('Sponsor updated successfully!', 'success');
            setIsEditing(false);
            refetchSponsorLookup();
        } catch (error: any) {
            showToast(error.message || 'Failed to update sponsor.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSponsor = async () => {
        if (!id) return;
        if (window.confirm('Are you sure you want to delete this sponsor? This will not delete the students, but they will become unsponsored.')) {
            try {
                await api.deleteSponsor(id);
                showToast('Sponsor deleted.', 'success');
                refetchSponsorLookup();
                navigate('/sponsors');
            } catch (error: any) {
                showToast(error.message || 'Failed to delete sponsor.', 'error');
            }
        }
    };
    
    const students = sponsoredStudents?.results || [];
    const totalPages = sponsoredStudents ? Math.ceil(sponsoredStudents.count / 15) : 1;

    if (loading || !sponsor) {
        return (
            <>
                <PageHeader title="Loading Sponsor..." />
                <SkeletonTable rows={10} cols={4} />
            </>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader title={sponsor.name}>
                <PageActions>
                    {canUpdate && <Button onClick={() => setIsEditing(true)} variant="secondary" icon={<EditIcon className="w-5 h-5" />}>Edit Sponsor</Button>}
                    {canDelete && <Button onClick={handleDeleteSponsor} variant="danger" icon={<TrashIcon className="w-5 h-5" />}>Delete Sponsor</Button>}
                </PageActions>
            </PageHeader>
            
            <Card>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <p className="text-sm text-body-color dark:text-gray-300">Email</p>
                        <p className="font-medium text-black dark:text-white">{sponsor.email}</p>
                    </div>
                    <div>
                        <p className="text-sm text-body-color dark:text-gray-300">Sponsorship Start Date</p>
                        <p className="font-medium text-black dark:text-white">{formatDateForDisplay(sponsor.sponsorshipStartDate)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-body-color dark:text-gray-300">Sponsored Students</p>
                        <p className="font-medium text-black dark:text-white">{sponsor.sponsoredStudentCount}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <h3 className="text-xl font-semibold text-black dark:text-white mb-4">Sponsored Students</h3>
                    {students.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-2 dark:bg-box-dark-2">
                                            <th className="py-4 px-4 font-medium text-black dark:text-white">Name</th>
                                            <th className="py-4 px-4 font-medium text-black dark:text-white">Student ID</th>
                                            <th className="py-4 px-4 font-medium text-black dark:text-white">Age</th>
                                            <th className="py-4 px-4 font-medium text-black dark:text-white">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map(s => (
                                            <tr key={s.studentId} className="hover:bg-gray-2 dark:hover:bg-box-dark-2">
                                                <td className="py-5 px-4 flex items-center gap-3 border-b border-stroke dark:border-strokedark">
                                                    {s.profilePhoto ? (
                                                        <img src={s.profilePhoto} alt={`${s.firstName}`} className="w-10 h-10 rounded-full object-cover"/>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gray-2 dark:bg-box-dark-2 flex items-center justify-center">
                                                            <UserIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                                        </div>
                                                    )}
                                                    <p className="font-medium text-black dark:text-white">{s.firstName} {s.lastName}</p>
                                                </td>
                                                <td className="py-5 px-4 text-body-color dark:text-gray-300 border-b border-stroke dark:border-strokedark">{s.studentId}</td>
                                                <td className="py-5 px-4 text-body-color dark:text-gray-300 border-b border-stroke dark:border-strokedark">{calculateAge(s.dateOfBirth)}</td>
                                                <td className="py-5 px-4 border-b border-stroke dark:border-strokedark"><Badge type={s.studentStatus} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                        </>
                    ) : (
                        <EmptyState title="No Sponsored Students" message="This sponsor is not currently linked to any students." />
                    )}
                </CardContent>
            </Card>

            <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title={`Edit Sponsor: ${sponsor.name}`}>
                <SponsorForm
                    initialData={sponsor}
                    onSave={(data) => handleUpdateSponsor({ ...data, id: sponsor.id })}
                    onCancel={() => setIsEditing(false)}
                    isSubmitting={isSubmitting}
                />
            </Modal>
        </div>
    );
};

export default SponsorDetailPage;
