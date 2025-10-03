import React, { useState } from 'react';
import { api } from '@/services/api.ts';
import { AppUser, UserStatus } from '@/types.ts';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { useTableControls } from '@/hooks/useTableControls.ts';
import { SkeletonCard, SkeletonTable, SkeletonListItem } from '@/components/SkeletonLoader.tsx';
import PageHeader from '@/components/layout/PageHeader.tsx';
import Pagination from '@/components/Pagination.tsx';
import Modal from '@/components/Modal.tsx';
import Button from '@/components/ui/Button.tsx';
import EmptyState from '@/components/EmptyState.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import { PlusIcon, UserIcon, TrashIcon, KeyIcon, ArrowUpIcon, ArrowDownIcon } from '@/components/Icons.tsx';
import UserForm from '@/components/users/UserForm.tsx';
import { useAuth, usePermissions } from '@/contexts/AuthContext.tsx';
import ConfirmationModal from '@/components/ConfirmationModal.tsx';
import Tabs, { Tab } from '@/components/ui/Tabs.tsx';
import PermissionsManager from '@/components/PermissionsManager.tsx';
import UserCard from '@/components/users/UserCard.tsx';
import useMediaQuery from '@/hooks/useMediaQuery.ts';
import { useSettings } from '@/contexts/SettingsContext.tsx';
import ViewToggle from '@/components/ui/ViewToggle.tsx';
import ActionDropdown, { ActionItem } from '@/components/ActionDropdown.tsx';
import { formatDateForDisplay } from '@/utils/dateUtils.ts';
import Badge from '@/components/ui/Badge.tsx';
import PageActions from '@/components/layout/PageActions.tsx';
import { usePaginatedData } from '@/hooks/usePaginatedData.ts';
import DataWrapper from '@/components/DataWrapper.tsx';
import MobileListItem from '@/components/ui/MobileListItem.tsx';


const UsersList: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingUser, setEditingUser] = useState<AppUser | null>(null);
    const [isInviting, setIsInviting] = useState(false);
    const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);
    const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
    const { showToast } = useNotification();
    const { user: currentUser } = useAuth();
    const { canCreate, canUpdate, canDelete } = usePermissions('users');
    const isMobile = useMediaQuery('(max-width: 767px)');
    const { userViewMode, setUserViewMode } = useSettings();

    const {
        currentPage, apiQueryString, setCurrentPage, handleSort, sortConfig
    } = useTableControls<AppUser>({
        initialSortConfig: { key: 'username', order: 'asc' }
    });

    const { 
        data: paginatedData, isLoading, isStale, refetch 
    } = usePaginatedData<AppUser>({
        fetcher: api.getUsers,
        apiQueryString,
        cacheKeyPrefix: 'users',
    });

    const handleInviteUser = async (email: string, role: string) => {
        setIsSubmitting(true);
        try {
            const result = await api.inviteUser(email, role);
            showToast(result.message, 'success');
            setIsInviting(false);
            refetch();
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
            refetch();
        } catch (error: any) {
            showToast(error.message || 'Failed to update user.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = (user: AppUser) => {
        setDeletingUser(user);
    };

    const handleSendPasswordReset = async (user: AppUser) => {
        try {
            const result = await api.requestPasswordReset(user.email);
            showToast(result.message, 'success');
        } catch(error: any) {
            showToast(error.message || 'Failed to send password reset link.', 'error');
        }
    };

    const handleConfirmDelete = async () => {
        if (!deletingUser) return;
        setIsSubmittingDelete(true);
        try {
            await api.deleteUser(deletingUser.id);
            showToast('User deleted successfully.', 'success');
            setDeletingUser(null);
            refetch();
        } catch (error: any) {
            showToast(error.message || 'Failed to delete user.', 'error');
        } finally {
            setIsSubmittingDelete(false);
        }
    };

    const users = paginatedData?.results || [];
    const totalPages = paginatedData ? Math.ceil(paginatedData.count / 15) : 1;

    const renderDesktopSkeletons = () => {
        if (userViewMode === 'card') {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            );
        }
        return <SkeletonTable rows={5} cols={6} />;
    };

    return (
        <>
             {isMobile ? (
                 <div className="space-y-4">
                    {canCreate && (
                        <div className="px-4">
                            <Button onClick={() => setIsInviting(true)} icon={<PlusIcon className="w-5 h-5" />} className="w-full">
                                Invite New User
                            </Button>
                        </div>
                    )}
                    {isLoading ? (
                        <div className="space-y-4">{Array.from({ length: 8 }).map((_, i) => <SkeletonListItem key={i} />)}</div>
                    ) : (
                        <DataWrapper isStale={isStale}>
                           {users.length > 0 ? (
                                <div className="space-y-3">
                                    {users.map(user => {
                                        const isCurrentUser = currentUser?.id === user.id;
                                        const actionItems: ActionItem[] = [];
                                        if (canUpdate) actionItems.push({ label: 'Edit', icon: <UserIcon className="w-4 h-4" />, onClick: () => setEditingUser(user) });
                                        if (canUpdate && user.status === UserStatus.ACTIVE && !isCurrentUser) actionItems.push({ label: 'Send Password Set', icon: <KeyIcon className="w-4 h-4" />, onClick: () => handleSendPasswordReset(user) });
                                        if (!isCurrentUser && canDelete) actionItems.push({ label: 'Delete', icon: <TrashIcon className="w-4 h-4" />, onClick: () => handleDeleteUser(user), className: 'text-danger' });

                                        return (
                                             <MobileListItem
                                                key={user.id}
                                                icon={<UserIcon className="w-5 h-5 text-gray-500" />}
                                                title={user.username}
                                                subtitle={user.role}
                                                rightContent={
                                                    <div className="flex items-center gap-2">
                                                        <Badge type={user.status} />
                                                        {actionItems.length > 0 && 
                                                            <div onClick={(e) => e.stopPropagation()}>
                                                                <ActionDropdown items={actionItems} />
                                                            </div>
                                                        }
                                                    </div>
                                                }
                                                // Prevent main item click if actions exist
                                                onClick={actionItems.length === 0 && canUpdate ? () => setEditingUser(user) : undefined}
                                                showChevron={actionItems.length === 0 && canUpdate}
                                            />
                                        );
                                    })}
                                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                                </div>
                           ) : (
                               <EmptyState title="No Users Found" />
                           )}
                        </DataWrapper>
                    )}
                 </div>
            ) : (
                <Card>
                    <CardContent>
                        <div className="flex justify-between items-center mb-4 p-4">
                            <ViewToggle view={userViewMode} onChange={setUserViewMode} />
                             {canCreate && (
                                <PageActions>
                                    <Button onClick={() => setIsInviting(true)} icon={<PlusIcon className="w-5 h-5" />} size="sm" aria-label="Invite User" />
                                </PageActions>
                            )}
                        </div>
                        {isLoading ? renderDesktopSkeletons() : (
                            <DataWrapper isStale={isStale}>
                                {users.length > 0 ? (
                                    <>
                                        {userViewMode === 'card' ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {users.map((user) => {
                                                    const isCurrentUser = currentUser?.id === user.id;
                                                    const actionItems: ActionItem[] = [];

                                                    if(canUpdate) actionItems.push({ label: 'Edit', icon: <UserIcon className="w-4 h-4" />, onClick: () => setEditingUser(user) });
                                                    if (canUpdate && user.status === UserStatus.ACTIVE && !isCurrentUser) actionItems.push({ label: 'Send Password Set', icon: <KeyIcon className="w-4 h-4" />, onClick: () => handleSendPasswordReset(user) });
                                                    if (!isCurrentUser && canDelete) actionItems.push({ label: 'Delete', icon: <TrashIcon className="w-4 h-4" />, onClick: () => handleDeleteUser(user), className: 'text-danger' });
                                                    
                                                    return <UserCard key={user.id} user={user} actionItems={actionItems} />;
                                                })}
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="ui-table">
                                                    <thead><tr>{(['username', 'email', 'role', 'status', 'lastLogin'] as const).map(key => (<th key={key}><button className="flex items-center gap-1 hover:text-primary" onClick={() => handleSort(key)}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}{sortConfig?.key === key && (sortConfig.order === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />)}</button></th>))}<th className="text-center">Actions</th></tr></thead>
                                                    <tbody>
                                                        {users.map(user => {
                                                            const isCurrentUser = currentUser?.id === user.id;
                                                            const actionItems: ActionItem[] = [];
                                                            if (canUpdate) actionItems.push({ label: 'Edit', icon: <UserIcon className="w-4 h-4" />, onClick: () => setEditingUser(user) });
                                                            if (canUpdate && user.status === UserStatus.ACTIVE && !isCurrentUser) actionItems.push({ label: 'Send Password Set', icon: <KeyIcon className="w-4 h-4" />, onClick: () => handleSendPasswordReset(user) });
                                                            if (!isCurrentUser && canDelete) actionItems.push({ label: 'Delete', icon: <TrashIcon className="w-4 h-4" />, onClick: () => handleDeleteUser(user), className: 'text-danger' });

                                                            return (<tr key={user.id}><td className="font-medium">{user.username}</td><td className="text-body-color">{user.email}</td><td><Badge type={user.role} /></td><td><Badge type={user.status} /></td><td className="text-body-color">{user.lastLogin ? formatDateForDisplay(user.lastLogin) : 'Never'}</td><td className="text-center">{actionItems.length > 0 && <ActionDropdown items={actionItems} />}</td></tr>);
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                                    </>
                                ) : ( <EmptyState title="No Users Found" icon={<UserIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />} /> )}
                            </DataWrapper>
                        )}
                    </CardContent>
                </Card>
            )}
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
        </>
    );
};

const UsersAndRolesPage: React.FC = () => {
    const tabs: Tab[] = [
        { id: 'users', label: 'Users', content: <UsersList /> },
        { id: 'roles', label: 'Roles & Permissions', content: <PermissionsManager /> },
    ];
    
    return (
        <div className="space-y-6">
            <PageHeader title="Users & Roles" />
            <Tabs tabs={tabs} />
        </div>
    );
};

export default UsersAndRolesPage;