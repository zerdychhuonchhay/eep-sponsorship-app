import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api.ts';
import { AppUser, PaginatedResponse } from '@/types.ts';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { useTableControls } from '@/hooks/useTableControls.ts';
import { SkeletonTable } from '@/components/SkeletonLoader.tsx';
import PageHeader from '@/components/layout/PageHeader.tsx';
import Pagination from '@/components/Pagination.tsx';
import Modal from '@/components/Modal.tsx';
import Button from '@/components/ui/Button.tsx';
import Badge from '@/components/ui/Badge.tsx';
import EmptyState from '@/components/EmptyState.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import { PlusIcon, ArrowUpIcon, ArrowDownIcon, EditIcon, UserIcon, TrashIcon } from '@/components/Icons.tsx';
import ActionDropdown from '@/components/ActionDropdown.tsx';
import UserForm from '@/components/users/UserForm.tsx';
import { formatDateForDisplay } from '@/utils/dateUtils.ts';
import { useAuth, usePermissions } from '@/contexts/AuthContext.tsx';
import ConfirmationModal from '@/components/ConfirmationModal.tsx';

const UserManagementPage: React.FC = () => {
    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<AppUser> | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingUser, setEditingUser] = useState<AppUser | null>(null);
    const [isInviting, setIsInviting] = useState(false);
    const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);
    const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
    const { showToast } = useNotification();
    const { user: currentUser } = useAuth();
    const { canCreate, canUpdate, canDelete } = usePermissions('users');

    const {
        sortConfig, currentPage, apiQueryString,
        handleSort, setCurrentPage
    } = useTableControls<AppUser>({
        initialSortConfig: { key: 'username', order: 'asc' }
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getUsers(apiQueryString);
            setPaginatedData(data);
        } catch (error: any) {
            showToast(error.message || 'Failed to load user data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [apiQueryString, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInviteUser = async (email: string, role: string) => {
        setIsSubmitting(true);
        try {
            const result = await api.inviteUser(email, role);
            showToast(result.message, 'success');
            setIsInviting(false);
            fetchData();
        } catch (error: any) {
            showToast(error.message || 'Failed to send invitation.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateUser = async (userId: number, data: Partial<Pick<AppUser, 'role' | 'status'>>) => {
        setIsSubmitting(true);
        try {
            await api.updateUser(userId, data);
            showToast('User updated successfully!', 'success');
            setEditingUser(null);
            fetchData();
        } catch (error: any) {
            showToast(error.message || 'Failed to update user.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteUser = (user: AppUser) => {
        setDeletingUser(user);
    };

    const handleConfirmDelete = async () => {
        if (!deletingUser) return;
        setIsSubmittingDelete(true);
        try {
            await api.deleteUser(deletingUser.id);
            showToast('User deleted successfully.', 'success');
            setDeletingUser(null);
            fetchData();
        } catch (error: any) {
            showToast(error.message || 'Failed to delete user.', 'error');
        } finally {
            setIsSubmittingDelete(false);
        }
    };


    const users = paginatedData?.results || [];
    const totalPages = paginatedData ? Math.ceil(paginatedData.count / 15) : 1;

    if (loading && !paginatedData) {
        return (
            <>
                <PageHeader title="Manage Users" />
                <SkeletonTable rows={10} cols={5} />
            </>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Manage Users">
                {canCreate && (
                    <Button onClick={() => setIsInviting(true)} icon={<PlusIcon className="w-5 h-5" />}>
                        Invite User
                    </Button>
                )}
            </PageHeader>

            <Card>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-2 dark:bg-box-dark-2">
                                    {(['username', 'role', 'status', 'lastLogin'] as (keyof AppUser)[]).map(key => (
                                        <th key={key as string} className="py-4 px-4 font-medium text-black dark:text-white">
                                            <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort(key)}>
                                                {String(key).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                {sortConfig?.key === key && (sortConfig.order === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />)}
                                            </button>
                                        </th>
                                    ))}
                                    <th className="py-4 px-4 font-medium text-black dark:text-white text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length > 0 ? users.map((user) => {
                                    const isCurrentUser = currentUser?.id === user.id;
                                    const actionItems: { label: string; icon: React.ReactNode; onClick: () => void; className?: string }[] = [];

                                    if(canUpdate) {
                                        actionItems.push({ label: 'Edit', icon: <EditIcon className="w-4 h-4" />, onClick: () => setEditingUser(user) });
                                    }
                                    if (!isCurrentUser && canDelete) {
                                        actionItems.push({ label: 'Delete', icon: <TrashIcon className="w-4 h-4" />, onClick: () => handleDeleteUser(user), className: 'text-danger' });
                                    }

                                    return (
                                        <tr key={user.id} className="hover:bg-gray-2 dark:hover:bg-box-dark-2">
                                            <td className="py-5 px-4 border-b border-stroke dark:border-strokedark">
                                                <p className="font-medium text-black dark:text-white">{user.username}</p>
                                                <p className="text-sm text-body-color dark:text-gray-300">{user.email}</p>
                                            </td>
                                            <td className="py-5 px-4 border-b border-stroke dark:border-strokedark">
                                                <Badge type={user.role} />
                                            </td>
                                            <td className="py-5 px-4 border-b border-stroke dark:border-strokedark">
                                                <Badge type={user.status} />
                                            </td>
                                            <td className="py-5 px-4 text-body-color dark:text-gray-300 border-b border-stroke dark:border-strokedark">
                                                {formatDateForDisplay(user.lastLogin || undefined)}
                                            </td>
                                            <td className="py-5 px-4 border-b border-stroke dark:border-strokedark text-center">
                                                {actionItems.length > 0 && <ActionDropdown items={actionItems} />}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={5}>
                                            <EmptyState title="No Users Found" icon={<UserIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />} />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {users.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
                </CardContent>
            </Card>

            <Modal isOpen={isInviting || !!editingUser} onClose={() => { setIsInviting(false); setEditingUser(null); }}>
                <UserForm
                    key={editingUser ? editingUser.id : 'invite'}
                    user={editingUser}
                    currentUserId={currentUser?.id}
                    onInvite={handleInviteUser}
                    onUpdate={handleUpdateUser}
                    onCancel={() => { setIsInviting(false); setEditingUser(null); }}
                    isSubmitting={isSubmitting}
                />
            </Modal>

            <ConfirmationModal
                isOpen={!!deletingUser}
                onClose={() => setDeletingUser(null)}
                onConfirm={handleConfirmDelete}
                title="Delete User"
                message={`Are you sure you want to permanently delete the user "${deletingUser?.username}"? This action cannot be undone.`}
                confirmText="Delete"
                isConfirming={isSubmittingDelete}
            />
        </div>
    );
};

export default UserManagementPage;