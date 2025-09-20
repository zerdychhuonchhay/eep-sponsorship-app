import React from 'react';
import { AppUser } from '@/types.ts';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import { UserIcon } from '@/components/Icons.tsx';
import Badge from '@/components/ui/Badge.tsx';
import ActionDropdown, { ActionItem } from '@/components/ActionDropdown.tsx';
import { formatDateForDisplay } from '@/utils/dateUtils.ts';

interface UserCardProps {
    user: AppUser;
    actionItems: ActionItem[];
}

const UserCard: React.FC<UserCardProps> = ({ user, actionItems }) => {
    return (
        <Card className="relative flex flex-col">
            {actionItems.length > 0 && (
                <div className="absolute top-2 right-2 z-10">
                    <ActionDropdown items={actionItems} />
                </div>
            )}
            <CardContent className="flex flex-col flex-grow p-4">
                 <div className="flex items-center gap-4 mb-4">
                     <div className="w-12 h-12 rounded-full bg-gray-2 dark:bg-box-dark-2 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-6 h-6 text-gray-500" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <h3 className="text-lg font-semibold text-black dark:text-white truncate" title={user.username}>
                            {user.username}
                        </h3>
                        <p className="text-sm text-body-color dark:text-gray-300 truncate" title={user.email}>
                            {user.email}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Badge type={user.role} />
                    <Badge type={user.status} />
                </div>
                 <div className="mt-auto pt-4 border-t border-stroke dark:border-strokedark text-sm">
                    <p className="text-body-color dark:text-gray-400">Last Login</p>
                    <p className="font-medium text-black dark:text-white">
                        {user.lastLogin ? formatDateForDisplay(user.lastLogin) : 'Never'}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default UserCard;