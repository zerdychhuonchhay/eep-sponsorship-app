import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api.ts';
import { Role, Permissions } from '@/types.ts';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import Button from './ui/Button.tsx';
import { useData } from '@/contexts/DataContext.tsx';
import { PlusIcon, EditIcon, TrashIcon, ArrowDownIcon, ArrowUpIcon } from './Icons.tsx';
import RoleFormModal from './RoleFormModal.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';

const APP_MODULES = [
    { id: 'students', name: 'Students' },
    { id: 'sponsors', name: 'Sponsors' },
    { id: 'transactions', name: 'Transactions' },
    { id: 'academics', name: 'Academics' },
    { id: 'tasks', name: 'Tasks' },
    { id: 'filings', name: 'Filings' },
    { id: 'reports', name: 'Reports' },
    { id: 'audit', name: 'Audit Log' },
    { id: 'users', name: 'User Management' }
];

const PERMISSION_TYPES = ['create', 'read', 'update', 'delete'] as const;

const PermissionsManager: React.FC = () => {
    const [rolesWithPermissions, setRolesWithPermissions] = useState<Role[]>([]);
    const { refetchRoles } = useData();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
    const { showToast } = useNotification();
    const [expandedRoleId, setExpandedRoleId] = useState<number | null>(null);
    
    const [modalState, setModalState] = useState<{ type: 'add' | 'edit'; role?: Pick<Role, 'id' | 'name'> } | null>(null);
    const [deletingRole, setDeletingRole] = useState<Pick<Role, 'id' | 'name'> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const rolesData = await api.getRolePermissions();
            setRolesWithPermissions(rolesData);
            
            // This logic ensures that an expanded role is set correctly after data fetch.
            setExpandedRoleId(currentExpandedId => {
                const roleStillExists = rolesData.some(role => role.id === currentExpandedId);

                if (roleStillExists) {
                    return currentExpandedId; // Keep current expansion if role still exists
                }
                if (rolesData.length > 0) {
                    return rolesData[0].id; // Otherwise, expand the first role
                }
                return null; // Or collapse if no roles exist
            });

        } catch (error: any) {
            showToast(error.message || 'Failed to load role permissions.', 'error');
            setRolesWithPermissions([]);
            setExpandedRoleId(null);
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const handlePermissionChange = (roleId: number, module: string, permission: 'create' | 'read' | 'update' | 'delete', value: boolean) => {
        setRolesWithPermissions(prevRoles =>
            prevRoles.map(role => {
                if (role.id === roleId) {
                    const updatedPermissions: Permissions = {
                        ...role.permissions,
                        [module]: {
                            ...(role.permissions?.[module] || { create: false, read: false, update: false, delete: false }),
                            [permission]: value
                        }
                    };
                    return { ...role, permissions: updatedPermissions };
                }
                return role;
            })
        );
    };

    const handleSaveChanges = async (role: Role) => {
        setIsSaving(prev => ({ ...prev, [role.name]: true }));
        try {
            if (!role.permissions) throw new Error("Permissions data is missing.");
            await api.updateRolePermissions(role.name, role.permissions);
            showToast(`Permissions for ${role.name} updated successfully!`, 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to save permissions.', 'error');
        } finally {
            setIsSaving(prev => ({ ...prev, [role.name]: false }));
        }
    };
    
    const handleSaveRole = async (roleName: string) => {
        setIsSubmitting(true);
        try {
            if (modalState?.type === 'edit' && modalState.role) {
                await api.updateGroup(modalState.role.id, roleName);
                showToast(`Role "${modalState.role.name}" updated to "${roleName}".`, 'success');
            } else {
                await api.addGroup(roleName);
                showToast(`Role "${roleName}" created successfully.`, 'success');
            }
            await Promise.all([refetchRoles(), fetchData()]);
            setModalState(null);
        } catch (error: any) {
            showToast(error.message || 'Failed to save role.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRole = async () => {
        if (!deletingRole) return;
        setIsSubmitting(true);
        try {
            await api.deleteGroup(deletingRole.id);
            showToast(`Role "${deletingRole.name}" deleted.`, 'success');
            await Promise.all([refetchRoles(), fetchData()]);
            setDeletingRole(null);
        } catch (error: any) {
            showToast(error.message || 'Failed to delete role.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent, roleId: number) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpandedRoleId(expandedRoleId === roleId ? null : roleId);
        }
    };

    if (isLoading) {
        return <div className="text-center p-4">Loading roles & permissions...</div>;
    }
    
    const displayRoles = rolesWithPermissions.filter(role => role.name !== 'Administrator');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <div>
                    <h3 className="text-lg font-semibold text-black dark:text-white">Roles & Permissions</h3>
                    <p className="text-sm text-body-color dark:text-gray-300">
                        Define what users in each role can see and do.
                    </p>
                </div>
                <Button onClick={() => setModalState({ type: 'add' })} icon={<PlusIcon />} size="sm">
                    Add Role
                </Button>
            </div>
            
            <div className="space-y-2">
                {displayRoles.length === 0 && <p className="text-body-color text-center py-4">No roles available to configure. Please add a role first.</p>}
                {displayRoles.map(role => (
                    <div key={role.id} className="rounded-lg border border-stroke dark:border-strokedark">
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => setExpandedRoleId(expandedRoleId === role.id ? null : role.id)}
                            onKeyDown={(e) => handleKeyDown(e, role.id)}
                            className="w-full p-4 text-left flex justify-between items-center bg-gray-2 dark:bg-box-dark-2 hover:bg-gray/80 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary rounded-t-lg"
                            aria-expanded={expandedRoleId === role.id}
                            aria-controls={`permissions-panel-${role.id}`}
                        >
                            <span className="font-semibold text-black dark:text-white">{role.name}</span>
                            <div className="flex items-center gap-2">
                                <Button onClick={(e) => { e.stopPropagation(); setModalState({ type: 'edit', role }); }} icon={<EditIcon />} size="sm" variant="ghost" />
                                <Button onClick={(e) => { e.stopPropagation(); setDeletingRole(role); }} icon={<TrashIcon />} size="sm" variant="ghost" className="text-danger" />
                                <span>{expandedRoleId === role.id ? <ArrowUpIcon /> : <ArrowDownIcon />}</span>
                            </div>
                        </div>

                        {expandedRoleId === role.id && (
                             <div className="p-4" id={`permissions-panel-${role.id}`}>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-2 dark:bg-box-dark-2">
                                            <tr>
                                                <th className="p-2 font-medium text-black dark:text-white">Module</th>
                                                {PERMISSION_TYPES.map(p => <th key={p} className="p-2 text-center font-medium text-black dark:text-white capitalize">{p}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {APP_MODULES.map(module => (
                                                <tr key={module.id} className="border-b border-stroke dark:border-strokedark">
                                                    <td className="p-2 font-medium text-black dark:text-white">{module.name}</td>
                                                    {PERMISSION_TYPES.map(pType => (
                                                        <td key={pType} className="p-2 text-center">
                                                            <input
                                                                type="checkbox"
                                                                className="form-checkbox h-4 w-4 rounded text-primary"
                                                                checked={role.permissions?.[module.id]?.[pType] || false}
                                                                onChange={(e) => handlePermissionChange(role.id, module.id, pType, e.target.checked)}
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                 <div className="flex justify-end mt-4">
                                    <Button onClick={() => handleSaveChanges(role)} isLoading={isSaving[role.name]} size="sm">
                                        Save Permissions for {role.name}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            {modalState && (
                <RoleFormModal
                    isOpen={!!modalState}
                    onClose={() => setModalState(null)}
                    onSave={handleSaveRole}
                    initialData={modalState.type === 'edit' ? modalState.role : undefined}
                    isSubmitting={isSubmitting}
                />
            )}
            {deletingRole && (
                <ConfirmationModal
                    isOpen={!!deletingRole}
                    onClose={() => setDeletingRole(null)}
                    onConfirm={handleDeleteRole}
                    title={`Delete Role: ${deletingRole.name}`}
                    message={`Are you sure you want to delete the "${deletingRole.name}" role? Users in this role will lose their assigned permissions.`}
                    confirmText="Delete Role"
                    isConfirming={isSubmitting}
                />
            )}
        </div>
    );
};

export default PermissionsManager;
